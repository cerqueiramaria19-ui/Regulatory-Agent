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

    const basePrompt = `
        **Sua Missão:** Você é um assistente de análise regulatória especializado. Sua tarefa é analisar o documento fornecido e extrair informações críticas, formatando a saída ESTRITAMENTE como um objeto JSON válido que corresponda ao esquema.

        **Regras Críticas de Saída:**
        1.  **JSON VÁLIDO:** Sua resposta DEVE ser um único objeto JSON, sem nenhum texto ou formatação adicional antes ou depois dele.
        2.  **ESCAPAR CARACTERES:** Preste atenção especial a caracteres dentro dos textos extraídos do documento. Aspas duplas ("), barras invertidas (\\), e outros caracteres especiais DENTRO das strings do JSON DEVEM ser devidamente escapados (ex: "texto com \\"aspas\\""). A falha em escapar corretamente resultará em um JSON inválido.

        **Análise Requerida:**
        Com base no documento, identifique:
        - Requisitos acionáveis e detalhados.
        - Discrepâncias, ambiguidades ou conflitos no texto.
        - Menções específicas a 'agente financiador' ou sinônimos.
        - Um resumo executivo da análise.
        - Um score de 0 a 5 para a complexidade e risco do documento.
        ${instructionText}

        **Instruções de Preenchimento:**
        - Preencha todos os campos do JSON de acordo com as descrições no esquema.
        - O status inicial para todos os requisitos deve ser sempre '${Status.NOT_STARTED}'.
        - Se não encontrar discrepâncias ou menções a agentes financiadores, os campos 'discrepancies' e 'fundingAgentMentions' devem ser arrays vazios ([]).
    `;

    // REFACTOR: The `contents` parameter must be structured correctly.
    // For text files, a single string combining prompt and content is robust.
    // For binary files, the request must be a valid Content object with multiple parts.
    // The previous format `[prompt, filePart]` was incorrect and likely caused the internal server error.
    const contents = isTextContent
        ? `${basePrompt}\n\n--- CONTEÚDO DO DOCUMENTO ---\n\n${filePart.text}`
        : { parts: [{ text: basePrompt }, filePart] };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents,
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

        // The model can sometimes return the JSON string wrapped in markdown backticks
        // or with leading/trailing text. We need to sanitize it before parsing.
        let jsonString = response.text.trim();
        const jsonStartIndex = jsonString.indexOf('{');
        const jsonEndIndex = jsonString.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
        } else {
            // If we can't find a valid JSON structure, throw an error.
            console.error("Could not find a valid JSON object in the AI response.", response.text);
            throw new Error("A resposta da IA não continha um objeto JSON válido.");
        }

        const result = JSON.parse(jsonString);
        
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

        1.  **executiveSummary & regulatoryChallenges & ourSolution:**
            - Crie textos persuasivos e de alto nível, conectando o desafio regulatório à oportunidade de negócio e posicionando a BIP como parceira estratégica.

        2.  **strategicFramework:**
            - **Objetivo:** Sua tarefa mais importante é traduzir os requisitos técnicos em uma narrativa de negócio estratégica. Agrupe os 'Principais Requisitos Identificados' nas quatro áreas.
            - **Processo de Pensamento (CRÍTICO):** Para cada área, siga este processo:
                a. **Analise os Requisitos:** Leia os requisitos pertinentes àquela área (ex: "é necessário ter um processo de PLD/CFT").
                b. **Sintetize o Desafio de Negócio:** Pergunte-se: "Qual é o RISCO ou o PROBLEMA DE NEGÓCIO de alto nível se isso não for feito?". A resposta NÃO é repetir o requisito. A resposta é o impacto. (Ex: O desafio não é "ter um processo de PLD", mas sim "Fragmentação na gestão de PLD/CFT, elevando a exposição a sanções e danos reputacionais").
                c. **Formule a Recomendação Estratégica:** Pergunte-se: "Qual PROJETO ou INICIATIVA de consultoria a BIP venderia para resolver esse desafio?". A resposta deve ser uma solução abrangente. (Ex: A recomendação não é "fazer um processo de PLD", mas sim "Revisão e atualização completa das políticas e procedimentos de PLD/CFT, alinhando com as melhores práticas de mercado").
            - **Instrução Final:** Use essa lógica para criar desafios que falam de riscos, ineficiências e falta de clareza. Crie recomendações que soem como projetos de consultoria completos (Modelos, Frameworks, Desenho e Implementação, etc.). A qualidade da sua resposta aqui é medida pela sua capacidade de abstrair o técnico para o estratégico.

        3.  **nextSteps:**
            - Crie 3 próximos passos que representem uma jornada de engajamento clara e estratégica com o cliente.
            - **Passo 1 (Diagnóstico):** Proponha uma ação de curto prazo e alto impacto (ex: "Workshop de Diagnóstico Estratégico para validar achados e quantificar riscos").
            - **Passo 2 (Planejamento):** Sugira o desenvolvimento de um artefato concreto (ex: "Desenvolvimento de um Roadmap de Adequação Priorizado").
            - **Passo 3 (Parceria):** Apresente a visão da parceria contínua (ex: "Implementação de um projeto piloto").

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

        // The model can sometimes return the JSON string wrapped in markdown backticks
        // or with leading/trailing text. We need to sanitize it before parsing.
        let jsonString = response.text.trim();
        const jsonStartIndex = jsonString.indexOf('{');
        const jsonEndIndex = jsonString.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
        } else {
            console.error("Could not find a valid JSON object in the AI response for value proposition.", response.text);
            throw new Error("A resposta da IA para a proposta de valor não continha um objeto JSON válido.");
        }

        const result = JSON.parse(jsonString);

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