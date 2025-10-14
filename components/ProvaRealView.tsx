
import React from 'react';
import { SavedAnalysis } from '../types';
import { StarRating } from './StarRating';
import { FileTextIcon, ClipboardListIcon, StarIcon } from './Icons';

interface ProvaRealViewProps {
  analyses: SavedAnalysis[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    footer?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, footer }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-between">
        <div>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                <div className="text-gray-400 dark:text-gray-500">{icon}</div>
            </div>
            <div className="mt-1">
                <h3 className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</h3>
            </div>
        </div>
        {footer && <div className="mt-4">{footer}</div>}
    </div>
);

export const ProvaRealView: React.FC<ProvaRealViewProps> = ({ analyses }) => {
    if (!analyses || analyses.length === 0) {
        return <p>Nenhuma análise para comparar.</p>;
    }

    const scores = analyses.map(a => a.complianceScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const stdDev = Math.sqrt(scores.map(x => Math.pow(x - avgScore, 2)).reduce((a, b) => a + b, 0) / scores.length);

    const firstAnalysis = analyses[0];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Análise de Consistência (Prova Real)</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400" title={firstAnalysis.fileName}>
                    Resultados para o arquivo: <span className="font-semibold text-indigo-500">{firstAnalysis.fileName}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Média de Score" 
                    value={avgScore.toFixed(2)} 
                    icon={<StarIcon className="w-6 h-6" />} 
                    footer={<StarRating score={avgScore} />}
                />
                 <StatCard 
                    title="Score Mínimo" 
                    value={minScore.toFixed(2)} 
                    icon={<StarIcon className="w-6 h-6" />} 
                />
                 <StatCard 
                    title="Score Máximo" 
                    value={maxScore.toFixed(2)} 
                    icon={<StarIcon className="w-6 h-6" />} 
                />
                 <StatCard 
                    title="Desvio Padrão" 
                    value={stdDev.toFixed(2)} 
                    icon={<ClipboardListIcon className="w-6 h-6" />} 
                    footer={<p className="text-xs text-gray-500 dark:text-gray-400">Valores mais baixos indicam maior consistência.</p>}
                />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <h3 className="text-xl font-semibold p-6">Resultados Detalhados por Análise</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data da Análise</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº de Requisitos</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº de Discrepâncias</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {analyses.map(analysis => (
                                <tr key={analysis.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{analysis.analyzedAt}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{analysis.complianceScore.toFixed(1)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{analysis.requirements.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{analysis.discrepancies.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold mb-4">Resumos Gerados pela IA</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analyses.map(analysis => (
                        <div key={analysis.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2">{analysis.analyzedAt}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{analysis.summary}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
