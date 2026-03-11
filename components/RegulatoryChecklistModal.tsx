
import React, { useState } from 'react';
import { RegulatoryChecklistData } from '../types';
import { CheckCircleIcon, AlertCircleIcon, FileDownIcon, ClipboardCopyIcon } from './Icons';

interface RegulatoryChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegenerate: () => void;
    isLoading: boolean;
    data: RegulatoryChecklistData | null;
    error: string | null;
    fileName: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Gerando checklist regulatório...</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Mapeando requisitos críticos para assertividade comercial.</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Ocorreu um Erro</h3>
        <p className="mt-2 text-center text-red-700 dark:text-red-300">{message}</p>
    </div>
);

export const RegulatoryChecklistModal: React.FC<RegulatoryChecklistModalProps> = ({ 
    isOpen, 
    onClose, 
    onRegenerate, 
    isLoading, 
    data, 
    error, 
    fileName 
}) => {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!isOpen) return null;

    const toggleItem = (id: string) => {
        setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = () => {
        if (!data) return;
        let text = `Diagnóstico de Clarificação Estratégica: ${data.title}\n`;
        text += `Documento: ${fileName}\n\n`;
        text += `${data.description}\n\n`;
        data.items.forEach(item => {
            const status = checkedItems[item.id] ? '[OK] CLARIFICADO' : '[ ] INVESTIGAR';
            text += `${status} - ${item.requirement}${item.isCritical ? ' (ALTO IMPACTO)' : ''}\n`;
            text += `   Pergunta de Clarificação: ${item.description}\n`;
            text += `   Realidade Operacional: ${item.impact}\n\n`;
        });
        navigator.clipboard.writeText(text);
        alert('Diagnóstico de clarificação copiado!');
    };

    const handleGeneratePdf = async () => {
        const { jsPDF } = (window as any).jspdf;
        if (!data || !jsPDF) return;

        setIsGeneratingPdf(true);
        try {
            const pdf = new jsPDF();
            const margin = 20;
            let y = margin;

            pdf.setFontSize(18).setTextColor(13, 148, 136); // teal-600
            pdf.text('Diagnóstico de Clarificação Estratégica', margin, y);
            y += 10;
            
            pdf.setFontSize(10).setTextColor(107, 114, 128); // gray-500
            pdf.text(`Desvendando a Realidade Operacional - Documento: ${fileName}`, margin, y);
            y += 15;

            pdf.setFontSize(12).setTextColor(31, 41, 55).setFont(undefined, 'bold');
            pdf.text(data.title, margin, y);
            y += 7;
            
            pdf.setFontSize(10).setFont(undefined, 'normal').setTextColor(75, 85, 99);
            const splitDesc = pdf.splitTextToSize(data.description, 170);
            pdf.text(splitDesc, margin, y);
            y += splitDesc.length * 5 + 10;

            data.items.forEach((item, index) => {
                if (y > 270) {
                    pdf.addPage();
                    y = margin;
                }

                const isChecked = checkedItems[item.id];
                pdf.setDrawColor(209, 213, 219);
                pdf.rect(margin, y, 5, 5);
                if (isChecked) {
                    pdf.setDrawColor(13, 148, 136);
                    pdf.line(margin, y, margin + 5, y + 5);
                    pdf.line(margin + 5, y, margin, y + 5);
                }

                pdf.setFontSize(10).setFont(undefined, 'bold');
                if (item.isCritical) {
                    pdf.setTextColor(220, 38, 38);
                } else {
                    pdf.setTextColor(31, 41, 55);
                }
                const reqText = `${item.requirement}${item.isCritical ? ' [ALTO IMPACTO]' : ''}`;
                pdf.text(reqText, margin + 8, y + 4);
                y += 6;

                pdf.setFontSize(9).setFont(undefined, 'normal').setTextColor(75, 85, 99);
                const splitItemDesc = pdf.splitTextToSize(`Pergunta de Clarificação: ${item.description}`, 160);
                pdf.text(splitItemDesc, margin + 8, y + 3);
                y += splitItemDesc.length * 4 + 5;

                pdf.setFontSize(8).setFont(undefined, 'italic').setTextColor(107, 114, 128);
                pdf.text(`Realidade Operacional: ${item.impact}`, margin + 8, y + 2);
                y += 10;
            });

            pdf.save(`Checklist-Regulatorio-${fileName.split('.')[0]}.pdf`);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const progress = data ? Math.round((Object.values(checkedItems).filter(Boolean).length / data.items.length) * 100) : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                            Diagnóstico de Clarificação Estratégica
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Desvendando a realidade operacional para o documento: <span className="font-medium">{fileName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isLoading && data && (
                            <button 
                                onClick={onRegenerate}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100"
                            >
                                Regenerar
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Fechar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}
                    {data && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <h4 className="font-bold text-teal-600 mb-1">{data.title}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{data.description}</p>
                                
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium">Nível de Clarificação da Realidade</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-teal-500 h-2 rounded-full transition-all duration-500" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {data.items.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                            checkedItems[item.id] 
                                                ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800' 
                                                : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700 hover:border-teal-300'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                                                checkedItems[item.id] ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                                {checkedItems[item.id] && <CheckCircleIcon className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold text-sm ${checkedItems[item.id] ? 'text-teal-900 dark:text-teal-100' : 'text-gray-900 dark:text-white'}`}>
                                                        {item.requirement}
                                                    </span>
                                                    {item.isCritical && (
                                                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                                            Ponto Crítico
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded border-l-2 border-teal-400">
                                                    <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-1">Pergunta de Clarificação:</p>
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 italic">"{item.description}"</p>
                                                </div>
                                                <div className="mt-2 flex items-center text-[10px] text-gray-500 uppercase tracking-tighter font-semibold">
                                                    <AlertCircleIcon className="w-3 h-3 mr-1 text-amber-500" />
                                                    Realidade Operacional: {item.impact}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        {Object.values(checkedItems).filter(Boolean).length} de {data?.items.length || 0} pontos clarificados
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={handleCopy}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                        >
                            <ClipboardCopyIcon className="w-4 h-4 mr-2" />
                            Copiar Texto
                        </button>
                        <button 
                            onClick={handleGeneratePdf}
                            disabled={isGeneratingPdf}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md shadow-sm hover:bg-teal-700 disabled:opacity-50"
                        >
                            <FileDownIcon className="w-4 h-4 mr-2" />
                            {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
