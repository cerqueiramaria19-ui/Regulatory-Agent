import React from 'react';
import { StrategicFrameworkArea } from '../types';
import { ShieldIcon, GearsIcon, ServerIcon, ScaleIcon, CheckCircleIcon, ChevronRightIcon } from './Icons';

interface StrategicFrameworkDiagramProps {
  framework: StrategicFrameworkArea[];
}

const areaIcons: { [key: string]: React.ReactNode } = {
  "Governança e Compliance": <ShieldIcon className="h-8 w-8 text-blue-500" />,
  "Operações e Processos": <GearsIcon className="h-8 w-8 text-purple-500" />,
  "Tecnologia e Dados": <ServerIcon className="h-8 w-8 text-emerald-500" />,
  "Riscos e Jurídico": <ScaleIcon className="h-8 w-8 text-amber-500" />,
};

const areaColors: { [key: string]: string } = {
    "Governança e Compliance": "border-blue-500",
    "Operações e Processos": "border-purple-500",
    "Tecnologia e Dados": "border-emerald-500",
    "Riscos e Jurídico": "border-amber-500",
};

export const StrategicFrameworkDiagram: React.FC<StrategicFrameworkDiagramProps> = ({ framework }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {framework.map((area) => (
        <div key={area.areaName} className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg border-t-4 ${areaColors[area.areaName] || 'border-gray-500'} flex flex-col`}>
          <div className="p-5 flex flex-col items-center text-center">
            {areaIcons[area.areaName] || <ShieldIcon className="h-8 w-8 text-gray-500" />}
            <h3 className="mt-3 text-md font-bold text-gray-900 dark:text-white">{area.areaName}</h3>
          </div>
          <div className="flex-grow p-5 pt-0">
            <div>
              <h4 className="font-semibold text-sm text-red-600 dark:text-red-400 mb-2">Desafios</h4>
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
              <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 mb-2">Recomendações Estratégicas</h4>
              <ul className="space-y-2">
                {area.recommendations.map((rec, index) => (
                  <li key={index} className="flex text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircleIcon className="h-4 w-4 mr-1 flex-shrink-0 text-green-500" />
                     <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};