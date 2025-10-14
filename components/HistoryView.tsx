
import React, { useMemo } from 'react';
// FIX: Corrected import paths to be relative
import { SavedAnalysis } from '../types';
import { FileTextIcon, StarIcon, TrashIcon, ZapIcon } from './Icons';
import { AggregateDashboard } from './AggregateDashboard';

interface HistoryViewProps {
  history: SavedAnalysis[];
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onNavigateToUpload: () => void;
  onViewComparison: (group: SavedAnalysis[]) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, onView, onDelete, onNavigateToUpload, onViewComparison }) => {
  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent triggering onView when clicking delete
    if(window.confirm('Tem certeza de que deseja excluir esta análise?')) {
        onDelete(id);
    }
  };

  const groupedHistory = useMemo(() => {
    const groups: { [hash: string]: SavedAnalysis[] } = {};
    history.forEach(analysis => {
        if (!groups[analysis.fileHash]) {
            groups[analysis.fileHash] = [];
        }
        groups[analysis.fileHash].push(analysis);
    });
    // Sort groups by the most recent analysis within them
    return Object.values(groups).sort((a, b) => {
        const lastA = Math.max(...a.map(item => item.id));
        const lastB = Math.max(...b.map(item => item.id));
        return lastB - lastA;
    });
  }, [history]);
    
  return (
    <div className="space-y-8">
      <AggregateDashboard history={history} />

      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico Detalhado</h2>
            <button
            onClick={onNavigateToUpload}
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
            Analisar Novo Documento
            </button>
        </div>

        {history.length > 0 ? (
          <div className="space-y-6">
            {groupedHistory.map((group, index) => (
                <div key={group[0].fileHash || index} className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                     <div className="px-4 py-3 sm:px-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white truncate" title={group[0].fileName}>
                                    {group[0].fileName}
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                    Analisado {group.length} vez(es)
                                </p>
                            </div>
                            {group.length > 1 && (
                                <button
                                    onClick={() => onViewComparison(group)}
                                    className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                                >
                                    <ZapIcon className="w-4 h-4 mr-2"/>
                                    Analisar Consistência (Prova Real)
                                </button>
                            )}
                        </div>
                    </div>
                    <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.sort((a,b) => b.id - a.id).map((analysis) => (
                        <li key={analysis.id} onClick={() => onView(analysis.id)} className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                            <p className="flex-1 min-w-0 text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                Análise de {analysis.analyzedAt}
                            </p>
                            <div className="flex-shrink-0 flex items-center">
                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${analysis.complianceScore >= 4 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : analysis.complianceScore >= 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                    Score: {analysis.complianceScore.toFixed(1)}
                                </p>
                                <StarIcon className="w-4 h-4 ml-1 text-yellow-400" filled/>
                            </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    {analysis.requirements.length} requisitos encontrados
                                </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleDelete(e, analysis.id)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold flex items-center"
                                >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Excluir
                                </button>
                            </div>
                            </div>
                        </div>
                        </li>
                    ))}
                    </ul>
                </div>
            ))}
          </div>
        ) : (
           <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-lg shadow">
              <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Nenhum documento analisado ainda.</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Clique no botão "Analisar Novo Documento" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
