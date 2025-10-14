
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Area, Priority, Status, SavedAnalysis, ValuePropositionData } from '../types';

// Helper function to convert file to a Part object for the Gemini API
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string; }; } | { text: string; }> => {
  // For plain text files, read them as text and send as a text part.
  // The Gemini API can mistake a base64 encoded TXT file for a document format it needs to parse for pages.
  // Sending it as raw text is more direct and avoids this parsing error.
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    const textContent = await file.text();
    return { text: textContent };
  }

  // For other file types (PDF, DOCX), convert to base64 and send as inlineData.
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error("Failed to read file as string"));
        }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Um resumo conciso do documento regulatório, destacando seu propósito principal e os principais pontos abordados." },
        complianceScore: { type: Type.NUMBER, description: "Um número de 0 a 5 representando a complexidade e risco. 5 é o mais complexo/arriscado." },
        requirements: {
            type: Type.ARRAY,
            description: "Uma lista de todos os requisitos acionáveis extraídos do documento.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Um identificador único para o requisito, no formato REQ-001, REQ-002, etc." },
                    requirementText: { type: Type.STRING, description: "O texto resumido do requisito em no máximo 200 caracteres." },
                    detailedDescription: { type: Type.STRING, description: "Uma explicação detalhada do que o requisito significa em termos práticos." },
                    area: { type: Type.STRING, enum: Object.values(Area), description: `A área de negócio impactada. Deve ser um dos seguintes: ${Object.values(Area).join(', ')}` },
                    priority: { type: Type.STRING, enum: Object.values(Priority), description: `A prioridade do requisito. Deve ser um dos seguintes: ${Object.values(Priority).join(', ')}` },
                    status: { type: Type.STRING, enum: [Status.NOT_STARTED], description: `O status inicial do requisito. Deve ser sempre '${Status.NOT_STARTED}'.` },
                    textualEvidence: { type: Type.STRING, description: "Citação ou referência da seção do documento que comprova o requisito." },
                    necessaryAction: { type: Type.STRING, description: "Ação específica e clara que a empresa precisa tomar para cumprir o requisito." },
                    serviceProposal: { type: Type.STRING, description: "Com base na 'Ação Necessária', proponha um serviço de consultoria específico que nossa empresa poderia oferecer para ajudar o cliente a cumprir este requisito. Seja claro, conciso e orientado para a solução. Exemplo: 'Consultoria para Mapeamento de Processos e Adequação de Sistemas de Reporte'." },
                    estimatedDeadline: { type: Type.STRING, description: "O prazo mencionado no documento (ex: 'YYYY-MM-DD'), ou uma string vazia se não houver." },
                    responsible: { type: Type.STRING, description: "Sugestão de departamento ou função responsável (ex: 'Departamento Jurídico', 'Equipe de TI')." },
                    nonComplianceRisks: { type: Type.STRING, description: "Os riscos ou penalidades associados ao não cumprimento deste requisito." }
                },
                required: ["id", "requirementText", "detailedDescription", "area", "priority", "status", "textualEvidence", "necessaryAction", "serviceProposal", "estimatedDeadline", "responsible", "nonComplianceRisks"]
            }
        },
        discrepancies: {
            type: Type.ARRAY,
            description: "Uma lista de discrepâncias, ambiguidades ou conflitos encontrados. Se não houver, retorne um array vazio.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Um identificador único para a discrepância, no formato DISC-001, DISC-002, etc." },
                    description: { type: Type.STRING, description: "Descrição da discrepância, ambiguidade ou conflito encontrado." },
                    suggestion: { type: Type.STRING, description: "Sugestão de como resolver ou esclarecer a discrepância." },
                    severity: { type: Type.STRING, enum: ['low', 'medium', 'high'], description: "A severidade da discrepância. Deve ser 'low', 'medium', ou 'high'." }
                },
                required: ["id", "description", "suggestion", "severity"]
            }
        },
        fundingAgentMentions: {
            type: Type.ARRAY,
            description: "Uma lista de menções a 'agente financiador' ou sinônimos. Se não houver, retorne um array vazio.",
            items: {
                type: Type.OBJECT,
                properties: {
                    mention: { type: Type.STRING, description: "O trecho exato do texto onde 'agente financiador' (ou similar) é mencionado." },
                    pageNumber: { type: Type.INTEGER, description: "O número da página onde a menção foi encontrada." },
                    context: { type: Type.STRING, description: "Um breve resumo do contexto em que a menção aparece." }
                },
                required: ["mention", "pageNumber", "context"]
            }
        }
    },
    required: ["summary", "complianceScore", "requirements", "discrepancies", "fundingAgentMentions"]
};


export const analyzeDocument = async (file: File, instructions: string): Promise<AnalysisResult> => {
    const filePart = await fileToGenerativePart(file);
    const isTextContent = 'text' in filePart;

    const instructionText = instructions 
        ? `\n\nInstrução Específica do Usuário: O usuário pediu para focar na seguinte análise: "${instructions}". Por favor, dê atenção especial a este ponto durante a sua análise.`
        : '';

    const prompt = `
        Analise o documento regulatório ${isTextContent ? 'a seguir' : 'em anexo'}. Sua tarefa é extrair informações críticas e responder com um objeto JSON que corresponda ao esquema fornecido.
        
        Sua análise deve ser detalhada e precisa, focando em identificar:
        - Requisitos acionáveis.
        - Discrepâncias ou ambiguidades no texto.
        - Menções a agentes financiadores.
        - Um resumo geral e um score de complexidade/risco.
        ${instructionText}
        Preencha todos os campos do JSON de acordo com as descrições no esquema.
        Para os requisitos, o status inicial deve ser sempre '${Status.NOT_STARTED}'.
        Se não encontrar discrepâncias ou menções a agentes financiadores, retorne arrays vazios para os campos correspondentes.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [
                { text: prompt },
                filePart
            ]},
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            }
        });

        if (!response || !response.text) {
            console.error("Resposta inválida ou vazia da API Gemini:", response);
            const finishReason = response?.candidates?.[0]?.finishReason;
            let errorMessage = "A IA não retornou um texto válido. A resposta pode estar vazia ou bloqueada.";
            if (finishReason === 'SAFETY') {
                errorMessage = "A análise falhou porque o conteúdo do documento ou a resposta foi bloqueada pelas políticas de segurança.";
            } else if (finishReason) {
                errorMessage = `A análise foi interrompida. Motivo: ${finishReason}.`;
            }
            throw new Error(errorMessage);
        }

        const result = JSON.parse(response.text);
        
        // Basic validation
        if (!result.summary || !result.requirements || !result.discrepancies || typeof result.complianceScore !== 'number' || !result.fundingAgentMentions) {
            throw new Error("Resposta da IA está incompleta ou mal formatada, mesmo com o esquema.");
        }

        return result as AnalysisResult;

    } catch (error) {
        console.error("Erro ao analisar documento com a API Gemini:", error);
        if (error instanceof SyntaxError) {
             throw new Error(`A análise falhou porque a IA retornou um JSON inválido, mesmo com as restrições de esquema. Tente novamente.`);
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("A análise do documento falhou. A API pode estar indisponível ou ocorreu um erro inesperado.");
    }
};

const valuePropositionSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: { type: Type.STRING, description: "Um parágrafo curto e impactante introduzindo o desafio regulatório e posicionando a BIP como a solução estratégica." },
        regulatoryChallenges: { type: Type.STRING, description: "Descrição breve dos riscos e complexidades apresentados pelos requisitos identificados, destacando os impactos de não conformidade." },
        strategicFramework: {
            type: Type.ARRAY,
            description: "Um mapeamento didático dos requisitos em quatro áreas estratégicas de negócio.",
            items: {
                type: Type.OBJECT,
                properties: {
                    areaName: { type: Type.STRING, enum: ["Governança e Compliance", "Operações e Processos", "Tecnologia e Dados", "Riscos e Jurídico"] },
                    challenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de 2 a 3 desafios-chave para esta área, resumidos dos requisitos." },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de 2 a 3 recomendações estratégicas de alto nível para esta área." }
                },
                required: ["areaName", "challenges", "recommendations"]
            }
        },
        ourSolution: { type: Type.STRING, description: "Texto apresentando como a expertise e as ferramentas da BIP podem simplificar o processo de conformidade, conectando as soluções aos desafios mapeados." },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de 2 a 3 próximos passos sugeridos, como 'Agendar reunião de aprofundamento' ou 'Desenvolver plano de ação detalhado'." }
    },
    required: ["executiveSummary", "regulatoryChallenges", "strategicFramework", "ourSolution", "nextSteps"]
};

export const generateValueProposition = async (analysis: SavedAnalysis): Promise<ValuePropositionData> => {
    const requirementsSummary = analysis.requirements.map(req => 
        `- [${req.id}] ${req.requirementText} (Prioridade: ${req.priority}, Área: ${req.area}, Ação: ${req.necessaryAction})`
    ).join('\n');

    const prompt = `
        **Persona e Missão:**
        Atue como um Consultor Sênior de Negócios e Estratégia da BIP. Sua missão é transformar uma análise técnica de um documento regulatório em uma Proposta de Valor estratégica e persuasiva para um cliente de alto nível (C-level). A linguagem deve ser sofisticada, focada em negócios e orientada a soluções, não apenas em conformidade. O objetivo é demonstrar o valor estratégico de se adequar à regulação e posicionar a BIP como o parceiro ideal para essa jornada.

        **Contexto da Análise Regulatória:**
        - **Documento:** ${analysis.fileName}
        - **Resumo Geral:** ${analysis.summary}
        - **Principais Requisitos Identificados (Input para sua análise):**
          ${requirementsSummary}

        **Sua Tarefa:**
        Com base no contexto acima, gere um objeto JSON que corresponda EXATAMENTE ao esquema fornecido. Desenvolva cada campo com a profundidade e a visão estratégica de um consultor experiente.

        **Diretrizes Detalhadas por Campo:**

        1.  **executiveSummary:**
            - Crie um parágrafo de abertura poderoso.
            - Vá além do "este documento exige X". Enquadre a regulação como um catalisador para a transformação ou uma mitigação de riscos críticos de negócio.
            - Introduza o desafio central e posicione imediatamente a BIP como o parceiro estratégico com a expertise necessária para navegar essa complexidade e gerar valor.

        2.  **regulatoryChallenges:**
            - Sintetize os requisitos individuais em 2-3 desafios de negócio macro.
            - Conecte os pontos: explique como a falha em endereçar esses pontos pode levar a riscos financeiros, operacionais, reputacionais ou de mercado.
            - Use uma linguagem que ressoe com executivos (ex: "fragmentação de processos", "falta de visibilidade de dados", "risco de sanções e perda de competitividade").

        3.  **strategicFramework:**
            - Esta é a peça central. Analise e agrupe os requisitos de forma inteligente dentro das quatro áreas estratégicas.
            - **Para cada 'areaName'**:
                - **challenges**: Converta os requisitos técnicos em desafios de negócio específicos para aquela área. Seja conciso e impactante. Ex: Em vez de "REQ-005 diz que precisa de um relatório", use "Visibilidade limitada sobre dados críticos para tomada de decisão".
                - **recommendations**: Formule recomendações de alto nível, que sejam verdadeiramente estratégicas. Ex: Em vez de "Criar o relatório do REQ-005", proponha "Desenvolver um roadmap para um Data Lakehouse corporativo que centralize informações e habilite analytics avançado, atendendo não só a esta, mas a futuras demandas regulatórias." Pense em frameworks, metodologias, otimização de processos, e governança.

        4.  **ourSolution:**
            - Apresente a abordagem da BIP como uma solução holística e integrada.
            - Conecte diretamente a expertise da BIP (mencionando áreas como gestão de riscos, transformação digital, data analytics, etc.) às recomendações feitas no framework.
            - Destaque o diferencial da BIP: não apenas "fazer o trabalho", but "construir capacidades internas no cliente", "usar aceleradores e metodologias comprovadas", "garantir uma transformação sustentável".

        5.  **nextSteps:**
            - Proponha próximos passos claros, acionáveis e colaborativos.
            - Evite ser genérico. Sugira ações que demonstrem valor rapidamente.
            - Exemplos excelentes: "Agendamento de um workshop de diagnóstico para aprofundar nos desafios mapeados", "Desenvolvimento de um business case detalhado para o projeto de adequação", "Apresentação de um plano de ação priorizado para as primeiras 6 semanas".

        Sua resposta DEVE ser um objeto JSON bem-formado, aderindo estritamente ao esquema fornecido.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: valuePropositionSchema,
            }
        });

        if (!response || !response.text) {
            console.error("Resposta inválida da API Gemini ao gerar proposta de valor:", response);
            throw new Error("A IA não retornou um texto válido para a proposta de valor.");
        }

        const result = JSON.parse(response.text);

        // Validação básica da estrutura
        if (!result.executiveSummary || !result.strategicFramework || result.strategicFramework.length !== 4) {
            throw new Error("A resposta da IA para a proposta de valor está incompleta ou mal formatada.");
        }

        return result as ValuePropositionData;

    } catch (error)
    {
        console.error("Erro ao gerar proposta de valor com a API Gemini:", error);
        if (error instanceof SyntaxError) {
             throw new Error(`A proposta de valor falhou porque a IA retornou um JSON inválido.`);
        }
        if (error instanceof Error) {
            throw new Error(`Falha ao gerar proposta de valor: ${error.message}`);
        }
        throw new Error("A geração da proposta de valor falhou. A API pode estar indisponível ou ocorreu um erro inesperado.");
    }
};
