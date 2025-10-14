
import React from 'react';
import { Requirement } from '../types';

interface ReviewModeProps {
  requirements: Requirement[];
  documentText: string; // Assuming the original document text is available
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ requirements, documentText }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Modo de Revisão</h3>
      <p className="text-gray-600 dark:text-gray-300">
        Este modo de visualização permite comparar os requisitos extraídos com o texto original do documento.
        (Funcionalidade a ser implementada)
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold">Texto do Documento</h4>
          <div className="mt-2 p-2 border rounded h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700">
            <pre className="whitespace-pre-wrap text-sm">{documentText || "Texto do documento não disponível."}</pre>
          </div>
        </div>
        <div>
          <h4 className="font-semibold">Requisitos Extraídos</h4>
          <div className="mt-2 p-2 border rounded h-96 overflow-y-auto bg-gray-50 dark:bg-gray-700">
            {requirements.map(req => (
              <div key={req.id} className="p-2 mb-2 border-b">
                <p className="font-bold">{req.requirementText}</p>
                <p className="text-xs text-gray-500">Evidência: {req.textualEvidence}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
