import React, { useState } from 'react';
import { ClipboardCopyIcon } from './Icons';
import { ValuePropositionData } from '../types';
import { StrategicFrameworkDiagram } from './StrategicFrameworkDiagram';

interface ValuePropositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    data: ValuePropositionData | null;
    error: string | null;
    fileName: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Gerando proposta de valor...</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analisando, conectando e construindo uma visão estratégica.</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Ocorreu um Erro</h3>
        <p className="mt-2 text-center text-red-700 dark:text-red-300">{message}</p>
    </div>
);

const formatDataForCopy = (data: ValuePropositionData): string => {
    let text = `Proposta de Valor: Análise Estratégica e Plano de Ação para Conformidade Regulatória\n\n`;
    text += `1. Resumo Executivo\n${data.executiveSummary}\n\n`;
    text += `2. O Cenário Regulatório e Seus Desafios\n${data.regulatoryChallenges}\n\n`;
    text += `3. Framework Estratégico de Impacto\n`;
    data.strategicFramework.forEach(area => {
        text += `\n- ${area.areaName}:\n`;
        text += `  - Desafios:\n${area.challenges.map(c => `    - ${c}`).join('\n')}\n`;
        text += `  - Recomendações Estratégicas:\n${area.recommendations.map(r => `    - ${r}`).join('\n')}\n`;
    });
    text += `\n4. Nossa Solução e Parceria Estratégica\n${data.ourSolution}\n\n`;
    text += `5. Próximos Passos Sugeridos\n${data.nextSteps.map(s => `- ${s}`).join('\n')}\n`;
    return text;
}


export const ValuePropositionModal: React.FC<ValuePropositionModalProps> = ({ isOpen, onClose, isLoading, data, error, fileName }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copiar Texto');
    
    if (!isOpen) return null;

    const handleCopy = () => {
        if (data) {
            const formattedText = formatDataForCopy(data);
            navigator.clipboard.writeText(formattedText);
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Copiar Texto'), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                        Proposta de Valor Estratégica
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Baseado no documento: <span className="font-medium">{fileName}</span>
                    </p>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}
                    {data && (
                        <div className="space-y-8">
                           <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Resumo Executivo</h4>
                               <p className="text-gray-700 dark:text-gray-300">{data.executiveSummary}</p>
                           </div>
                           <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">O Cenário Regulatório e Seus Desafios</h4>
                               <p className="text-gray-700 dark:text-gray-300">{data.regulatoryChallenges}</p>
                           </div>
                           <div>
                                <h4 className="text-xl text-center font-bold text-gray-800 dark:text-white mb-4">Framework Estratégico de Impacto</h4>
                                <StrategicFrameworkDiagram framework={data.strategicFramework} />
                           </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Nossa Solução e Parceria Estratégica</h4>
                               <p className="text-gray-700 dark:text-gray-300">{data.ourSolution}</p>
                           </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Próximos Passos Sugeridos</h4>
                               <ul className="space-y-2">
                                    {data.nextSteps.map((step, index) => (
                                        <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 mr-3">
                                                <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                               </ul>
                           </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-white dark:bg-gray-800/80 backdrop-blur-sm flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
                        Fechar
                    </button>
                    {!isLoading && data && (
                        <button 
                            onClick={handleCopy} 
                            type="button" 
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <ClipboardCopyIcon className="w-4 h-4 mr-2" />
                            {copyButtonText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};