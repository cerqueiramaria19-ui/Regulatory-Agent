import React, { useState } from 'react';
import { ClipboardCopyIcon, FileDownIcon } from './Icons';
import { ValuePropositionData, StrategicFrameworkArea } from '../types';
import { StrategicFrameworkDiagram } from './StrategicFrameworkDiagram';
import { HORIZON_LABELS, PILLAR_COLORS } from '../constants';

interface ValuePropositionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegenerate: () => void;
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
    let text = `Proposta de Valor: Análise Estratégica e Plano de Ação para Conformidade Regulatória (Setor Bancário)\n\n`;
    text += `1. Resumo Executivo\n${data.executiveSummary}\n\n`;
    text += `2. O Cenário Regulatório e Seus Desafios\n${data.regulatoryChallenges}\n\n`;
    
    if (data.businessImpact) {
        text += `3. Impacto no Negócio e Eficiência de Capital\n`;
        text += `- Eficiência de Capital: ${data.businessImpact.capitalEfficiency || 'N/A'}\n`;
        text += `- Risco Reputacional: ${data.businessImpact.reputationalRisk || 'N/A'}\n`;
        text += `- Resiliência Operacional: ${data.businessImpact.operationalResilience || 'N/A'}\n\n`;
    }

    text += `4. Framework Estratégico de Impacto\n`;
    data.strategicFramework.forEach(area => {
        text += `\n- ${area.areaName} (${area.pillarType || 'N/A'}):\n`;
        text += `  - Desafios:\n${area.challenges.map(c => `    - ${c}`).join('\n')}\n`;
        text += `  - Recomendações Estratégicas:\n${area.strategicRecommendations?.map(r => `    - ${r}`).join('\n')}\n`;
        text += `  - Roadmap:\n${area.recommendations.map(r => {
            if (typeof r === 'string') return `    - ${r}`;
            return `    - [${r.horizon}] ${r.text}`;
        }).join('\n')}\n`;
    });
    text += `\n5. Nossa Solução e Parceria Estratégica\n${data.ourSolution}\n\n`;
    text += `6. Próximos Passos Sugeridos\n${data.nextSteps.map(s => `- ${s}`).join('\n')}\n`;
    return text;
}


export const ValuePropositionModal: React.FC<ValuePropositionModalProps> = ({ isOpen, onClose, onRegenerate, isLoading, data, error, fileName }) => {
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
                    y = margin + 20; // Extra padding at top of new page
                    return true;
                }
                return false;
            };
            
            const addText = (text: string, options: { currentY: number, fontSize?: number, fontStyle?: string, color?: string, align?: 'left' | 'center', maxWidth?: number }): number => {
                const { currentY, fontSize = 10, fontStyle = 'normal', color = textColor, align = 'left', maxWidth = usableWidth } = options;
                pdf.setFontSize(fontSize);
                pdf.setFont(undefined, fontStyle);
                pdf.setTextColor(color);
                
                const splitText = pdf.splitTextToSize(text, maxWidth);
                let localY = currentY;
                
                splitText.forEach((line: string) => {
                    if (checkPageBreak(fontSize * 1.5)) {
                        localY = y;
                        // Re-apply styles after page break
                        pdf.setFontSize(fontSize);
                        pdf.setFont(undefined, fontStyle);
                        pdf.setTextColor(color);
                    }
                    pdf.text(line, align === 'center' ? pageWidth / 2 : margin, localY, { align });
                    localY += fontSize * 1.2;
                });
                
                return localY;
            };

            const addList = (items: string[], listColor: string, currentY: number): number => {
                let localY = currentY;
                items.forEach(item => {
                    pdf.setFontSize(14).setTextColor(listColor);
                    if (checkPageBreak(15)) {
                        localY = y;
                    }
                    pdf.text('•', margin, localY + 8);
                    
                    const splitText = pdf.splitTextToSize(item, usableWidth - 20);
                    pdf.setFontSize(10).setTextColor(textColor).setFont(undefined, 'normal');
                    
                    splitText.forEach((line: string) => {
                        if (checkPageBreak(12)) {
                            localY = y;
                            // Re-apply bullet if it was the first line of a broken item? 
                            // Actually just continue the text
                        }
                        pdf.text(line, margin + 15, localY + 8);
                        localY += 12;
                    });
                    localY += 4;
                });
                return localY;
            };
            
            const addSection = (title: string, content: string | string[]) => {
                y += 10;
                checkPageBreak(30);
                y = addText(title, { currentY: y, fontSize: 14, fontStyle: 'bold', color: primaryColor }) + 5;
                if (typeof content === 'string') {
                    y = addText(content, { currentY: y }) + 5;
                } else if (Array.isArray(content)) {
                    y = addList(content, primaryColor, y);
                }
                y += 10;
            };

            const addFrameworkArea = (area: StrategicFrameworkArea) => {
                const areaColor = PILLAR_COLORS[area.pillarType] || '#6b7280';
                
                // Estimate height
                let estimatedHeight = 60; 
                area.challenges.forEach(c => {
                    estimatedHeight += pdf.splitTextToSize(c, usableWidth - 30).length * 12 + 4;
                });
                area.recommendations.forEach(r => {
                    const text = typeof r === 'string' ? r : r.text;
                    estimatedHeight += pdf.splitTextToSize(text, usableWidth - 30).length * 12 + 25;
                });

                // If it's too big for the current page, start on a new one
                if (y + 100 > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }

                const startY = y;
                y += 15;
                
                // Draw a colored bar at the top of the area
                pdf.setFillColor(areaColor);
                pdf.rect(margin, y, usableWidth, 3, 'F');
                y += 15;

                y = addText(area.areaName, { currentY: y, fontSize: 12, fontStyle: 'bold', color: headingColor });
                y += 8;
                y = addText('Desafios Críticos', { currentY: y, fontSize: 10, fontStyle: 'bold', color: redColor });
                y = addList(area.challenges, redColor, y);
                y += 12;
                y = addText('Recomendações Estratégicas', { currentY: y, fontSize: 10, fontStyle: 'bold', color: primaryColor });
                y = addList(area.strategicRecommendations || [], primaryColor, y);
                y += 12;
                y = addText('Roadmap Estratégico', { currentY: y, fontSize: 10, fontStyle: 'bold', color: greenColor });
                
                area.recommendations.forEach(rec => {
                    y += 8;
                    const isLegacy = typeof rec === 'string';
                    const horizon = isLegacy ? 'Immediate' : rec.horizon;
                    const text = isLegacy ? rec : rec.text;

                    y = addText(`[${HORIZON_LABELS[horizon] || horizon}]`, { currentY: y, fontSize: 8, fontStyle: 'bold', color: primaryColor });
                    y = addText(text, { currentY: y, fontSize: 10, maxWidth: usableWidth - 15 });
                });
                
                y += 20;
            };

            // --- PDF Content Generation ---
            y = addText('Proposta de Valor Estratégica (Banking)', { currentY: y, fontSize: 22, fontStyle: 'bold', color: headingColor, align: 'center' }) + 5;
            y = addText(`Baseado no documento: ${fileName}`, { currentY: y, fontSize: 12, color: '#6b7280', align: 'center' }) + 20;

            addSection('1. Resumo Executivo', data.executiveSummary);
            addSection('2. O Cenário Regulatório e Seus Desafios', data.regulatoryChallenges);
            
            if (data.businessImpact) {
                y += 15;
                checkPageBreak(150);
                y = addText('3. Impacto no Negócio e Eficiência de Capital', { currentY: y, fontSize: 14, fontStyle: 'bold', color: primaryColor }) + 15;
                
                const cardWidth = (usableWidth - 20) / 3;
                const impactItems = [
                    { label: 'EFICIÊNCIA DE CAPITAL', value: data.businessImpact.capitalEfficiency, color: '#3b82f6', bgColor: '#eff6ff' },
                    { label: 'RISCO REPUTACIONAL', value: data.businessImpact.reputationalRisk, color: '#d97706', bgColor: '#fffbeb' },
                    { label: 'RESILIÊNCIA OPERACIONAL', value: data.businessImpact.operationalResilience, color: '#059669', bgColor: '#ecfdf5' }
                ];

                let maxCardHeight = 0;
                impactItems.forEach(item => {
                    const h = pdf.splitTextToSize(item.value || 'N/A', cardWidth - 10).length * 10 * 1.2 + 30;
                    if (h > maxCardHeight) maxCardHeight = h;
                });

                impactItems.forEach((item, i) => {
                    const cardX = margin + (cardWidth + 10) * i;
                    pdf.setFillColor(item.bgColor);
                    pdf.roundedRect(cardX, y, cardWidth, maxCardHeight, 3, 3, 'F');
                    pdf.setDrawColor(item.color);
                    pdf.line(cardX, y, cardX, y + maxCardHeight);
                    
                    pdf.setFontSize(7).setFont(undefined, 'bold').setTextColor(item.color);
                    pdf.text(item.label, cardX + 5, y + 12);
                    
                    pdf.setFontSize(9).setFont(undefined, 'normal').setTextColor(textColor);
                    const splitVal = pdf.splitTextToSize(item.value || 'N/A', cardWidth - 10);
                    pdf.text(splitVal, cardX + 5, y + 25);
                });
                
                y += maxCardHeight + 25;
            }

            y = addText('4. Framework Estratégico de Impacto', { currentY: y, fontSize: 14, fontStyle: 'bold', color: primaryColor }) + 10;
            data.strategicFramework.forEach(addFrameworkArea);
            
            addSection('5. Nossa Solução e Parceria Estratégica', data.ourSolution);
            addSection('6. Próximos Passos Sugeridos', data.nextSteps);

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
                     <div className="flex items-center gap-3">
                        {!isLoading && data && (
                            <button 
                                onClick={onRegenerate}
                                type="button" 
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                Regenerar
                            </button>
                        )}
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
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}
                    {data && (
                        <div className="space-y-8">
                           {(!data.businessImpact?.capitalEfficiency || !data.strategicFramework?.[0]?.strategicRecommendations) && (
                               <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
                                   <div className="flex">
                                       <div className="flex-shrink-0">
                                           <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                           </svg>
                                       </div>
                                       <div className="ml-3">
                                           <p className="text-sm text-amber-700">
                                               Esta análise foi gerada em um padrão anterior. <button onClick={onRegenerate} className="font-bold underline hover:text-amber-800">Clique aqui para regenerar</button> e obter os novos indicadores de impacto de capital e recomendações estratégicas detalhadas.
                                           </p>
                                       </div>
                                   </div>
                               </div>
                           )}
                           <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm border-l-4 border-indigo-500">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Resumo Executivo</h4>
                               <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.executiveSummary}</p>
                           </div>
                           
                           {data.businessImpact && (
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                       <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">Eficiência de Capital</h5>
                                       <p className="text-xs text-gray-700 dark:text-gray-300">{data.businessImpact.capitalEfficiency || 'N/A'}</p>
                                   </div>
                                   <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                                       <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-2">Risco Reputacional</h5>
                                       <p className="text-xs text-gray-700 dark:text-gray-300">{data.businessImpact.reputationalRisk || 'N/A'}</p>
                                   </div>
                                   <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                       <h5 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">Resiliência Operacional</h5>
                                       <p className="text-xs text-gray-700 dark:text-gray-300">{data.businessImpact.operationalResilience || 'N/A'}</p>
                                   </div>
                               </div>
                           )}

                           <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">O Cenário Regulatório e Seus Desafios</h4>
                               <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.regulatoryChallenges}</p>
                           </div>
                           
                           <div>
                                <h4 className="text-xl text-center font-bold text-gray-800 dark:text-white mb-6">Framework Estratégico de Impacto</h4>
                                <StrategicFrameworkDiagram framework={data.strategicFramework} />
                           </div>

                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Nossa Solução e Parceria Estratégica</h4>
                               <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{data.ourSolution}</p>
                           </div>

                            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                               <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mb-3">Próximos Passos Sugeridos</h4>
                               <ul className="space-y-3">
                                    {data.nextSteps.map((step, index) => (
                                        <li key={index} className="flex items-start text-gray-700 dark:text-gray-300">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 mr-3 mt-0.5 flex-shrink-0">
                                                <svg className="h-3 w-3 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                            </span>
                                            <span className="text-sm">{step}</span>
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
