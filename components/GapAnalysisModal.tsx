import React, { useState } from 'react';
import { GapAnalysisData } from '../types';
import { ScaleIcon, CheckCircleIcon, AlertCircleIcon, FileDownIcon, ClipboardCopyIcon, RefreshCwIcon, SheetIcon } from './Icons';

interface GapAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegenerate: () => void;
    isLoading: boolean;
    data: GapAnalysisData | null;
    error: string | null;
    fileName: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">Realizando Análise de Gaps Regulatórios...</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Mapeando artigos, incisos, obrigações e plano detalhado de adequação.</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
        <AlertCircleIcon className="w-12 h-12 text-red-500 mb-3" />
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Falha ao Gerar Análise de Gaps</h3>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300 max-w-md">{message}</p>
    </div>
);

export const GapAnalysisModal: React.FC<GapAnalysisModalProps> = ({
    isOpen,
    onClose,
    onRegenerate,
    isLoading,
    data,
    error,
    fileName
}) => {
    const [selectedStatus, setSelectedStatus] = useState<Record<string, 'Pendente' | 'Em Adequação' | 'Adequado'>>({});
    const [filterImpact, setFilterImpact] = useState<string>('TODOS');
    const [filterArea, setFilterArea] = useState<string>('TODAS');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!isOpen) return null;

    const handleStatusChange = (id: string, status: 'Pendente' | 'Em Adequação' | 'Adequado') => {
        setSelectedStatus(prev => ({ ...prev, [id]: status }));
    };

    const handleCopyText = () => {
        if (!data) return;
        let text = `ANÁLISE DE GAPS E ADEQUAÇÃO REGULATÓRIA\n`;
        text += `Documento Analisado: ${fileName}\n\n`;
        text += `${data.description}\n\n`;
        text += `---------------------------------------------------------\n`;

        data.items.forEach(item => {
            const currentStatus = selectedStatus[item.id] || 'Pendente';
            text += `[${currentStatus.toUpperCase()}] REF: ${item.regulatoryReference}\n`;
            text += `Área: ${item.responsibleArea} | Impacto: ${item.impactLevel} | Prazo: ${item.estimatedEffort}\n`;
            text += `Obrigação / Exigência: ${item.obligationSummary}\n`;
            text += `Detalhamento de Adequação: ${item.detailedActionPlan}\n`;
            text += `---------------------------------------------------------\n\n`;
        });

        navigator.clipboard.writeText(text);
        alert('Análise de Gaps copiada para a área de transferência!');
    };

    const handleExportPdf = async () => {
        const { jsPDF } = (window as any).jspdf;
        if (!data || !jsPDF) return;

        setIsGeneratingPdf(true);
        try {
            const pdf = new jsPDF();
            const margin = 15;
            let y = margin;

            // Header
            pdf.setFontSize(16).setTextColor(230, 0, 26).setFont('helvetica', 'bold');
            pdf.text('BIP CONSULTING - ANÁLISE DE GAPS REGULATÓRIOS', margin, y);
            y += 8;

            pdf.setFontSize(10).setTextColor(75, 85, 99).setFont('helvetica', 'normal');
            pdf.text(`Documento Normativo: ${fileName}`, margin, y);
            y += 12;

            pdf.setDrawColor(230, 0, 26).setLineWidth(0.8);
            pdf.line(margin, y, 195, y);
            y += 8;

            // Overview
            pdf.setFontSize(11).setFont('helvetica', 'bold').setTextColor(31, 41, 55);
            pdf.text(data.title || 'Mapeamento de Gaps de Adequação', margin, y);
            y += 6;

            pdf.setFontSize(9).setFont('helvetica', 'normal').setTextColor(55, 65, 81);
            const descLines = pdf.splitTextToSize(data.description, 180);
            pdf.text(descLines, margin, y);
            y += descLines.length * 4.5 + 8;

            // Loop Items
            data.items.forEach((item) => {
                if (y > 260) {
                    pdf.addPage();
                    y = margin;
                }

                // Card background
                pdf.setFillColor(248, 250, 252);
                pdf.roundedRect(margin, y, 180, 4, 1, 1, 'F');

                pdf.setFontSize(9.5).setFont('helvetica', 'bold').setTextColor(230, 0, 26);
                pdf.text(`Ref: ${item.regulatoryReference}`, margin + 2, y + 3);

                pdf.setFontSize(8.5).setFont('helvetica', 'bold').setTextColor(31, 41, 55);
                pdf.text(`Área: ${item.responsibleArea} | Impacto: ${item.impactLevel} | Prazo: ${item.estimatedEffort}`, margin + 65, y + 3);
                y += 7;

                pdf.setFontSize(9).setFont('helvetica', 'bold').setTextColor(17, 24, 39);
                pdf.text('Resumo da Obrigação:', margin, y);
                y += 4;

                pdf.setFontSize(8.5).setFont('helvetica', 'normal').setTextColor(55, 65, 81);
                const obLines = pdf.splitTextToSize(item.obligationSummary, 180);
                pdf.text(obLines, margin, y);
                y += obLines.length * 4 + 3;

                pdf.setFontSize(9).setFont('helvetica', 'bold').setTextColor(17, 24, 39);
                pdf.text('Plano de Adequação e Ações Práticas:', margin, y);
                y += 4;

                pdf.setFontSize(8.5).setFont('helvetica', 'normal').setTextColor(55, 65, 81);
                const actLines = pdf.splitTextToSize(item.detailedActionPlan, 180);
                pdf.text(actLines, margin, y);
                y += actLines.length * 4 + 8;

                pdf.setDrawColor(229, 231, 235).setLineWidth(0.2);
                pdf.line(margin, y - 4, 195, y - 4);
            });

            pdf.save(`Gap-Analysis-${fileName.replace(/[^a-z0-9]/gi, '_')}.pdf`);
        } catch (err) {
            console.error(err);
            alert('Erro ao gerar PDF da análise de gaps.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleExportExcel = () => {
        if (!data || !data.items || data.items.length === 0) return;

        const headers = [
            "ID",
            "Referência Regulatória",
            "Resumo da Obrigação / Exigência",
            "Detalhamento das Ações para Adequação",
            "Área Responsável",
            "Nível de Impacto",
            "Prazo / Esforço Estimado",
            "Status de Adequação"
        ];

        const escapeCsvValue = (value: any): string => {
            const stringValue = String(value ?? '');
            if (/[";\n\r]/.test(stringValue)) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        };

        const dataRows = data.items.map(item => [
            item.id,
            item.regulatoryReference,
            item.obligationSummary,
            item.detailedActionPlan,
            item.responsibleArea,
            item.impactLevel,
            item.estimatedEffort,
            selectedStatus[item.id] || 'Pendente'
        ]);

        const csvContent = [
            headers.join(';'),
            ...dataRows.map(row => row.map(escapeCsvValue).join(';'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const safeFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute('download', `Gap_Analysis_${safeFileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Filter logic
    const filteredItems = data ? data.items.filter(item => {
        const matchesImpact = filterImpact === 'TODOS' || item.impactLevel.toUpperCase() === filterImpact.toUpperCase();
        const matchesArea = filterArea === 'TODAS' || item.responsibleArea.toLowerCase().includes(filterArea.toLowerCase());
        const matchesSearch = !searchQuery || 
            item.regulatoryReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.obligationSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.detailedActionPlan.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesImpact && matchesArea && matchesSearch;
    }) : [];

    const criticalCount = data ? data.items.filter(i => i.impactLevel === 'Crítico' || i.impactLevel === 'Alto').length : 0;
    const areasList = Array.from(new Set(data?.items.map(i => i.responsibleArea) || []));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Modal Header */}
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <ScaleIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Gap Analysis & Adequação Regulatória
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Referências normativas, obrigações e plano de ação detalhado para: <span className="font-semibold text-gray-700 dark:text-gray-300">{fileName}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {!isLoading && data && (
                            <>
                                <button
                                    onClick={handleCopyText}
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    title="Copiar texto para transferência"
                                >
                                    <ClipboardCopyIcon className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                    Copiar Texto
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-emerald-200 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                                    title="Exportar planilha Excel (CSV) com todos os gaps e plano de adequação"
                                >
                                    <SheetIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Exportar Excel
                                </button>
                                <button
                                    onClick={handleExportPdf}
                                    disabled={isGeneratingPdf}
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-indigo-200 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                                    title="Exportar documento PDF do Gap Analysis"
                                >
                                    <FileDownIcon className="w-3.5 h-3.5 mr-1.5" />
                                    {isGeneratingPdf ? 'Gerando...' : 'Exportar PDF'}
                                </button>
                                <button
                                    onClick={onRegenerate}
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 border border-amber-200 transition-colors"
                                    title="Regerar análise de gaps via IA"
                                >
                                    <RefreshCwIcon className="w-3.5 h-3.5 mr-1.5" />
                                    Regerar
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg text-lg font-bold ml-2"
                            aria-label="Fechar"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {isLoading && <LoadingSpinner />}
                    {error && <ErrorDisplay message={error} />}

                    {!isLoading && !error && data && (
                        <>
                            {/* Executive Card Banner */}
                            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl shadow-md border border-indigo-900/50">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-2">
                                            Diagnóstico de Adequação Normativa
                                        </div>
                                        <h4 className="text-lg font-bold text-white">{data.title || "Diagnóstico de Gaps de Conformidade"}</h4>
                                        <p className="text-xs text-indigo-200 mt-1 max-w-3xl leading-relaxed">{data.description}</p>
                                    </div>
                                    <div className="flex gap-4 flex-shrink-0 bg-white/5 p-3 rounded-lg border border-white/10">
                                        <div className="text-center px-2">
                                            <span className="block text-2xl font-black text-white">{data.items.length}</span>
                                            <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">Gaps Totais</span>
                                        </div>
                                        <div className="w-px bg-white/10"></div>
                                        <div className="text-center px-2">
                                            <span className="block text-2xl font-black text-rose-400">{criticalCount}</span>
                                            <span className="text-[10px] text-rose-200 uppercase tracking-wider font-semibold">Alta/Crítica</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filters & Search Toolbar */}
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 flex-wrap flex-1">
                                    <input
                                        type="text"
                                        placeholder="Buscar por artigo, palavra-chave ou ação..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                                    />

                                    <select
                                        value={filterImpact}
                                        onChange={e => setFilterImpact(e.target.value)}
                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="TODOS">Todos os Impactos</option>
                                        <option value="CRÍTICO">Crítico</option>
                                        <option value="ALTO">Alto</option>
                                        <option value="MÉDIO">Médio</option>
                                        <option value="BAIXO">Baixo</option>
                                    </select>

                                    {areasList.length > 0 && (
                                        <select
                                            value={filterArea}
                                            onChange={e => setFilterArea(e.target.value)}
                                            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="TODAS">Todas as Áreas</option>
                                            {areasList.map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                                    Exibindo <strong className="text-gray-900 dark:text-white">{filteredItems.length}</strong> de {data.items.length} itens
                                </span>
                            </div>

                            {/* Gap Cards Items List */}
                            <div className="space-y-4">
                                {filteredItems.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                        Nenhum gap encontrado para os filtros selecionados.
                                    </div>
                                ) : (
                                    filteredItems.map((item, index) => {
                                        const currentStatus = selectedStatus[item.id] || 'Pendente';

                                        const getImpactBadge = (level: string) => {
                                            switch (level) {
                                                case 'Crítico':
                                                    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                                                case 'Alto':
                                                    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                                                case 'Médio':
                                                    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
                                                default:
                                                    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                                            }
                                        };

                                        const getStatusBadge = (status: string) => {
                                            switch (status) {
                                                case 'Adequado':
                                                    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300';
                                                case 'Em Adequação':
                                                    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300';
                                                default:
                                                    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300';
                                            }
                                        };

                                        return (
                                            <div
                                                key={item.id || index}
                                                className={`p-5 rounded-xl border transition-all shadow-sm ${
                                                    currentStatus === 'Adequado'
                                                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50'
                                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                                                }`}
                                            >
                                                {/* Item Header / Badges */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 pb-3 mb-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white shadow-sm">
                                                            <ScaleIcon className="w-3.5 h-3.5 mr-1.5 opacity-90" />
                                                            Ref. Regulatória: {item.regulatoryReference}
                                                        </span>

                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getImpactBadge(item.impactLevel)}`}>
                                                            Impacto: {item.impactLevel}
                                                        </span>

                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                            Área: {item.responsibleArea}
                                                        </span>

                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                            Horizontes: {item.estimatedEffort}
                                                        </span>
                                                    </div>

                                                    {/* Status Selector */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                                                        <select
                                                            value={currentStatus}
                                                            onChange={e => handleStatusChange(item.id, e.target.value as any)}
                                                            className={`text-xs font-semibold px-2.5 py-1 rounded-md border focus:outline-none transition-colors ${getStatusBadge(currentStatus)}`}
                                                        >
                                                            <option value="Pendente">🟡 Gap Pendente</option>
                                                            <option value="Em Adequação">🔵 Em Adequação</option>
                                                            <option value="Adequado">🟢 Concluído / Adequado</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Content Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                    {/* Section 1: Resumo da Obrigação */}
                                                    <div className="md:col-span-5 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                                                        <div>
                                                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 flex items-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                                                Resumo da Obrigação / Exigência
                                                            </h5>
                                                            <p className="text-xs text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                                                                {item.obligationSummary}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Section 2: Detalhamento do Plano de Ação */}
                                                    <div className="md:col-span-7 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 flex flex-col justify-between">
                                                        <div>
                                                            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1.5 flex items-center">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                                                                Detalhamento das Ações para Adequação
                                                            </h5>
                                                            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                                                {item.detailedActionPlan}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <div>
                        BIP Brasil • Consultoria de Adequação Regulatória para Instituições Financeiras
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};
