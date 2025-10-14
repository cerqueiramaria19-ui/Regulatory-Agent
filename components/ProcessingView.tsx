
import React, { useState, useEffect } from 'react';

interface ProcessingViewProps {
    fileName: string;
}

const statusMessages = [
    "Iniciando análise do documento...",
    "Extraindo texto e estrutura...",
    "Identificando requisitos chave...",
    "Classificando por área de impacto (Compliance, Jurídico, TI)...",
    "Avaliando a complexidade e viabilidade...",
    "Gerando score de conformidade...",
    "Construindo painel de resultados...",
    "Finalizando...",
];

export const ProcessingView: React.FC<ProcessingViewProps> = ({ fileName }) => {
    const [progress, setProgress] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) {
                    clearInterval(progressInterval);
                    return 98;
                }
                return prev + 1;
            });
        }, 300);

        const messageInterval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % statusMessages.length);
        }, 3000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
        };
    }, []);

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Processando seu Documento</h2>
            <p className="text-md text-indigo-500 dark:text-indigo-400 font-semibold mb-6 truncate">{fileName}</p>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                <div 
                    className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-linear" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{`${progress}%`}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 h-5">
                {statusMessages[messageIndex]}
            </p>
        </div>
    );
};
