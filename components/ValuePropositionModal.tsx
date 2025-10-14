import React, { useState } from 'react';
import { ClipboardCopyIcon, FileDownIcon } from './Icons';
import { ValuePropositionData, StrategicFrameworkArea } from '../types';
import { StrategicFrameworkDiagram } from './StrategicFrameworkDiagram';

interface ValuePropositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    data: ValuePropositionData | null;
    error: string | null;
    fileName: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Gerando proposta de valor...</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Analisando, conectando e construindo uma visão estratégica.</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Ocorreu um Erro</h3>
        <p className="mt-2 text-center text-red-700 dark:text-red-300">{message}</p>
    </div>
);

const formatDataForCopy = (data: ValuePropositionData): string => {
    let text = `Proposta de Valor: Análise Estratégica e Plano de Ação para Conformidade Regulatória\n\n`;
    text += `1. Resumo Executivo\n${data.executiveSummary}\n\n`;
    text += `2. O Cenário Regulatório e Seus Desafios\n${data.regulatoryChallenges}\n\n`;
    text += `3. Framework Estratégico de Impacto\n`;
    data.strategicFramework.forEach(area => {
        text += `\n- ${area.areaName}:\n`;
        text += `  - Desafios:\n${area.challenges.map(c => `    - ${c}`).join('\n')}\n`;
        text += `  - Recomendações Estratégicas:\n${area.recommendations.map(r => `    - ${r}`).join('\n')}\n`;
    });
    text += `\n4. Nossa Solução e Parceria Estratégica\n${data.ourSolution}\n\n`;
    text += `5. Próximos Passos Sugeridos\n${data.nextSteps.map(s => `- ${s}`).join('\n')}\n`;
    return text;
}


export const ValuePropositionModal: React.FC<ValuePropositionModalProps> = ({ isOpen, onClose, isLoading, data, error, fileName }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copiar Texto');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    if (!isOpen) return null;

    const handleCopy = () => {
        if (data) {
            const formattedText = formatDataForCopy(data);
            navigator.clipboard.writeText(formattedText);
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Copiar Texto'), 2000);
        }
    };

    const handleGeneratePdf = async () => {
        const { jsPDF } = (window as any).jspdf;
        if (!data || !jsPDF) {
            alert("Dados ou biblioteca PDF não disponíveis.");
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
            const margin = 50;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const usableWidth = pageWidth - margin * 2;
            let y = margin;

            // Colors and Fonts
            const primaryColor = '#4f46e5'; // indigo-600
            const textColor = '#374151'; // gray-700
            const headingColor = '#111827'; // gray-900
            const redColor = '#ef4444'; // red-500
            const greenColor = '#22c55e'; // green-500

            // --- PDF Helper Functions ---
            const checkPageBreak = (neededHeight: number) => {
                if (y + neededHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };
            
            const addText = (text: string, options: { currentY: number, fontSize?: number, fontStyle?: string, color?: string, align?: 'left' | 'center', maxWidth?: number }): number => {
                const { currentY, fontSize = 10, fontStyle = 'normal', color = textColor, align = 'left', maxWidth = usableWidth } = options;
                const splitText = pdf.splitTextToSize(text, maxWidth);
                const textHeight = splitText.length * fontSize * 1.2;
                pdf.setFontSize(fontSize);
                pdf.setFont(undefined, fontStyle);
                pdf.setTextColor(color);
                pdf.text(splitText, align === 'center' ? pageWidth / 2 : margin, currentY, { align });
                return currentY + textHeight;
            };

            const addList = (items: string[], listColor: string, currentY: number): number => {
                items.forEach(item => {
                    const splitText = pdf.splitTextToSize(item, usableWidth - 15);
                    const itemHeight = splitText.length * 10 * 1.2;
                    checkPageBreak(itemHeight + 4);
                    pdf.setFontSize(14).setTextColor(listColor);
                    pdf.text('•', margin, currentY + 8);
                    pdf.setFontSize(10).setTextColor(textColor);
                    pdf.text(splitText, margin + 15, currentY + 8);
                    currentY += itemHeight + 4;
                });
                return currentY;
            };
            
            const addSection = (title: string, content: string | string[]) => {
                y += 15;
                checkPageBreak(14 * 1.2 + 10 * 1.2 + 20); // Space for title and at least one line
                y = addText(title, { currentY: y, fontSize: 14, fontStyle: 'bold', color: primaryColor }) + 10;
                if (typeof content === 'string') {
                    y = addText(content, { currentY: y }) + 5;
                } else if (Array.isArray(content)) {
                    y = addList(content, primaryColor, y);
                }
                y += 10;
            };

            const addFrameworkArea = (area: StrategicFrameworkArea) => {
                const areaColor = { "Governança e Compliance": "#3b82f6", "Operações e Processos": "#8b5cf6", "Tecnologia e Dados": "#10b981", "Riscos e Jurídico": "#f59e0b" }[area.areaName] || '#6b7280';
                
                // Estimate height for page break check
                const challengesHeight = area.challenges.map(c => pdf.splitTextToSize(c, usableWidth - 25).length * 10 * 1.2 + 4).reduce((a, b) => a + b, 0);
                const recsHeight = area.recommendations.map(r => pdf.splitTextToSize(r, usableWidth - 25).length * 10 * 1.2 + 4).reduce((a, b) => a + b, 0);
                const estimatedHeight = challengesHeight + recsHeight + 80;
                
                checkPageBreak(estimatedHeight);
                const startY = y;
                let contentY = startY;

                // Draw content first to get exact height, then draw box behind it
                contentY += 15;
                contentY = addText(area.areaName, { currentY: contentY, fontSize: 12, fontStyle: 'bold', color: headingColor });
                contentY += 5;
                contentY = addText('Desafios', { currentY: contentY, fontSize: 10, fontStyle: 'bold', color: redColor });
                contentY = addList(area.challenges, redColor, contentY);
                contentY += 10;
                contentY = addText('Recomendações Estratégicas', { currentY: contentY, fontSize: 10, fontStyle: 'bold', color: greenColor });
                contentY = addList(area.recommendations, greenColor, contentY);
                
                const boxHeight = (contentY - startY) + 15;

                // Draw the box
                pdf.setDrawColor('#E5E7EB');
                pdf.setFillColor('#F9FAFB');
                pdf.roundedRect(margin - 10, startY, usableWidth + 20, boxHeight, 3, 3, 'FD');
                pdf.setFillColor(areaColor);
                pdf.rect(margin - 10, startY, usableWidth + 20, 4, 'F');
                
                // Redraw text on top of the box
                let textY = startY;
                textY += 15;
                textY = addText(area.areaName, { currentY: textY, fontSize: 12, fontStyle: 'bold', color: headingColor });
                textY += 5;
                textY = addText('Desafios', { currentY: textY, fontSize: 10, fontStyle: 'bold', color: redColor });
                textY = addList(area.challenges, redColor, textY);
                textY += 10;
                textY = addText('Recomendações Estratégicas', { currentY: textY, fontSize: 10, fontStyle: 'bold', color: greenColor });
                textY = addList(area.recommendations, greenColor, textY);
                
                y = startY + boxHeight + 20;
            };

            // --- PDF Content Generation ---
            y = addText('Proposta de Valor Estratégica', { currentY: y, fontSize: 22, fontStyle: 'bold', color: headingColor, align: 'center' }) + 5;
            y = addText(`Baseado no documento: ${fileName}`, { currentY: y, fontSize: 12, color: '#6b7280', align: 'center' }) + 20;

            addSection('1. Resumo Executivo', data.executiveSummary);
            addSection('2. O Cenário Regulatório e Seus Desafios', data.regulatoryChallenges);
            
            y += 15;
            y = addText('3. Framework Estratégico de Impacto', { currentY: y, fontSize: 14, fontStyle: 'bold', color: primaryColor }) + 10;
            data.strategicFramework.forEach(addFrameworkArea);
            
            addSection('4. Nossa Solução e Parceria Estratégica', data.ourSolution);
            addSection('5. Próximos Passos Sugeridos', data.nextSteps);

            pdf.save(`Proposta-de-Valor-${fileName.split('.')[0] || 'documento'}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                            Proposta de Valor Estratégica
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Baseado no documento: <span className="font-medium">{fileName}</span>
                        </p>
                    </div>
                     {!isLoading && data && (
                        <button 
                            onClick={handleGeneratePdf}
                            type="button" 
                            disabled={isGeneratingPdf}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                            <FileDownIcon className="w-4 h-4 mr-2" />
                            {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
                        </button>
                    )}
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}
                    {data && (
                        <div className="space-y-8">
                           <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Resumo Executivo</h4>
                               <p className="text-gray-700 dark:text-gray-300">{data.executiveSummary}</p>
                           </div>
                           <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">O Cenário Regulatório e Seus Desafios</h4>
                               <p className="text-gray-700 dark:text-gray-300">{data.regulatoryChallenges}</p>
                           </div>
                           <div>
                                <h4 className="text-xl text-center font-bold text-gray-800 dark:text-white mb-4">Framework Estratégico de Impacto</h4>
                                <StrategicFrameworkDiagram framework={data.strategicFramework} />
                           </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Nossa Solução e Parceria Estratégica</h4>
                               <p className="text-gray-700 dark:text-gray-300">{data.ourSolution}</p>
                           </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Próximos Passos Sugeridos</h4>
                               <ul className="space-y-2">
                                    {data.nextSteps.map((step, index) => (
                                        <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 mr-3">
                                                <svg className="h-4 w-4 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                               </ul>
                           </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-white dark:bg-gray-800/80 backdrop-blur-sm flex justify-end gap-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none">
                        Fechar
                    </button>
                    {!isLoading && data && (
                        <button 
                            onClick={handleCopy} 
                            type="button" 
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <ClipboardCopyIcon className="w-4 h-4 mr-2" />
                            {copyButtonText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
