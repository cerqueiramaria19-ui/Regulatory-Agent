import React, { useState, useEffect } from 'react';
// FIX: Corrected import path to be relative
import { Requirement, Area, Priority, Status } from '../types';
import { FileDownIcon } from './Icons';

interface RequirementModalProps {
    isOpen: boolean;
    onClose: () => void;
    requirement: Requirement;
    onSave: (updatedRequirement: Requirement) => void;
}

export const RequirementModal: React.FC<RequirementModalProps> = ({ isOpen, onClose, requirement, onSave }) => {
    const [editedReq, setEditedReq] = useState<Requirement>(requirement);
    const [isSavingPdf, setIsSavingPdf] = useState(false);

    useEffect(() => {
        setEditedReq(requirement);
    }, [requirement]);
    
    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedReq(prev => ({...prev, [name]: value}));
    }

    const handleSave = () => {
        onSave(editedReq);
    }

    const handleSavePdf = async () => {
        const { jsPDF } = (window as any).jspdf;
    
        if (!jsPDF) {
            alert("Erro: biblioteca para gerar PDF não encontrada. Recarregue a página.");
            return;
        }
    
        setIsSavingPdf(true);
        try {
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4'
            });
    
            const margin = 40;
            const pageWidth = pdf.internal.pageSize.getWidth();
            const usableWidth = pageWidth - margin * 2;
            let y = margin;
    
            const addText = (text: string, options: { fontSize?: number; isBold?: boolean; isTitle?: boolean; spaceAfter?: number }) => {
                const { fontSize = 10, isBold = false, isTitle = false, spaceAfter = 5 } = options;
                
                if (y > pdf.internal.pageSize.getHeight() - margin * 2) {
                    pdf.addPage();
                    y = margin;
                }
    
                pdf.setFontSize(fontSize);
                pdf.setFont(undefined, isBold ? 'bold' : 'normal');
                
                const splitText = pdf.splitTextToSize(text || 'N/A', usableWidth);
                pdf.text(splitText, isTitle ? pageWidth / 2 : margin, y, { align: isTitle ? 'center' : 'left' });
                
                y += (splitText.length * fontSize * 1.2) + spaceAfter;
            };
    
            addText(`Detalhes do Requisito: ${requirement.id}`, { fontSize: 18, isBold: true, isTitle: true, spaceAfter: 20 });
    
            const fields: { label: string, value: keyof Requirement }[] = [
                { label: "Texto do Requisito", value: "requirementText" },
                { label: "Descrição Detalhada", value: "detailedDescription" },
                { label: "Área", value: "area" },
                { label: "Prioridade", value: "priority" },
                { label: "Status", value: "status" },
                { label: "Evidência Textual", value: "textualEvidence" },
                { label: "Ação Necessária", value: "necessaryAction" },
                { label: "Proposta de Serviço de Consultoria", value: "serviceProposal" },
                { label: "Prazo Estimado", value: "estimatedDeadline" },
                { label: "Responsável", value: "responsible" },
                { label: "Riscos de Não Conformidade", value: "nonComplianceRisks" },
            ];

            fields.forEach(field => {
                addText(field.label, { isBold: true, fontSize: 12, spaceAfter: 2 });
                addText(String(editedReq[field.value] || ''), { spaceAfter: 15 });
            });
    
            pdf.save(`Requisito-${requirement.id}.pdf`);
    
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF.");
        } finally {
            setIsSavingPdf(false);
        }
    };
    
    const renderField = (label: string, name: keyof Requirement, value: any, type: 'text' | 'textarea' | 'select' = 'text', options?: string[]) => {
        const commonClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
        return (
            <div className="mb-4">
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                {type === 'textarea' ? (
                    <textarea id={name} name={name} value={value} onChange={handleChange} rows={3} className={commonClasses} />
                ) : type === 'select' ? (
                    <select id={name} name={name} value={value} onChange={handleChange} className={commonClasses}>
                        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input type="text" id={name} name={name} value={value} onChange={handleChange} className={commonClasses} disabled={name === 'id'} />
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">Detalhes do Requisito: {requirement.id}</h3>
                    <button
                        onClick={handleSavePdf}
                        disabled={isSavingPdf}
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Salvar como PDF"
                    >
                        <FileDownIcon className="w-4 h-4 mr-2" />
                        {isSavingPdf ? 'Salvando...' : 'PDF'}
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {renderField("Texto do Requisito", "requirementText", editedReq.requirementText, 'textarea')}
                    {renderField("Descrição Detalhada", "detailedDescription", editedReq.detailedDescription, 'textarea')}
                    {renderField("Área", "area", editedReq.area, 'select', Object.values(Area))}
                    {renderField("Prioridade", "priority", editedReq.priority, 'select', Object.values(Priority))}
                    {renderField("Status", "status", editedReq.status, 'select', Object.values(Status))}
                    {renderField("Evidência Textual", "textualEvidence", editedReq.textualEvidence, 'textarea')}
                    {renderField("Ação Necessária", "necessaryAction", editedReq.necessaryAction, 'textarea')}
                    {renderField("Proposta de Serviço de Consultoria", "serviceProposal", editedReq.serviceProposal || '', 'textarea')}
                    {renderField("Prazo Estimado", "estimatedDeadline", editedReq.estimatedDeadline || '')}
                    {renderField("Responsável", "responsible", editedReq.responsible)}
                    {renderField("Riscos de Não Conformidade", "nonComplianceRisks", editedReq.nonComplianceRisks, 'textarea')}
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-4">
                    <button onClick={onClose} type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
                        Cancelar
                    </button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};