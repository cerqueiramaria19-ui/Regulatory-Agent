import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Area, Priority, Status, SavedAnalysis, ValuePropositionData, RegulatoryChecklistData, ServiceBrainstormData } from '../types';

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
        },
        bipServiceScores: {
            type: Type.OBJECT,
            properties: {
                S1: { type: Type.NUMBER, description: "Score (0-100) para Estratégia e Transformação Digital" },
                S2: { type: Type.NUMBER, description: "Score (0-100) para Adequação Regulatória e Evolução do Ecossistema" },
                S3: { type: Type.NUMBER, description: "Score (0-100) para Infraestrutura e Capacidades Digitais" },
                S4: { type: Type.NUMBER, description: "Score (0-100) para Eficiência Operacional e Inteligência" }
            },
            required: ["S1", "S2", "S3", "S4"]
        }
    },
    required: ["summary", "complianceScore", "requirements", "discrepancies", "fundingAgentMentions", "bipServiceScores"]
};

export const analyzeDocument = async (file: File, instructions: string): Promise<AnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const filePart = await fileToGenerativePart(file);
    const isTextContent = 'text' in filePart;

    const instructionText = instructions 
        ? `\n\nFoco especial solicitado pelo usuário: "${instructions}".`
        : '';

    const basePrompt = `Analise o documento regulatório anexo e extraia os requisitos, discrepâncias, menções a agentes financiadores e calcule o Fit Score para os serviços da BIP. 
    
    CÁLCULO DO BIP SERVICE SCORE (0-100):
    - S1 (Estratégia e Transformação Digital): Impacto em inovação, novos modelos de negócio, governança corporativa e visão de futuro.
    - S2 (Adequação Regulatória): Impacto em compliance, jurídico, riscos prudenciais e normas do BACEN/CVM.
    - S3 (Infraestrutura e Capacidades Digitais): Impacto em TI, segurança da informação, dados, APIs e nuvem.
    - S4 (Eficiência Operacional e Inteligência): Impacto em processos internos, back-office, automação e gestão de custos.
    
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

const serviceBrainstormSchema = {
    type: Type.OBJECT,
    properties: {
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    pillarType: { type: Type.STRING, enum: ["governance", "operations", "technology", "risk"] },
                    ideas: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["title", "pillarType", "ideas"]
            }
        }
    },
    required: ["sections"]
};

export const generateRegulatoryChecklist = async (analysis: SavedAnalysis): Promise<RegulatoryChecklistData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um Consultor de Operações e Riscos Bancários da BIP, especialista em implementação de normas do BACEN e CVM.
    Sua missão é criar um "Diagnóstico de Prontidão Operacional" baseado na análise técnica do documento ${analysis.fileName}.
    
    OBJETIVO: Transformar a norma em verificações PRÁTICAS e OPERACIONAIS. O cliente precisa saber exatamente O QUE verificar nos seus sistemas, processos e controles internos.
    
    RESUMO TÉCNICO: ${analysis.summary}
    REQUISITOS EXTRAÍDOS: ${JSON.stringify(analysis.requirements.slice(0, 25))}
    
    DIRETRIZES PARA OS ITENS (Gere EXATAMENTE 10 itens):
    1. REQUIREMENT: O ponto focal da norma (ex: "Segregação de Funções no Pix").
    2. DESCRIPTION: Uma verificação técnica direta. 
       - USE: "Verificar se o sistema [X] possui logs de auditoria para a ação [Y] conforme a circular [Z]" ou "Validar se a conciliação entre o sistema legado e o reporte regulatório ocorre em D+0".
       - EVITE: Perguntas genéricas ou teóricas. Foque em "O que testar".
    3. IMPACT: O risco operacional real (ex: "Risco de fraude por colusão ou erro de liquidação não detectado").
    4. CRITICALITY: Marque como isCritical: true se for um ponto de falha que gera multa imediata ou interrupção de serviço.
    
    O tom deve ser técnico, preciso e focado em auditoria/implementação operacional.`;

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
    const prompt = `Você é um Consultor Sênior de Estratégia e Operações Bancárias da BIP. 
    Sua missão é transformar uma análise técnica em um Plano de Ação Estratégico e Operacional para a Diretoria.

    CONTEXTO: Instituição Financeira (IF) com sistemas legados, silos de dados e pressão regulatória.
    DOCUMENTO: ${analysis.fileName}
    REQUISITOS: ${JSON.stringify(analysis.requirements.slice(0, 20))}

    ESTRUTURA DA RESPOSTA:
    1. EXECUTIVE SUMMARY: Impacto direto no P&L e na licença de operação.
    2. REGULATORY CHALLENGES: Foco em multas pecuniárias e sanções administrativas do BACEN.
    3. BUSINESS IMPACT: 
       - Capital Efficiency: Impacto em RWA (Risk Weighted Assets) e capital regulatório.
       - Reputational Risk: Impacto no Score de Supervisão (SRC) e imagem perante investidores.
       - Operational Resilience: Robustez de sistemas críticos e planos de contingência.
    4. STRATEGIC FRAMEWORK (4 PILARES): Governança, Operações, Tecnologia e Risco.
       - Desafios: Devem ser OPERACIONAIS (ex: "Falta de linhagem de dados entre o Core Banking e o motor de risco").
       - Recomendações: Devem ser AÇÕES CONCRETAS (ex: "Implementar barramento de integração para reporte automático").
       - Roadmap: Imediato (Quick Wins), Estrutural (Processos), Inovação (Diferencial).
    5. OUR SOLUTION: Metodologia BIP de implementação (Diagnóstico -> Desenho -> Sustentação).
    6. NEXT STEPS: Ações práticas para os próximos 30 dias.

    DIRETRIZES:
    - Fuja do "corporativês" genérico. Seja pragmático.
    - Fale de processos reais: Conciliação, Reporte, KYC, AML, PLD, Basileia, Pix, Open Finance.
    - Garanta que as recomendações sejam implementáveis por uma consultoria.`;

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

export const generateServiceBrainstorm = async (analysis: SavedAnalysis): Promise<ServiceBrainstormData> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um Consultor de Ofertas e Soluções da BIP. 
    Sua missão é criar um "Catálogo de Soluções Pragmáticas" para o documento ${analysis.fileName}.
    
    OBJETIVO: Propor serviços de consultoria que resolvam problemas REAIS de operação bancária.
    
    ÁREAS (Gere 5 ideias para cada):
    1. Estratégia e Transformação (governance): PMO de implementação, Revisão de Modelos de Negócio.
    2. Adequação e Risco (risk): Auditoria de Processos, Saneamento de Dados Regulatórios.
    3. Infraestrutura e Digital (technology): Modernização de Legado, Arquitetura de APIs.
    4. Eficiência e Inteligência (operations): Automação de Back-office (RPA), Redesenho de Jornadas.
    
    DIRETRIZES:
    - As ideias devem ser PRODUTOS de consultoria (ex: "Squad de Saneamento de Dados para Resolução 4.966").
    - Foque em dor operacional: "Redução de intervenção manual em reportes", "Mitigação de erros de KYC".
    - Use o contexto brasileiro (BACEN, CVM, SELIC, PIX).
    
    Retorne um JSON seguindo o esquema.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-pro-preview",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: serviceBrainstormSchema,
            }
        });

        return JSON.parse(response.text || '{}') as ServiceBrainstormData;
    } catch (error: any) {
        console.error("Erro Brainstorming:", error);
        throw new Error("Falha ao gerar o brainstorming de serviços.");
    }
};
