import React, { useMemo } from 'react';
import { SavedAnalysis, Requirement } from '../types';
import { StarRating } from './StarRating';
import { FileTextIcon, ClipboardListIcon, StarIcon, ShieldIcon } from './Icons';

interface AggregateDashboardProps {
  history: SavedAnalysis[];
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle, trend }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
                {subtitle && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{subtitle}</p>}
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-3 flex items-center gap-1">
                <span className={`text-[10px] font-bold ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trend.isPositive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">vs. período anterior</span>
            </div>
        )}
    </div>
);

export const AggregateDashboard: React.FC<AggregateDashboardProps> = ({ history }) => {
  if (history.length === 0) {
    return null;
  }

  const stats = useMemo(() => {
    const totalAnalyses = history.length;
    const averageScore = history.reduce((sum, analysis) => sum + analysis.complianceScore, 0) / totalAnalyses;
    const allRequirements: Requirement[] = history.flatMap(analysis => analysis.requirements);
    const totalRequirements = allRequirements.length;
    
    const requirementsWithEvidence = allRequirements.filter(r => r.textualEvidence && r.textualEvidence.length > 10).length;
    const traceabilityRate = totalRequirements > 0 ? (requirementsWithEvidence / totalRequirements) * 100 : 0;

    // Radar Data Calculation
    const radarDimensions = [
        { subject: 'Eficiência de Capital', area: 'Financeiro e Riscos' },
        { subject: 'Risco Reputacional', area: 'Jurídico e Compliance' },
        { subject: 'Exp. do Cliente', area: 'Operacional' },
        { subject: 'Agilidade Reg.', area: 'Governança e Gestão' },
        { subject: 'Estabilidade Sist.', area: 'Segurança da Informação' },
        { subject: 'Inovação Prod.', area: 'Tecnologia e Dados' }
    ];

    const getStatusScore = (status: string): number => {
        const s = status.toLowerCase();
        if (s.includes('conforme') && !s.includes('não') && !s.includes('parcialmente')) return 5;
        if (s.includes('parcialmente')) return 3;
        if (s.includes('não conforme')) return 1;
        return 0;
    };

    const radarData = radarDimensions.map(dim => {
        const dimReqs = allRequirements.filter(r => r.area === dim.area);
        const score = dimReqs.length > 0 
            ? dimReqs.reduce((sum, r) => sum + getStatusScore(r.status), 0) / dimReqs.length 
            : 3.5; // Default/Neutral if no data
        return { subject: dim.subject, A: score, fullMark: 5 };
    });

    return {
        totalAnalyses,
        averageScore,
        totalRequirements,
        traceabilityRate,
        radarData
    };
  }, [history]);

  return (
    <div className="mb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Inteligência Regulatória Estratégica</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Visão consolidada do portfólio de conformidade e prontidão executiva.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Live Portfolio Analysis</span>
          </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
            title="Normas Analisadas" 
            value={stats.totalAnalyses} 
            subtitle="Documentos processados"
            icon={<FileTextIcon className="w-5 h-5"/>} 
        />
        <StatCard 
            title="Requisitos Mapeados" 
            value={stats.totalRequirements.toLocaleString()} 
            subtitle="Pontos de controle identificados"
            icon={<ClipboardListIcon className="w-5 h-5" />} 
        />
        <StatCard 
            title="Score de Confiança" 
            value={`${stats.averageScore.toFixed(1)}/5.0`} 
            subtitle="Média de conformidade global"
            icon={<StarIcon className="w-5 h-5" filled/>} 
        />
        <StatCard 
            title="Taxa de Rastreabilidade" 
            value={`${stats.traceabilityRate.toFixed(0)}%`} 
            subtitle="Requisitos com evidência direta"
            icon={<ShieldIcon className="w-5 h-5" />} 
        />
      </div>
    </div>
  );
};
