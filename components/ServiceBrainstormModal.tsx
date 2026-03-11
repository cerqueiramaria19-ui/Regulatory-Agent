
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ZapIcon, ShieldIcon, ServerIcon, GearsIcon, AlertCircleIcon } from './Icons';
import { ServiceBrainstormData } from '../types';

interface ServiceBrainstormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  data: ServiceBrainstormData | null;
  error: string | null;
}

const getIconForPillar = (pillar: string) => {
  switch (pillar) {
    case 'governance': return <ZapIcon className="w-6 h-6 text-amber-500" />;
    case 'risk': return <ShieldIcon className="w-6 h-6 text-indigo-500" />;
    case 'technology': return <ServerIcon className="w-6 h-6 text-emerald-500" />;
    case 'operations': return <GearsIcon className="w-6 h-6 text-blue-500" />;
    default: return <ZapIcon className="w-6 h-6 text-gray-500" />;
  }
};

const getColorForPillar = (pillar: string) => {
  switch (pillar) {
    case 'governance': return 'bg-amber-50 border-amber-200';
    case 'risk': return 'bg-indigo-50 border-indigo-200';
    case 'technology': return 'bg-emerald-50 border-emerald-200';
    case 'operations': return 'bg-blue-50 border-blue-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

export const ServiceBrainstormModal: React.FC<ServiceBrainstormModalProps> = ({ 
  isOpen, 
  onClose, 
  onRegenerate,
  isLoading,
  data,
  error
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-700 text-white">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Pool de Ideias</h2>
                <p className="text-indigo-100 text-sm mt-1">Serviços estratégicos gerados sob medida para esta norma.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Cruzando dados da norma com o portfólio BIP...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertCircleIcon className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                  <p className="text-gray-900 dark:text-white font-bold mb-2">Ops! Algo deu errado.</p>
                  <p className="text-gray-500 text-sm mb-6">{error}</p>
                  <button 
                    onClick={onRegenerate}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.sections.map((section, idx) => (
                    <motion.div
                      key={section.title}
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-5 rounded-xl border ${getColorForPillar(section.pillarType)} dark:bg-gray-900 dark:border-gray-800 shadow-sm flex flex-col`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                          {getIconForPillar(section.pillarType)}
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                          {section.title}
                        </h3>
                      </div>
                      <ul className="space-y-3 flex-1">
                        {section.ideas.map((idea, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2 group">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                              {idea}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12">
                  <ZapIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma ideia gerada ainda.</p>
                  <button 
                    onClick={onRegenerate}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold"
                  >
                    Gerar Brainstorming
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center">
              <button
                onClick={onRegenerate}
                disabled={isLoading}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regerar com IA
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
