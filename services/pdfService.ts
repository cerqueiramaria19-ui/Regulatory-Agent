import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { SavedAnalysis, Requirement, Area, Priority, Status } from '../types';

// BIP Consulting Colors
const COLOR_PRIMARY = [230, 0, 26]; // #E6001A (BIP Red)
const COLOR_SECONDARY = [31, 41, 55]; // #1F2937 (Slate Gray)
const COLOR_TEXT = [55, 65, 81]; // #374151 (Dark Gray)
const COLOR_MUTED = [107, 114, 128]; // #6B7280 (Gray)
const COLOR_BG_LIGHT = [249, 250, 251]; // #F9FAFB (Off-white)

export const generateAnalysisPDF = async (
    analysis: SavedAnalysis,
    chartsContainerId?: string
): Promise<void> => {
    // Create an instance of jsPDF (A4, portrait, millimeters)
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageHeight = 297; // A4 standard height in mm
    const pageWidth = 210; // A4 standard width in mm
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let currentPage = 1;

    // Helper: Draw Header & Footer
    const drawHeaderFooter = (docInstance: jsPDF, pageNum: number, docTitle: string) => {
        if (pageNum === 1) return; // Skip cover page

        // Header
        docInstance.setFont('Helvetica', 'bold');
        docInstance.setFontSize(8);
        docInstance.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        docInstance.text('BIP CONSULTING', margin, 12);

        docInstance.setFont('Helvetica', 'normal');
        docInstance.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        // Truncate file name if too long for header
        const headerTitle = docTitle.length > 50 ? docTitle.substring(0, 47) + '...' : docTitle;
        docInstance.text(headerTitle, margin + 30, 12);

        // Thin red line
        docInstance.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        docInstance.setLineWidth(0.4);
        docInstance.line(margin, 14, pageWidth - margin, 14);

        // Footer
        docInstance.setDrawColor(229, 231, 235); // Light gray line
        docInstance.setLineWidth(0.2);
        docInstance.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        docInstance.setFontSize(7);
        docInstance.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        docInstance.text('Análise Regulatória Inteligente - BIP Brasil', margin, pageHeight - 8);
        docInstance.text(`Página ${pageNum}`, pageWidth - margin - 15, pageHeight - 8);
    };

    // Helper: Check for new page
    const checkPageBreak = (currentY: number, neededHeight: number): number => {
        if (currentY + neededHeight > pageHeight - 20) {
            doc.addPage();
            currentPage++;
            drawHeaderFooter(doc, currentPage, analysis.fileName);
            return 25; // Return new Y coordinate after header
        }
        return currentY;
    };

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    
    // Draw background graphic accents
    doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.rect(0, 0, 15, pageHeight, 'F'); // Left sidebar bar

    doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.rect(15, 0, 3, pageHeight, 'F'); // Inner thin red bar

    // Logo / Brand
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text('BIP CONSULTING', 30, 35);

    // Main Title
    doc.setFontSize(26);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    
    const titleLines = doc.splitTextToSize('DIAGNÓSTICO E PLANO DE ADEQUAÇÃO REGULATÓRIA', contentWidth - 15);
    let titleY = 70;
    titleLines.forEach((line: string) => {
        doc.text(line, 30, titleY);
        titleY += 11;
    });

    // Subtitle
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('Análise de Impacto Operacional e Prontidão de Conformidade', 30, titleY + 4);

    // Decorative line
    doc.setDrawColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.setLineWidth(1.5);
    doc.line(30, titleY + 14, 100, titleY + 14);

    // Meta details section (Bottom half)
    let metaY = 180;
    doc.setFillColor(243, 244, 246); // Light grey card bg
    doc.roundedRect(30, metaY, contentWidth - 10, 50, 3, 3, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.text('INFORMAÇÕES GERAIS', 35, metaY + 8);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);

    // Metadata lines
    doc.setFont('Helvetica', 'bold');
    doc.text('Documento:', 35, metaY + 16);
    doc.setFont('Helvetica', 'normal');
    const displayFilename = analysis.fileName.length > 55 ? analysis.fileName.substring(0, 52) + '...' : analysis.fileName;
    doc.text(displayFilename, 60, metaY + 16);

    doc.setFont('Helvetica', 'bold');
    doc.text('Análise Efetuada:', 35, metaY + 23);
    doc.setFont('Helvetica', 'normal');
    doc.text(analysis.analyzedAt, 65, metaY + 23);

    doc.setFont('Helvetica', 'bold');
    doc.text('Compliance Score:', 35, metaY + 30);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${analysis.complianceScore.toFixed(1)} / 5.0`, 68, metaY + 30);

    doc.setFont('Helvetica', 'bold');
    doc.text('Requisitos Identificados:', 35, metaY + 37);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${analysis.requirements.length} pontos de atenção mapeados`, 78, metaY + 37);

    // Notice at footer
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('© BIP Consulting. Todos os direitos reservados.', 30, pageHeight - 15);
    doc.text('Este documento contém propriedade intelectual e informações operacionais críticas.', 30, pageHeight - 11);

    // ==========================================
    // PAGE 2: VISÃO GERAL & RESUMO EXECUTIVO
    // ==========================================
    doc.addPage();
    currentPage++;
    drawHeaderFooter(doc, currentPage, analysis.fileName);

    let currentY = 25;

    // Title Section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.text('1. RESUMO EXECUTIVO', margin, currentY);
    currentY += 8;

    // Executive Summary Paragraph
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
    
    const summaryLines = doc.splitTextToSize(analysis.summary, contentWidth);
    summaryLines.forEach((line: string) => {
        currentY = checkPageBreak(currentY, 6);
        doc.text(line, margin, currentY);
        currentY += 5.5;
    });

    currentY += 8;

    // KPI Cards Block (Simulated prints of indicators)
    currentY = checkPageBreak(currentY, 40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.text('KPIs de Prontidão Regulatória', margin, currentY);
    currentY += 6;

    // Draw 3 horizontal KPI boxes
    const kpiWidth = (contentWidth - 8) / 3;
    
    // Card 1: Score
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, currentY, kpiWidth, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('SCORE GLOBAL', margin + 4, currentY + 6);
    doc.setFontSize(14);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(`${analysis.complianceScore.toFixed(1)} / 5.0`, margin + 4, currentY + 15);

    // Card 2: Requirements Count
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin + kpiWidth + 4, currentY, kpiWidth, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('PONTOS DE ATENÇÃO', margin + kpiWidth + 8, currentY + 6);
    doc.setFontSize(14);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.text(`${analysis.requirements.length}`, margin + kpiWidth + 8, currentY + 15);

    // Card 3: High priority proportion
    const highPriorityCount = analysis.requirements.filter(r => r.priority === Priority.HIGH).length;
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin + (kpiWidth * 2) + 8, currentY, kpiWidth, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('RISCO ALTO (SLA CRÍTICO)', margin + (kpiWidth * 2) + 12, currentY + 6);
    doc.setFontSize(14);
    doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
    doc.text(`${highPriorityCount} itens`, margin + (kpiWidth * 2) + 12, currentY + 15);

    currentY += 32;

    // Discrepancy report if any
    if (analysis.discrepancies && analysis.discrepancies.length > 0) {
        currentY = checkPageBreak(currentY, 40);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.text('Sinalizações de Consistência e Conflitos Normativos', margin, currentY);
        currentY += 6;

        analysis.discrepancies.slice(0, 3).forEach((disc) => {
            currentY = checkPageBreak(currentY, 18);
            
            // Left border indicator based on severity
            doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
            doc.rect(margin, currentY, 1.5, 12, 'F');

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
            const shortDesc = disc.description.length > 80 ? disc.description.substring(0, 77) + '...' : disc.description;
            doc.text(shortDesc, margin + 4, currentY + 4);

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            const shortSug = disc.suggestion.length > 90 ? disc.suggestion.substring(0, 87) + '...' : disc.suggestion;
            doc.text(`Recomendação BIP: ${shortSug}`, margin + 4, currentY + 9);

            currentY += 15;
        });
    }

    // ==========================================
    // PAGE 3: CHARTS / SNAPSHOTS
    // ==========================================
    doc.addPage();
    currentPage++;
    drawHeaderFooter(doc, currentPage, analysis.fileName);
    currentY = 25;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.text('2. ANÁLISE GRÁFICA DA DISTRIBUIÇÃO', margin, currentY);
    currentY += 10;

    let chartCaptured = false;

    if (chartsContainerId) {
        try {
            const chartElement = document.getElementById(chartsContainerId);
            if (chartElement) {
                // Temporarily force light theme backgrounds or settings on chart capture if needed,
                // but usually the charts look stunning already.
                const canvas = await html2canvas(chartElement, {
                    scale: 2, // high quality
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                // Calculate size to fit beautifully
                const originalWidth = canvas.width;
                const originalHeight = canvas.height;
                const ratio = originalHeight / originalWidth;
                
                const displayWidth = contentWidth;
                const displayHeight = displayWidth * ratio;

                // Add to document
                currentY = checkPageBreak(currentY, displayHeight + 10);
                doc.addImage(imgData, 'JPEG', margin, currentY, displayWidth, displayHeight);
                currentY += displayHeight + 12;
                chartCaptured = true;
            }
        } catch (err) {
            console.error('Failed to capture dashboard charts via html2canvas:', err);
        }
    }

    // Fallback or addition: Draw beautiful custom text representations of charts if html2canvas failed or as standard context
    if (!chartCaptured) {
        currentY = checkPageBreak(currentY, 60);
        // Draw elegant manual report of distributions
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.text('Distribuição dos Requisitos de Conformidade', margin, currentY);
        currentY += 8;

        // Group data
        const areas = Object.values(Area);
        const priorities = Object.values(Priority);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('POR ÁREA DE NEGÓCIO', margin, currentY);
        doc.text('POR PRIORIDADE DE IMPLEMENTAÇÃO', margin + contentWidth / 2, currentY);
        currentY += 6;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        
        const maxLength = Math.max(areas.length, priorities.length);
        for (let i = 0; i < maxLength; i++) {
            currentY = checkPageBreak(currentY, 8);
            
            if (i < areas.length) {
                const areaName = areas[i];
                const count = analysis.requirements.filter(r => r.area === areaName).length;
                doc.text(`• ${areaName}: ${count} requisitos`, margin + 2, currentY);
            }

            if (i < priorities.length) {
                const prioName = priorities[i];
                const count = analysis.requirements.filter(r => r.priority === prioName).length;
                doc.text(`• Prioridade ${prioName}: ${count} requisitos`, margin + contentWidth / 2 + 2, currentY);
            }
            
            currentY += 6;
        }
        currentY += 10;
    } else {
        // Charts caption
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
        doc.text('Gráficos de dispersão normativa gerados automaticamente a partir do painel de controle.', margin, currentY - 8);
    }

    // Add strategic heatmap scores overview if they exist
    if (analysis.bipServiceScores) {
        currentY = checkPageBreak(currentY, 45);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.text('Aderência Estratégica ao Portfólio de Serviços BIP', margin, currentY);
        currentY += 6;

        const services = [
            { id: 'S1', name: 'Estratégia e Transformação Digital' },
            { id: 'S2', name: 'Adequação Regulatória e Evolução do Ecossistema' },
            { id: 'S3', name: 'Infraestrutura e Capacidades Digitais' },
            { id: 'S4', name: 'Eficiência Operacional e Inteligência' }
        ];

        services.forEach((srv) => {
            currentY = checkPageBreak(currentY, 8);
            const score = analysis.bipServiceScores[srv.id] || 0;
            
            // Draw progress bar background
            doc.setFillColor(229, 231, 235);
            doc.roundedRect(margin + 90, currentY - 3, 60, 4, 1, 1, 'F');
            
            // Draw actual progress
            if (score > 0) {
                doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
                doc.roundedRect(margin + 90, currentY - 3, (score / 100) * 60, 4, 1, 1, 'F');
            }

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            doc.text(srv.name, margin, currentY);
            
            doc.setFont('Helvetica', 'bold');
            doc.text(`${score}%`, margin + 155, currentY);
            
            currentY += 7;
        });
    }

    // ==========================================
    // PAGE 4+: PLANO DE AÇÃO DETALHADO (TABLE)
    // ==========================================
    doc.addPage();
    currentPage++;
    drawHeaderFooter(doc, currentPage, analysis.fileName);
    currentY = 25;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
    doc.text('3. DETALHAMENTO DO PLANO DE AÇÃO', margin, currentY);
    currentY += 8;

    // Draw table headers
    const drawTableHeaders = (y: number) => {
        doc.setFillColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.rect(margin, y, contentWidth, 8, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        
        doc.text('ID', margin + 2, y + 5);
        doc.text('Requisito Regulatório', margin + 12, y + 5);
        doc.text('Área', margin + 85, y + 5);
        doc.text('Prio', margin + 110, y + 5);
        doc.text('Ação Recomendada (BIP Brasil)', margin + 125, y + 5);
    };

    currentY = checkPageBreak(currentY, 15);
    drawTableHeaders(currentY);
    currentY += 8;

    // Loop through requirements and write them
    for (let i = 0; i < analysis.requirements.length; i++) {
        const req = analysis.requirements[i];
        
        // Split text for columns to handle wrapping
        const reqLines = doc.splitTextToSize(req.requirementText, 70);
        const actionLines = doc.splitTextToSize(req.necessaryAction, 45);
        
        const maxLines = Math.max(reqLines.length, actionLines.length);
        const rowHeight = Math.max(10, maxLines * 4.5 + 4);

        // Check page break before rendering row
        const nextY = checkPageBreak(currentY, rowHeight);
        if (nextY === 25) {
            // New page triggered, redraw headers
            drawTableHeaders(25);
            currentY = 33;
        }

        // Alternating background colors
        if (i % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
        }

        // Row thin bottom border
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.1);
        doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

        // Print values
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text(req.id, margin + 2, currentY + 5);

        // Requisito text (multiple lines)
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        let textY = currentY + 5;
        reqLines.forEach((line: string) => {
            doc.text(line, margin + 12, textY);
            textY += 4.2;
        });

        // Area
        doc.text(req.area, margin + 85, currentY + 5);

        // Priority
        if (req.priority === Priority.HIGH) {
            doc.setFont('Helvetica', 'bold');
            doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        } else {
            doc.setFont('Helvetica', 'normal');
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        }
        doc.text(req.priority, margin + 110, currentY + 5);

        // Necessary action text
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        let actionY = currentY + 5;
        actionLines.forEach((line: string) => {
            doc.text(line, margin + 125, actionY);
            actionY += 4.2;
        });

        currentY += rowHeight;
    }

    // ==========================================
    // PAGE 5+: ADICIONAIS - VALUE PROPOSITION (IF EXISTS)
    // ==========================================
    if (analysis.valueProposition) {
        doc.addPage();
        currentPage++;
        drawHeaderFooter(doc, currentPage, analysis.fileName);
        currentY = 25;

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.text('4. PROPOSTA DE VALOR & POSICIONAMENTO', margin, currentY);
        currentY += 8;

        const prop = analysis.valueProposition;

        // Executive Summary of value proposition
        currentY = checkPageBreak(currentY, 20);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        doc.text('Sumário Executivo da Proposta', margin, currentY);
        currentY += 5;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        const propSumLines = doc.splitTextToSize(prop.executiveSummary, contentWidth);
        propSumLines.forEach((line: string) => {
            currentY = checkPageBreak(currentY, 6);
            doc.text(line, margin, currentY);
            currentY += 5;
        });
        currentY += 5;

        // Solution block
        currentY = checkPageBreak(currentY, 20);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.text('A Solução BIP Consulting Recomendada', margin, currentY);
        currentY += 5;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        const solutionLines = doc.splitTextToSize(prop.ourSolution, contentWidth);
        solutionLines.forEach((line: string) => {
            currentY = checkPageBreak(currentY, 6);
            doc.text(line, margin, currentY);
            currentY += 5;
        });
        currentY += 5;

        // Business Impacts
        currentY = checkPageBreak(currentY, 35);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Impactos e Alavancas Operacionais', margin, currentY);
        currentY += 5;

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Eficiência de Capital & Basileia:', margin, currentY);
        doc.setFont('Helvetica', 'normal');
        const capLines = doc.splitTextToSize(prop.businessImpact.capitalEfficiency, contentWidth - 45);
        let bulletY = currentY;
        capLines.forEach((line: string, idx: number) => {
            bulletY = checkPageBreak(bulletY, 5);
            doc.text(line, margin + 45, bulletY);
            bulletY += 4.5;
        });
        currentY = bulletY + 2;

        currentY = checkPageBreak(currentY, 15);
        doc.setFont('Helvetica', 'bold');
        doc.text('Resiliência Operacional:', margin, currentY);
        doc.setFont('Helvetica', 'normal');
        const resLines = doc.splitTextToSize(prop.businessImpact.operationalResilience, contentWidth - 45);
        bulletY = currentY;
        resLines.forEach((line: string) => {
            bulletY = checkPageBreak(bulletY, 5);
            doc.text(line, margin + 45, bulletY);
            bulletY += 4.5;
        });
        currentY = bulletY + 4;
    }

    // ==========================================
    // PAGE 6+: ADICIONAIS - REGULATORY CHECKLIST (IF EXISTS)
    // ==========================================
    if (analysis.regulatoryChecklist) {
        doc.addPage();
        currentPage++;
        drawHeaderFooter(doc, currentPage, analysis.fileName);
        currentY = 25;

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
        doc.text('5. CHECKLIST DE CONTROLES OPERACIONAIS', margin, currentY);
        currentY += 8;

        const check = analysis.regulatoryChecklist;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
        const checkDescLines = doc.splitTextToSize(check.description, contentWidth);
        checkDescLines.forEach((line: string) => {
            currentY = checkPageBreak(currentY, 6);
            doc.text(line, margin, currentY);
            currentY += 5;
        });
        currentY += 8;

        // Draw items
        check.items.forEach((item, index) => {
            currentY = checkPageBreak(currentY, 24);

            doc.setFillColor(249, 250, 251);
            doc.roundedRect(margin, currentY, contentWidth, 18, 1, 1, 'F');
            
            // Criticality bullet
            doc.setFillColor(item.isCritical ? COLOR_PRIMARY[0] : 245, item.isCritical ? COLOR_PRIMARY[1] : 158, item.isCritical ? COLOR_PRIMARY[2] : 11);
            doc.circle(margin + 5, currentY + 9, 2, 'F');

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(COLOR_SECONDARY[0], COLOR_SECONDARY[1], COLOR_SECONDARY[2]);
            doc.text(`${item.id}: ${item.requirement}`, margin + 10, currentY + 6);

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
            
            const shortDesc = item.description.length > 105 ? item.description.substring(0, 102) + '...' : item.description;
            doc.text(`Ação: ${shortDesc}`, margin + 10, currentY + 11);

            const shortImpact = item.impact.length > 105 ? item.impact.substring(0, 102) + '...' : item.impact;
            doc.text(`Impacto Operacional: ${shortImpact}`, margin + 10, currentY + 15);

            currentY += 21;
        });
    }

    // Save the PDF
    const safeFileName = analysis.fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`BIP_Relatorio_Regulatorio_${safeFileName}.pdf`);
};
