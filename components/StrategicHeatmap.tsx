import React from 'react';
import { SavedAnalysis } from '../types';
import { motion } from 'motion/react';

interface StrategicHeatmapProps {
  history: SavedAnalysis[];
}

const BIP_SERVICES = [
  { id: 'S1', name: 'Estratégia e Transformação Digital', short: 'Estratégia' },
  { id: 'S2', name: 'Adequação Regulatória e Evolução do Ecossistema', short: 'Regulatório' },
  { id: 'S3', name: 'Infraestrutura e Capacidades Digitais', short: 'Infra' },
  { id: 'S4', name: 'Eficiência Operacional e Inteligência', short: 'Eficiência' }
];

export const StrategicHeatmap: React.FC<StrategicHeatmapProps> = ({ history }) => {
  const recentHistory = [...history].sort((a, b) => b.id - a.id).slice(0, 5);

  const getHeatStyles = (score: number) => {
    if (score === 0) return 'bg-slate-50 dark:bg-slate-900/40 text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-800';
    if (score >= 80) return 'bg-slate-900 text-white border-slate-900 shadow-sm';
    if (score >= 60) return 'bg-slate-700 text-white border-slate-700';
    if (score >= 40) return 'bg-slate-500 text-white border-slate-500';
    if (score >= 20) return 'bg-slate-300 text-slate-800 border-slate-300';
    return 'bg-slate-100 text-slate-500 border-slate-100';
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-3 border-spacing-x-2">
          <thead>
            <tr>
              <th className="p-2 w-48 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  Documento Analisado
                </span>
              </th>
              {BIP_SERVICES.map(service => (
                <th key={service.id} className="p-2 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] block">
                    {service.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentHistory.map((analysis, aIdx) => (
              <tr key={analysis.id} className="group">
                <td className="py-2 pr-4">
                  <div className="flex flex-col border-l-2 border-slate-200 dark:border-slate-700 pl-3 group-hover:border-indigo-500 transition-colors">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate w-40" title={analysis.fileName}>
                      {analysis.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(analysis.analyzedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </td>
                {BIP_SERVICES.map((service, sIdx) => {
                  const score = analysis.bipServiceScores?.[service.id] || 0;
                  const styleClass = getHeatStyles(score);
                  
                  return (
                    <td key={service.id} className="p-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (aIdx * 0.05) + (sIdx * 0.03) }}
                        className={`h-16 w-full rounded-lg border flex flex-col items-center justify-center transition-all hover:brightness-110 cursor-help ${styleClass}`}
                        title={`${service.name}: ${score}% de aderência BIP`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60 mb-0.5">
                          Fit Score
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          {score > 0 ? `${score}%` : '—'}
                        </span>
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Legend */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-slate-900 border border-slate-900"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aderência Crítica</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-slate-500 border border-slate-500"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Oportunidade Média</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-100"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Baixa Relevância</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded bg-slate-50 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-800"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sem Enquadramento</span>
        </div>
      </div>
    </div>
  );
};
