
import React, { useState, useEffect } from 'react';
import { SavedAnalysis, Requirement, ValuePropositionData, RegulatoryChecklistData, ServiceBrainstormData, GapAnalysisData } from '../types';
import { StarRating } from './StarRating';
import { ExecutiveReadinessThermometer } from './ExecutiveReadinessThermometer';
import { RequirementsTable } from './RequirementsTable';
import { DiscrepancyReport } from './DiscrepancyReport';
import { FundingAgentReport } from './FundingAgentReport';
import { ValuePropositionModal } from './ValuePropositionModal';
import { RegulatoryChecklistModal } from './RegulatoryChecklistModal';
import { ServiceBrainstormModal } from './ServiceBrainstormModal';
import { GapAnalysisModal } from './GapAnalysisModal';
import { generateValueProposition, generateRegulatoryChecklist, generateServiceBrainstorm, generateGapAnalysis } from '../services/geminiService';
import { LightbulbIcon, SheetIcon, ClipboardListIcon, FileTextIcon, ZapIcon, FileDownIcon, ScaleIcon } from './Icons';
import { generateAnalysisPDF } from '../services/pdfService';

interface DashboardProps {
  analysis: SavedAnalysis;
  onUpdate: (updatedAnalysis: SavedAnalysis) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ analysis, onUpdate }) => {
  const [requirements, setRequirements] = useState<Requirement[]>(analysis.requirements);
  const [isPropositionModalOpen, setIsPropositionModalOpen] = useState(false);
  const [propositionData, setPropositionData] = useState<ValuePropositionData | null>(null);
  const [propositionError, setPropositionError] = useState<string | null>(null);
  const [isGeneratingProposition, setIsGeneratingProposition] = useState(false);

  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistData, setChecklistData] = useState<RegulatoryChecklistData | null>(null);
  const [checklistError, setChecklistError] = useState<string | null>(null);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);

  const [isBrainstormModalOpen, setIsBrainstormModalOpen] = useState(false);
  const [brainstormData, setBrainstormData] = useState<ServiceBrainstormData | null>(null);
  const [brainstormError, setBrainstormError] = useState<string | null>(null);
  const [isGeneratingBrainstorm, setIsGeneratingBrainstorm] = useState(false);

  const [isGapAnalysisModalOpen, setIsGapAnalysisModalOpen] = useState(false);
  const [gapAnalysisData, setGapAnalysisData] = useState<GapAnalysisData | null>(null);
  const [gapAnalysisError, setGapAnalysisError] = useState<string | null>(null);
  const [isGeneratingGapAnalysis, setIsGeneratingGapAnalysis] = useState(false);

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const isLegacyProposition = analysis.valueProposition && (
    !analysis.valueProposition.businessImpact?.capitalEfficiency ||
    !analysis.valueProposition.strategicFramework?.[0]?.strategicRecommendations
  );

  // FIX: Synchronize internal state with props to ensure updates are always displayed.
  useEffect(() => {
    setRequirements(analysis.requirements);
  }, [analysis]);


  const handleUpdateRequirement = (updatedReq: Requirement) => {
    const updatedRequirements = requirements.map(r => r.id === updatedReq.id ? updatedReq : r);
    setRequirements(updatedRequirements);
    
    // Notify parent to persist the changes
    onUpdate({ ...analysis, requirements: updatedRequirements });
  };

  const handleGenerateProposition = async (force: boolean = false) => {
    setIsPropositionModalOpen(true);
    
    // If a proposition already exists and not forcing, show it immediately without calling the API.
    if (analysis.valueProposition && !force) {
        setPropositionData(analysis.valueProposition);
        setIsGeneratingProposition(false);
        setPropositionError(null);
        return;
    }

    // If not, generate it.
    setIsGeneratingProposition(true);
    setPropositionData(null);
    setPropositionError(null);
    try {
        const proposition = await generateValueProposition(analysis);
        setPropositionData(proposition);
        // CRITICAL CHANGE: After generating, update the parent component
        // so the proposition data is saved to localStorage.
        onUpdate({ ...analysis, valueProposition: proposition });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setPropositionError(`Falha ao gerar a proposta de valor. Erro: ${errorMessage}`);
    } finally {
        setIsGeneratingProposition(false);
    }
  };

  const handleGenerateChecklist = async (force: boolean = false) => {
    setIsChecklistModalOpen(true);
    
    if (analysis.regulatoryChecklist && !force) {
        setChecklistData(analysis.regulatoryChecklist);
        setIsGeneratingChecklist(false);
        setChecklistError(null);
        return;
    }

    setIsGeneratingChecklist(true);
    setChecklistData(null);
    setChecklistError(null);
    try {
        const checklist = await generateRegulatoryChecklist(analysis);
        setChecklistData(checklist);
        onUpdate({ ...analysis, regulatoryChecklist: checklist });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setChecklistError(`Falha ao gerar o checklist regulatório. Erro: ${errorMessage}`);
    } finally {
        setIsGeneratingChecklist(false);
    }
  };

  const handleGenerateBrainstorm = async (force: boolean = false) => {
    setIsBrainstormModalOpen(true);
    
    if (analysis.serviceBrainstorm && !force) {
        setBrainstormData(analysis.serviceBrainstorm);
        setIsGeneratingBrainstorm(false);
        setBrainstormError(null);
        return;
    }

    setIsGeneratingBrainstorm(true);
    setBrainstormData(null);
    setBrainstormError(null);
    try {
        const brainstorm = await generateServiceBrainstorm(analysis);
        setBrainstormData(brainstorm);
        onUpdate({ ...analysis, serviceBrainstorm: brainstorm });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setBrainstormError(`Falha ao gerar o brainstorming. Erro: ${errorMessage}`);
    } finally {
        setIsGeneratingBrainstorm(false);
    }
  };

  const handleGenerateGapAnalysis = async (forceRegenerate = false) => {
    setIsGapAnalysisModalOpen(true);

    if (analysis.gapAnalysis && !forceRegenerate) {
        setGapAnalysisData(analysis.gapAnalysis);
        setIsGeneratingGapAnalysis(false);
        setGapAnalysisError(null);
        return;
    }

    setIsGeneratingGapAnalysis(true);
    setGapAnalysisData(null);
    setGapAnalysisError(null);
    try {
        const gapData = await generateGapAnalysis(analysis);
        setGapAnalysisData(gapData);
        onUpdate({ ...analysis, gapAnalysis: gapData });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
        setGapAnalysisError(`Falha ao gerar a análise de gaps. Erro: ${errorMessage}`);
    } finally {
        setIsGeneratingGapAnalysis(false);
    }
  };

  const handleExportAllToExcel = () => {
    if (!requirements || requirements.length === 0) {
        return;
    }
    setIsExportingExcel(true);
    try {
        const headers = [
            "ID", "Texto do Requisito", "Descrição Detalhada", "Área", "Prioridade", "Status",
            "Evidência Textual", "Ação Necessária", "Proposta de Serviço de Consultoria",
            "Prazo Estimado", "Responsável", "Riscos de Não Conformidade"
        ];

        const dataRows = requirements.map(req => [
            req.id,
            req.requirementText,
            req.detailedDescription,
            req.area,
            req.priority,
            req.status,
            req.textualEvidence,
            req.necessaryAction,
            req.serviceProposal,
            req.estimatedDeadline || 'N/A',
            req.responsible,
            req.nonComplianceRisks
        ]);

        const escapeCsvValue = (value: any): string => {
            const stringValue = String(value ?? '');
            // If the value contains the separator (semicolon), double quotes, or newline characters,
            // it needs to be enclosed in double quotes. Any double quotes inside must be escaped by doubling them.
            if (/[";\n]/.test(stringValue)) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const csvContent = [
            headers.join(';'),
            ...dataRows.map(row => row.map(escapeCsvValue).join(';'))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const safeFileName = analysis.fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.setAttribute("href", url);
            link.setAttribute("download", `Plano_Acao_${safeFileName}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error("Failed to export to Excel:", error);
    } finally {
        setIsExportingExcel(false);
    }
  };

  const handleExportToPDF = async () => {
    setIsExportingPDF(true);
    try {
        await generateAnalysisPDF(analysis, 'dashboard-charts-container');
    } catch (error) {
        console.error("Failed to export PDF:", error);
        alert("Ocorreu um erro ao exportar o PDF do relatório. Detalhes no console.");
    } finally {
        setIsExportingPDF(false);
    }
  };

  const handleViewOriginalFile = () => {
    if (!analysis.fileData) {
        alert('O documento original não está disponível para esta análise.');
        return;
    }
    
    try {
        // For data URLs, opening in a new tab directly is often the most reliable
        // but can be blocked by pop-up blockers.
        const win = window.open();
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Documento Original: ${analysis.fileName}</title>
                        <style>
                            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                            iframe { width: 100%; height: 100%; border: none; }
                        </style>
                    </head>
                    <body>
                        <iframe src="${analysis.fileData}"></iframe>
                    </body>
                </html>
            `);
            win.document.close();
        } else {
            alert('O bloqueador de pop-ups impediu a abertura do documento. Por favor, permita pop-ups para este site.');
        }
    } catch (error) {
        console.error("Erro ao abrir o arquivo:", error);
        // Fallback: try to open directly
        window.open(analysis.fileData, '_blank');
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={analysis.fileName}>
                      {analysis.fileName}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Analisado em: {analysis.analyzedAt}</p>
                  {analysis.fileData && (
                      <button 
                        onClick={handleViewOriginalFile}
                        className="mt-2 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <FileTextIcon className="w-4 h-4 mr-1" />
                        Visualizar Documento Original
                      </button>
                  )}
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                   <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleGenerateProposition()}
                      className="flex-1 md:w-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 relative"
                    >
                      <LightbulbIcon className="w-5 h-5 mr-2" />
                      Gerar Proposta de Valor
                      {isLegacyProposition && (
                          <span className="absolute -top-2 -right-2 flex h-4 w-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" title="Novo padrão disponível"></span>
                          </span>
                      )}
                    </button>
                    <button 
                      onClick={() => handleGenerateBrainstorm()}
                      className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-amber-200 text-sm font-medium rounded-md shadow-sm text-amber-700 bg-amber-50 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                      title="Brainstorming de Ideias de Serviços"
                    >
                      <ZapIcon className="w-5 h-5 mr-2" />
                      Pool de Ideias
                    </button>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                    <button 
                     onClick={() => handleGenerateChecklist()}
                     className="flex-1 md:w-auto inline-flex items-center px-4 py-2 border border-teal-200 text-sm font-medium rounded-md shadow-sm text-teal-700 bg-teal-50 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      <ClipboardListIcon className="w-5 h-5 mr-2" />
                      Checklist Regulatório
                    </button>
                    <button 
                     onClick={() => handleGenerateGapAnalysis()}
                     className="flex-1 md:w-auto inline-flex items-center px-4 py-2 border border-indigo-200 text-sm font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                     title="Análise de Gaps com referências normativas (artigos, incisos) e detalhamento de adequação"
                    >
                      <ScaleIcon className="w-5 h-5 mr-2" />
                      Gap Analysis
                    </button>
                   </div>
                  <div className="flex items-center gap-4 mt-1">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">Score de Conformidade:</span>
                      <StarRating score={analysis.complianceScore} />
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {analysis.complianceScore.toFixed(1)}/5.0
                      </span>
                  </div>
              </div>
          </div>
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-2">Resumo da Análise</h3>
              <p className="text-gray-600 dark:text-gray-300">{analysis.summary}</p>
          </div>
        </div>

        {/* Executive Readiness Thermometer */}
        <div id="dashboard-charts-container" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <ExecutiveReadinessThermometer history={[analysis]} />
        </div>
        
        {/* Funding Agent Mentions */}
        {analysis.fundingAgentMentions && analysis.fundingAgentMentions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <FundingAgentReport mentions={analysis.fundingAgentMentions} />
          </div>
        )}

        {/* Discrepancies */}
        {analysis.discrepancies && analysis.discrepancies.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <DiscrepancyReport discrepancies={analysis.discrepancies} />
            </div>
        )}

        {/* Requirements Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Plano de Ação e Requisitos</h3>
            <div className="flex gap-3">
              <button
                onClick={handleExportToPDF}
                disabled={isExportingPDF}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                title="Exportar relatório completo em formato PDF com gráficos e dados"
              >
                  <FileDownIcon className="w-5 h-5 mr-2" />
                  {isExportingPDF ? 'Gerando PDF...' : 'Exportar Relatório PDF'}
              </button>
              <button
                onClick={handleExportAllToExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
                title="Exportar todos os requisitos para Excel (CSV)"
              >
                  <SheetIcon className="w-5 h-5 mr-2" />
                  {isExportingExcel ? 'Exportando...' : 'Exportar Tudo'}
              </button>
            </div>
          </div>
          <RequirementsTable requirements={requirements} onUpdateRequirement={handleUpdateRequirement} />
        </div>

      </div>
       <ValuePropositionModal
        isOpen={isPropositionModalOpen}
        onClose={() => setIsPropositionModalOpen(false)}
        onRegenerate={() => handleGenerateProposition(true)}
        isLoading={isGeneratingProposition}
        data={propositionData}
        error={propositionError}
        fileName={analysis.fileName}
      />
       <RegulatoryChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
        onRegenerate={() => handleGenerateChecklist(true)}
        isLoading={isGeneratingChecklist}
        data={checklistData}
        error={checklistError}
        fileName={analysis.fileName}
      />
      <ServiceBrainstormModal 
        isOpen={isBrainstormModalOpen}
        onClose={() => setIsBrainstormModalOpen(false)}
        onRegenerate={() => handleGenerateBrainstorm(true)}
        isLoading={isGeneratingBrainstorm}
        data={brainstormData}
        error={brainstormError}
      />
      <GapAnalysisModal
        isOpen={isGapAnalysisModalOpen}
        onClose={() => setIsGapAnalysisModalOpen(false)}
        onRegenerate={() => handleGenerateGapAnalysis(true)}
        isLoading={isGeneratingGapAnalysis}
        data={gapAnalysisData}
        error={gapAnalysisError}
        fileName={analysis.fileName}
      />
    </>
  );
};
