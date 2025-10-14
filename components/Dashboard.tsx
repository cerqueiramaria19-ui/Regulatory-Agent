
import React, { useState, useEffect } from 'react';
import { SavedAnalysis, Requirement, ValuePropositionData } from '../types';
import { StarRating } from './StarRating';
import { AreaPieChart } from './AreaPieChart';
import { PriorityPieChart } from './PriorityPieChart';
import { RequirementsTable } from './RequirementsTable';
import { DiscrepancyReport } from './DiscrepancyReport';
import { FundingAgentReport } from './FundingAgentReport';
import { ValuePropositionModal } from './ValuePropositionModal';
import { generateValueProposition } from '../services/geminiService';
import { LightbulbIcon } from './Icons';

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

  const handleGenerateProposition = async () => {
    setIsPropositionModalOpen(true);
    
    // If a proposition already exists, show it immediately without calling the API.
    if (analysis.valueProposition) {
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
              <div className="flex items-center gap-4 flex-shrink-0 flex-wrap justify-end">
                   <button 
                    onClick={handleGenerateProposition}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    <LightbulbIcon className="w-5 h-5 mr-2" />
                    Gerar Proposta de Valor
                  </button>
                  <div className="flex items-center gap-4">
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
          <h3 className="text-xl font-semibold mb-4">Plano de Ação e Requisitos</h3>
          <RequirementsTable requirements={requirements} onUpdateRequirement={handleUpdateRequirement} />
        </div>

      </div>
       <ValuePropositionModal
        isOpen={isPropositionModalOpen}
        onClose={() => setIsPropositionModalOpen(false)}
        isLoading={isGeneratingProposition}
        data={propositionData}
        error={propositionError}
        fileName={analysis.fileName}
      />
    </>
  );
};
