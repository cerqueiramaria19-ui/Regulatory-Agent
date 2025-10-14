import React from 'react';
import { FundingAgentMention } from '../types';
import { DollarSignIcon } from './Icons';

interface FundingAgentReportProps {
  mentions: FundingAgentMention[];
}

export const FundingAgentReport: React.FC<FundingAgentReportProps> = ({ mentions }) => {
  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div>
        <div className="flex items-center mb-4">
            <DollarSignIcon className="h-6 w-6 text-green-500 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Relatório de Menções a Agentes Financiadores
            </h3>
        </div>
        <div className="space-y-4">
            {mentions.map((mention, index) => (
            <div key={index} className="p-4 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <blockquote className="border-l-4 border-green-500 pl-4 italic text-gray-700 dark:text-gray-300">
                    "{mention.mention}"
                </blockquote>
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-semibold">Contexto:</span> {mention.context}
                    </p>
                    <span className="flex-shrink-0 ml-4 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-100 dark:bg-green-800/50 rounded-full">
                        Página: {mention.pageNumber}
                    </span>
                </div>
            </div>
            ))}
        </div>
    </div>
  );
};