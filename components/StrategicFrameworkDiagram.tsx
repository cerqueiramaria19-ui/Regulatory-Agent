import React from 'react';
import { StrategicFrameworkArea } from '../types';
import { ShieldIcon, GearsIcon, ServerIcon, ScaleIcon, CheckCircleIcon, ChevronRightIcon } from './Icons';

import { HORIZON_LABELS, PILLAR_COLORS } from '../constants';

interface StrategicFrameworkDiagramProps {
  framework: StrategicFrameworkArea[];
}

const areaIcons: { [key: string]: React.ReactNode } = {
  "governance": <ShieldIcon className="h-8 w-8 text-blue-500" />,
  "operations": <GearsIcon className="h-8 w-8 text-purple-500" />,
  "technology": <ServerIcon className="h-8 w-8 text-emerald-500" />,
  "risk": <ScaleIcon className="h-8 w-8 text-amber-500" />,
};

const areaColors: { [key: string]: string } = {
    "governance": "border-blue-500",
    "operations": "border-purple-500",
    "technology": "border-emerald-500",
    "risk": "border-amber-500",
};

const horizonColors: { [key: string]: string } = {
    "Immediate": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "Structural": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Innovation": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export const StrategicFrameworkDiagram: React.FC<StrategicFrameworkDiagramProps> = ({ framework }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {framework.map((area) => (
        <div key={area.areaName} className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border-t-4 ${areaColors[area.pillarType] || 'border-gray-500'} flex flex-col`}>
          <div className="p-5 flex flex-col items-center text-center">
            {areaIcons[area.pillarType] || <ShieldIcon className="h-8 w-8 text-gray-500" />}
            <h3 className="mt-3 text-md font-bold text-gray-900 dark:text-white">{area.areaName}</h3>
          </div>
          <div className="flex-grow p-5 pt-0">
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-2">Desafios Críticos</h4>
              <ul className="space-y-2">
                {area.challenges.map((challenge, index) => (
                  <li key={index} className="flex text-xs text-gray-600 dark:text-gray-300">
                    <ChevronRightIcon className="h-4 w-4 mr-1 flex-shrink-0 text-red-400" />
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-2">Recomendações Estratégicas</h4>
              <ul className="space-y-2">
                {area.strategicRecommendations?.map((rec, index) => (
                  <li key={index} className="flex text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0 text-emerald-400" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-400 mb-2">Roadmap Estratégico</h4>
              <div className="space-y-3">
                {area.recommendations.map((rec, index) => {
                  const isLegacy = typeof rec === 'string';
                  const horizon = isLegacy ? 'Immediate' : rec.horizon;
                  const text = isLegacy ? rec : rec.text;
                  
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${horizonColors[horizon] || 'bg-gray-100 text-gray-600'}`}>
                        {HORIZON_LABELS[horizon] || 'Recomendação'}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
