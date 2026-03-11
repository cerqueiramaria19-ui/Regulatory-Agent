
import React, { useState, useEffect } from 'react';
import { SavedAnalysis, Requirement, ValuePropositionData, RegulatoryChecklistData } from '../types';
import { StarRating } from './StarRating';
import { AreaPieChart } from './AreaPieChart';
import { PriorityPieChart } from './PriorityPieChart';
import { RequirementsTable } from './RequirementsTable';
import { DiscrepancyReport } from './DiscrepancyReport';
import { FundingAgentReport } from './FundingAgentReport';
import { ValuePropositionModal } from './ValuePropositionModal';
import { RegulatoryChecklistModal } from './RegulatoryChecklistModal';
import { generateValueProposition, generateRegulatoryChecklist } from '../services/geminiService';
import { LightbulbIcon, SheetIcon, ClipboardListIcon } from './Icons';

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

  const [isExportingExcel, setIsExportingExcel] = useState(false);

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
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0 items-end">
                   <button 
                    onClick={() => handleGenerateProposition()}
                    className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 relative"
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
                    onClick={() => handleGenerateChecklist()}
                    className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-teal-200 text-sm font-medium rounded-md shadow-sm text-teal-700 bg-teal-50 hover:bg-teal-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    <ClipboardListIcon className="w-5 h-5 mr-2" />
                    Checklist Regulatório
                  </button>
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

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Requisitos por Área</h3>
            <AreaPieChart data={requirements} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Requisitos por Prioridade</h3>
            <PriorityPieChart data={requirements} />
          </div>
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
            <h3 className="text-xl font-semibold">Plano de Ação e Requisitos</h3>
            <button
                onClick={handleExportAllToExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                title="Exportar todos os requisitos para Excel (CSV)"
              >
                  <SheetIcon className="w-5 h-5 mr-2" />
                  {isExportingExcel ? 'Exportando...' : 'Exportar Tudo'}
              </button>
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
    </>
  );
};
