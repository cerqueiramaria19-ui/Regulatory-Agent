import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Area, Priority, Status, SavedAnalysis, ValuePropositionData, RegulatoryChecklistData } from '../types';

// Helper function to convert file to a Part object for the Gemini API
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string; }; } | { text: string; }> => {
  // 1. Handle Plain Text files
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    const textContent = await file.text();
    return { text: textContent };
  }

  // 2. Handle DOCX files (Gemini doesn't support DOCX blobs natively, so we extract text)
  if (file.name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = (window as any).mammoth;
    if (mammoth) {
        try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            if (!result.value || result.value.trim().length === 0) {
                throw new Error("O arquivo Word parece estar vazio ou não contém texto extraível.");
            }
            return { text: result.value };
        } catch (e) {
            console.error("Erro na extração do Mammoth:", e);
            throw new Error("Não foi possível ler o conteúdo do arquivo Word (.docx). Tente converter para PDF.");
        }
    } else {
        throw new Error("Biblioteca de conversão Word não carregada. Por favor, recarregue a página.");
    }
  }

  // 3. Handle PDF (Native Gemini support)
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error("Falha ao ler o arquivo como string."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: 'application/pdf',
        },
    };
  }

  throw new Error(`O formato de arquivo '${file.name.split('.').pop()}' não é suportado. Utilize PDF, DOCX ou TXT.`);
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Resumo conciso do propósito principal do documento." },
        complianceScore: { type: Type.NUMBER, description: "Score de 0 a 5 representando complexidade e risco (5 = crítico)." },
        requirements: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "ID único (REQ-001...)" },
                    requirementText: { type: Type.STRING, description: "Texto resumido do requisito." },
                    detailedDescription: { type: Type.STRING, description: "Explicação prática detalhada." },
                    area: { type: Type.STRING, description: "Área: Compliance, Jurídico ou TI" },
                    priority: { type: Type.STRING, description: "Prioridade: Alta, Média ou Baixa" },
                    status: { type: Type.STRING, description: "Sempre 'Não Iniciado'" },
                    textualEvidence: { type: Type.STRING, description: "Citação do texto original." },
                    necessaryAction: { type: Type.STRING, description: "Ação clara para cumprimento." },
                    serviceProposal: { type: Type.STRING, description: "Sugestão de serviço de consultoria BIP." },
                    estimatedDeadline: { type: Type.STRING, description: "Prazo ou string vazia." },
                    responsible: { type: Type.STRING, description: "Depto sugerido." },
                    nonComplianceRisks: { type: Type.STRING, description: "Penalidades ou riscos." }
                },
                required: ["id", "requirementText", "detailedDescription", "area", "priority", "status", "textualEvidence", "necessaryAction", "serviceProposal", "estimatedDeadline", "responsible", "nonComplianceRisks"]
            }
        },
        discrepancies: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    description: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    severity: { type: Type.STRING }
                },
                required: ["id", "description", "suggestion", "severity"]
            }
        },
        fundingAgentMentions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    mention: { type: Type.STRING },
                    pageNumber: { type: Type.INTEGER },
                    context: { type: Type.STRING }
                },
                required: ["mention", "pageNumber", "context"]
            }
        }
    },
    required: ["summary", "complianceScore", "requirements", "discrepancies", "fundingAgentMentions"]
};

export const analyzeDocument = async (file: File, instructions: string): Promise<AnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const filePart = await fileToGenerativePart(file);
    const isTextContent = 'text' in filePart;

    const instructionText = instructions 
        ? `\n\nFoco especial solicitado pelo usuário: "${instructions}".`
        : '';

    const basePrompt = `Analise o documento regulatório anexo e extraia os requisitos, discrepâncias e menções a agentes financiadores. 
    Retorne a resposta EXATAMENTE no formato JSON conforme o esquema definido.${instructionText}
    Importante: Todos os requisitos devem ter status inicial como '${Status.NOT_STARTED}'.`;

    const contents = isTextContent
        ? [{ parts: [{ text: `${basePrompt}\n\nCONTEÚDO DO DOCUMENTO:\n${filePart.text}` }] }]
        : [{ parts: [filePart, { text: basePrompt }] }];

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            }
        });

        if (!response.text) {
            throw new Error("A IA retornou uma resposta vazia. Verifique se o arquivo contém texto legível.");
        }

        return JSON.parse(response.text) as AnalysisResult;
    } catch (error: any) {
        console.error("Erro Gemini API:", error);
        throw new Error(error.message || "Falha na comunicação com a API de inteligência artificial.");
    }
};

const valuePropositionSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "Sumário executivo de alto nível para o Board/Diretoria." },
        regulatoryChallenges: { type: Type.STRING, description: "Visão geral dos desafios regulatórios críticos no contexto bancário." },
        strategicFramework: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    areaName: { type: Type.STRING, description: "Nome do pilar (ex: Governança, Tecnologia, etc.)" },
                    pillarType: { type: Type.STRING, enum: ["governance", "operations", "technology", "risk"] },
                    challenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mínimo de 5 desafios específicos e técnicos (ex: legado, dados)." },
                    strategicRecommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mínimo de 5 recomendações estratégicas de alto nível." },
                    recommendations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                horizon: { type: Type.STRING, enum: ["Immediate", "Structural", "Innovation"] },
                                text: { type: Type.STRING }
                            },
                            required: ["horizon", "text"]
                        }
                    }
                },
                required: ["areaName", "pillarType", "challenges", "strategicRecommendations", "recommendations"]
            }
        },
        businessImpact: {
            type: Type.OBJECT,
            properties: {
                capitalEfficiency: { type: Type.STRING, description: "Impacto em Basileia, provisões e eficiência de capital." },
                reputationalRisk: { type: Type.STRING, description: "Impacto no rating e confiança do mercado." },
                operationalResilience: { type: Type.STRING, description: "Impacto na continuidade de negócios e sistemas." }
            },
            required: ["capitalEfficiency", "reputationalRisk", "operationalResilience"]
        },
        ourSolution: { type: Type.STRING, description: "Proposta de valor da consultoria BIP focada em IFs." },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["executiveSummary", "regulatoryChallenges", "strategicFramework", "businessImpact", "ourSolution", "nextSteps"]
};

const regulatoryChecklistSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    requirement: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    isCritical: { type: Type.BOOLEAN }
                },
                required: ["id", "requirement", "description", "impact", "isCritical"]
            }
        }
    },
    required: ["title", "description", "items"]
};

export const generateRegulatoryChecklist = async (analysis: SavedAnalysis): Promise<RegulatoryChecklistData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um Consultor Estratégico Sênior da BIP especialista em Técnicas de Clarificação. 
    Sua missão é criar um "Diagnóstico de Clarificação Estratégica" baseado na análise técnica do documento ${analysis.fileName}.
    
    OBJETIVO: Este checklist utiliza a TÉCNICA DE CLARIFICAÇÃO para desvendar a real situação do cliente. O objetivo não é apenas perguntar se eles têm algo, mas ajudar o cliente a clarificar seus próprios processos e desvendar problemas ocultos.
    
    TÉCNICA DE CLARIFICAÇÃO:
    - Peça detalhes específicos ("Como isso funciona na prática hoje?").
    - Peça exemplos ("Pode me dar um exemplo de quando esse controle falhou?").
    - Questione a definição ("O que a instituição entende por 'linhagem automatizada' neste contexto?").
    - Explore o 'porquê' e o 'como' para chegar na raiz do gap.
    
    RESUMO TÉCNICO: ${analysis.summary}
    REQUISITOS EXTRAÍDOS: ${JSON.stringify(analysis.requirements.slice(0, 25))}
    
    DIRETRIZES PARA OS ITENS (Gere EXATAMENTE 10 itens):
    1. REQUIREMENT: O pilar estratégico ou requisito crítico.
    2. DESCRIPTION: Formule uma "Pergunta de Clarificação Estratégica". 
       - EVITE: Perguntas binárias (Sim/Não) ou superficiais.
       - PREFIRA: "Ao olharmos para o requisito de [X], como vocês garantem que a informação flui sem perdas entre as áreas? Onde exatamente vocês sentem que a comunicação ou o dado se perde?" ou "Poderia me detalhar como é feita a validação desse reporte hoje? Qual o nível de intervenção manual que ainda existe?"
    3. IMPACT: O problema real que a clarificação ajuda a expor (ex: "Inconsistência latente entre silos de dados e risco de reporte falho").
    4. CRITICALITY: Marque como isCritical: true se for um ponto onde a falta de clareza gera alto risco.
    
    O tom deve ser investigativo, inteligente e focado em desvendar a realidade operacional para propor a melhor solução de consultoria.
    
    Retorne um JSON seguindo estritamente o esquema fornecido.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: regulatoryChecklistSchema,
            }
        });

        return JSON.parse(response.text || '{}') as RegulatoryChecklistData;
    } catch (error: any) {
        console.error("Erro Checklist Regulatório:", error);
        throw new Error("Falha ao gerar o diagnóstico de clarificação.");
    }
};

export const generateValueProposition = async (analysis: SavedAnalysis): Promise<ValuePropositionData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um Consultor Sênior de Estratégia e Compliance Bancário da BIP (Business Integration Partners). 
    Sua missão é transformar uma análise técnica regulatória em um Business Case de alto nível para o Board/Diretoria de uma Instituição Financeira de grande porte.

    CONTEXTO DO CLIENTE: Banco ou Instituição Financeira sob supervisão do BACEN/CVM.
    DOCUMENTO ANALISADO: ${analysis.fileName}
    RESUMO TÉCNICO: ${analysis.summary}
    REQUISITOS EXTRAÍDOS: ${JSON.stringify(analysis.requirements.slice(0, 20))}

    ESTRUTURA DA RESPOSTA (PADRÃO EXECUTIVO BIP):
    1. EXECUTIVE SUMMARY: Visão holística do impacto na estratégia do banco.
    2. REGULATORY CHALLENGES: Desafios de compliance, multas e adequação.
    3. BUSINESS IMPACT: 
       - Capital Efficiency: Impacto em Basileia, provisões e custos de capital.
       - Reputational Risk: Confiança do mercado e rating.
       - Operational Resilience: Continuidade de negócios e sistemas.
    4. STRATEGIC FRAMEWORK (4 PILARES): Governança, Operações, Tecnologia e Risco.
       - Para CADA pilar, você DEVE gerar EXATAMENTE 5 desafios técnicos/críticos.
       - Para CADA pilar, você DEVE gerar EXATAMENTE 5 recomendações estratégicas.
       - Para CADA pilar, crie um Roadmap com horizontes: Imediato, Estrutural e Inovação.
    5. OUR SOLUTION: Como a BIP ajuda na implementação (Consultoria, PMO, Tecnologia).
    6. NEXT STEPS: Lista de ações imediatas.

    DIRETRIZES:
    - Use linguagem de C-Level (ex: 'Risk Appetite', 'Prudential Supervision', 'Operational Alpha').
    - Seja específico sobre os desafios técnicos (ex: 'Interoperabilidade de APIs legadas', 'Granularidade de dados para reporte').
    - Garanta que o JSON siga estritamente o esquema fornecido, preenchendo todos os campos do businessImpact e strategicFramework.

    Retorne um JSON robusto e completo.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: valuePropositionSchema,
            }
        });

        return JSON.parse(response.text || '{}') as ValuePropositionData;
    } catch (error: any) {
        console.error("Erro Proposta Valor:", error);
        throw new Error("Falha ao gerar a narrativa estratégica de negócio para o setor bancário.");
    }
};
