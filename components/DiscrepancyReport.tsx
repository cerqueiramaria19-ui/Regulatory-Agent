
import React from 'react';
import { Discrepancy } from '../types';

interface DiscrepancyReportProps {
  discrepancies: Discrepancy[];
}

const severityColors: { [key in Discrepancy['severity']]: string } = {
    high: 'border-red-500',
    medium: 'border-yellow-500',
    low: 'border-blue-500',
};

export const DiscrepancyReport: React.FC<DiscrepancyReportProps> = ({ discrepancies }) => {
  if (!discrepancies || discrepancies.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-yellow-500 dark:text-yellow-400">Relatório de Discrepâncias e Ambiguidade</h3>
      <div className="space-y-4">
        {discrepancies.map((disc) => (
          <div key={disc.id} className={`p-4 rounded-md bg-yellow-50 dark:bg-gray-700 border-l-4 ${severityColors[disc.severity]}`}>
            <p className="font-semibold text-gray-800 dark:text-white">
              <span className="uppercase text-xs font-bold mr-2">[{disc.severity}]</span>
              {disc.description}
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Sugestão:</span> {disc.suggestion}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
