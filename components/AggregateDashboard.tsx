import React from 'react';
import { SavedAnalysis, Requirement } from '../types';
import { StarRating } from './StarRating';
import { AreaPieChart } from './AreaPieChart';
import { PriorityPieChart } from './PriorityPieChart';
import { FileTextIcon, ClipboardListIcon, StarIcon } from './Icons';

interface AggregateDashboardProps {
  history: SavedAnalysis[];
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


export const AggregateDashboard: React.FC<AggregateDashboardProps> = ({ history }) => {
  if (history.length === 0) {
    return null; // Don't show the dashboard if there's no history
  }

  const totalAnalyses = history.length;
  const averageScore = history.reduce((sum, analysis) => sum + analysis.complianceScore, 0) / totalAnalyses;
  const allRequirements: Requirement[] = history.flatMap(analysis => analysis.requirements);
  const totalRequirements = allRequirements.length;

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Geral</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
            title="Documentos Analisados" 
            value={totalAnalyses} 
            icon={<FileTextIcon className="w-6 h-6"/>} 
        />
        <StatCard 
            title="Total de Requisitos" 
            value={totalRequirements} 
            icon={<ClipboardListIcon className="w-6 h-6" />} 
        />
        <StatCard 
            title="Média de Score" 
            value={averageScore.toFixed(1)} 
            icon={<StarIcon className="w-6 h-6" filled/>} 
            footer={<StarRating score={averageScore} />}
        />
      </div>
      
      {allRequirements.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Distribuição Geral por Área</h3>
            <AreaPieChart data={allRequirements} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Distribuição Geral por Prioridade</h3>
            <PriorityPieChart data={allRequirements} />
            </div>
        </div>
      )}
    </div>
  );
};