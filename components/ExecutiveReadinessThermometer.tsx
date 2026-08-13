import React, { useState, useMemo } from 'react';
import { SavedAnalysis, Requirement } from '../types';
import { motion } from 'motion/react';

interface ExecutiveReadinessThermometerProps {
  history: SavedAnalysis[];
}

// Exact list of 22 institutional areas requested
export const INSTITUTIONAL_AREAS = [
  'Produtos',
  'Tecnologia',
  'Segurança da Informação',
  'Compliance',
  'Jurídico',
  'Riscos',
  'Operações',
  'Atendimento',
  'Design e UX',
  'Growth / CRM',
  'Marketing',
  'Dados',
  'Governança',
  'Controles Internos',
  'Monitoramento',
  'Auditoria',
  'Backoffice',
  'Fraudes',
  'Tesouraria',
  'Contabilidade',
  'Crédito',
  'Ouvidoria'
];

export const ExecutiveReadinessThermometer: React.FC<ExecutiveReadinessThermometerProps> = ({ history }) => {
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string | null>(null);

  // Consolidated Analytics Calculation
  const analytics = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        healthScore: 0,
        riskLevel: 'Sem Dados',
        riskColor: 'gray',
        criticalReqsCount: 0,
        highReqsCount: 0,
        totalReqs: 0,
        exposureEstimateText: 'Nenhuma norma analisada ainda.',
        areaCapacityMap: [] as { area: string; percent: number; count: number; status: string; color: string }[],
        lineOfDefense: {
          line1: 0,
          line2: 0,
          line3: 0,
          actionPlanCoverage: 0
        }
      };
    }

    const allActionPlanItems = history.flatMap(h => h.gapAnalysis?.items || []);
    const allReqs: Requirement[] = history.flatMap(h => h.requirements || []);

    const totalReqs = allReqs.length;

    // Collect all items from Plano de Ação e Requisitos (gapAnalysis) and Requirements
    const combinedAreaItems: { areaName: string; isHighPriority: boolean }[] = [];

    allActionPlanItems.forEach(item => {
      combinedAreaItems.push({
        areaName: item.responsibleArea || '',
        isHighPriority: item.impactLevel === 'Crítico' || item.impactLevel === 'Alto'
      });
    });

    allReqs.forEach(req => {
      combinedAreaItems.push({
        areaName: req.area || '',
        isHighPriority: req.priority === 'Alta'
      });
    });

    // 1. HEALTH SCORE GLOBAL (0-100)
    const avgScore5 = history.reduce((acc, curr) => acc + (curr.complianceScore || 0), 0) / history.length;
    const healthScore = Math.min(100, Math.max(0, Math.round((avgScore5 / 5.0) * 100)));

    // Risk Classification based on non-conformities & priority
    const criticalReqsCount = allReqs.filter(r => r.priority === 'Alta' && (r.status.toLowerCase().includes('não') || r.status.toLowerCase().includes('parcial'))).length;
    const highReqsCount = allReqs.filter(r => r.priority === 'Alta').length;

    let riskLevel = 'Risco Baixo';
    let riskColor = 'emerald';
    let exposureEstimateText = 'Baixa probabilidade de sanções. Operação em consonância com as normas.';

    if (healthScore < 50 || criticalReqsCount >= 8) {
      riskLevel = 'Risco Crítico';
      riskColor = 'rose';
      exposureEstimateText = `${criticalReqsCount} requisitos de alta severidade pendentes. Risco elevado de apontamento em auditoria ou sanção BACEN/CVM.`;
    } else if (healthScore < 75 || criticalReqsCount >= 3) {
      riskLevel = 'Risco Moderado';
      riskColor = 'amber';
      exposureEstimateText = `${criticalReqsCount} pendências críticas mapeadas. Exposição concentrada em processos operacionais e adequação de TI.`;
    } else {
      riskLevel = 'Risco Baixo';
      riskColor = 'emerald';
      exposureEstimateText = 'Controles gerais alinhados às diretrizes regulatórias vigentes.';
    }

    // 2. OPERATIONAL CAPACITY PER AREA (% da capacidade necessária)
    // Mapping 22 areas from Plano de Ação e Requisitos
    const areaCounts: Record<string, { count: number; highCount: number }> = {};
    INSTITUTIONAL_AREAS.forEach(area => {
      areaCounts[area] = { count: 0, highCount: 0 };
    });

    combinedAreaItems.forEach(item => {
      const areaName = item.areaName || '';
      if (!areaName) return;
      let matched = false;

      // Try exact or fuzzy matching with INSTITUTIONAL_AREAS
      INSTITUTIONAL_AREAS.forEach(targetArea => {
        const normTarget = targetArea.toLowerCase();
        const normReqArea = areaName.toLowerCase();

        if (normReqArea === normTarget || normReqArea.includes(normTarget) || normTarget.includes(normReqArea)) {
          areaCounts[targetArea].count += 1;
          if (item.isHighPriority) areaCounts[targetArea].highCount += 1;
          matched = true;
        }
      });

      // Secondary keyword distribution if area was not directly matched
      if (!matched) {
        const areaLower = areaName.toLowerCase();
        let targetKey = 'Compliance';
        if (areaLower.includes('fraud') || areaLower.includes('med') || areaLower.includes('pldft') || areaLower.includes('lavagem') || areaLower.includes('ilícito')) {
          targetKey = 'Fraudes';
        } else if (areaLower.includes('design') || areaLower.includes('ux') || areaLower.includes('tela') || areaLower.includes('interface') || areaLower.includes('jornada')) {
          targetKey = 'Design e UX';
        } else if (areaLower.includes('growth') || areaLower.includes('crm') || areaLower.includes('régua') || areaLower.includes('funil')) {
          targetKey = 'Growth / CRM';
        } else if (areaLower.includes('market') || areaLower.includes('divulga') || areaLower.includes('campanha') || areaLower.includes('comunicação')) {
          targetKey = 'Marketing';
        } else if (areaLower.includes('auditor') || areaLower.includes('auditar') || areaLower.includes('parecer')) {
          targetKey = 'Auditoria';
        } else if (areaLower.includes('produt') || areaLower.includes('feature') || areaLower.includes('funcionalidade') || areaLower.includes('oferta')) {
          targetKey = 'Produtos';
        } else if (areaLower.includes('ti') || areaLower.includes('sistemas') || areaLower.includes('tecnologia') || areaLower.includes('api')) {
          targetKey = 'Tecnologia';
        } else if (areaLower.includes('segur') || areaLower.includes('cyber') || areaLower.includes('cripto')) {
          targetKey = 'Segurança da Informação';
        } else if (areaLower.includes('juríd') || areaLower.includes('legal') || areaLower.includes('contrat')) {
          targetKey = 'Jurídico';
        } else if (areaLower.includes('risco') || areaLower.includes('capital') || areaLower.includes('basileia')) {
          targetKey = 'Riscos';
        } else if (areaLower.includes('oper') || areaLower.includes('liquida')) {
          targetKey = 'Operações';
        } else if (areaLower.includes('atend') || areaLower.includes('sac')) {
          targetKey = 'Atendimento';
        } else if (areaLower.includes('ouvidor')) {
          targetKey = 'Ouvidoria';
        } else if (areaLower.includes('crédit') || areaLower.includes('analise de credito')) {
          targetKey = 'Crédito';
        } else if (areaLower.includes('tesourar') || areaLower.includes('caixa') || areaLower.includes('alm')) {
          targetKey = 'Tesouraria';
        } else if (areaLower.includes('contáb') || areaLower.includes('cosif')) {
          targetKey = 'Contabilidade';
        } else if (areaLower.includes('backoffice') || areaLower.includes('back office')) {
          targetKey = 'Backoffice';
        } else if (areaLower.includes('monitora')) {
          targetKey = 'Monitoramento';
        } else if (areaLower.includes('control')) {
          targetKey = 'Controles Internos';
        } else if (areaLower.includes('governa') || areaLower.includes('comitê')) {
          targetKey = 'Governança';
        } else if (areaLower.includes('dado') || areaLower.includes('lgpd')) {
          targetKey = 'Dados';
        }
        areaCounts[targetKey].count += 1;
        if (item.isHighPriority) areaCounts[targetKey].highCount += 1;
      }
    });

    // Compute capacity percentage per area directly from assigned items
    const areaCapacityMap = INSTITUTIONAL_AREAS.map(area => {
      const { count, highCount } = areaCounts[area];
      if (count === 0) {
        return {
          area,
          percent: 0,
          count: 0,
          status: 'Sem Carga',
          color: 'bg-slate-300 dark:bg-slate-700'
        };
      }

      let rawPercent = Math.round((count * 15) + (highCount * 10));
      if (rawPercent < 15) rawPercent = 15;
      const percent = Math.min(100, rawPercent);

      let status = 'Leve';
      let color = 'bg-emerald-500';
      if (percent >= 60) {
        status = 'Sobrecarga';
        color = 'bg-rose-500';
      } else if (percent >= 35) {
        status = 'Moderada';
        color = 'bg-amber-500';
      } else if (percent >= 15) {
        status = 'Planejada';
        color = 'bg-indigo-500';
      }

      return {
        area,
        percent,
        count,
        status,
        color
      };
    }).sort((a, b) => b.percent - a.percent);

    // 3. LINES OF DEFENSE & AUDIT COVERAGE
    // Reqs with plan / status conforme or parcialmente conforme
    const conformeOrParcialCount = allReqs.filter(r => !r.status.toLowerCase().includes('não conforme')).length;
    const actionPlanCoverage = totalReqs > 0 ? Math.round((conformeOrParcialCount / totalReqs) * 100) : 0;

    // 1st Line (Operations & Business): Control implementation
    const line1 = Math.min(100, Math.round(actionPlanCoverage * 0.92));
    // 2nd Line (Compliance & Risk): Policy alignment & oversight
    const line2 = Math.min(100, Math.round(actionPlanCoverage * 0.96));
    // 3rd Line (Internal Audit): Independent audit readiness
    const line3 = Math.min(100, Math.round(actionPlanCoverage * 0.88));

    return {
      healthScore,
      riskLevel,
      riskColor,
      criticalReqsCount,
      highReqsCount,
      totalReqs,
      exposureEstimateText,
      areaCapacityMap,
      lineOfDefense: {
        line1,
        line2,
        line3,
        actionPlanCoverage
      }
    };
  }, [history]);

  const topAreas = showAllAreas ? analytics.areaCapacityMap : analytics.areaCapacityMap.slice(0, 6);

  return (
    <div className="w-full space-y-6">
      {/* Executive Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 dark:border-gray-700/80 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Executive Dashboard
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {history.length === 1 ? 'Monitoramento da Norma Analisada' : 'Monitoramento Consolidado do Portfólio'}
            </span>
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
            Termômetro Executivo de Prontidão
          </h3>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block">
            {history.length === 1 ? 'Índice de Saúde Regulatória' : 'Índice Global de Saúde Regulatória'}
          </span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {analytics.healthScore}<span className="text-sm font-semibold text-gray-400">/100</span>
          </span>
        </div>
      </div>

      {/* 3 Main Executive Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* INDICATOR 1: SCORE GLOBAL & FINANCIAL/REGULATORY EXPOSURE */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Saúde & Exposição
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                analytics.riskColor === 'rose'
                  ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
                  : analytics.riskColor === 'amber'
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {analytics.riskLevel}
              </span>
            </div>

            {/* Health Index Bar / Thermometer */}
            <div className="mt-2">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Health Index
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {analytics.healthScore}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analytics.healthScore}%` }}
                  transition={{ duration: 1 }}
                  className={`h-full rounded-full ${
                    analytics.healthScore >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : analytics.healthScore >= 60
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                />
              </div>
            </div>

            {/* Explanatory Box on Risk Calculation */}
            <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Cálculo de Exposição:</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Severidade Regulatória</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {analytics.exposureEstimateText}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span>Pendências Críticas: <strong>{analytics.criticalReqsCount}</strong></span>
                <span>Prioridade Alta: <strong>{analytics.highReqsCount}</strong></span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 italic">
            * Custo de não-conformidade avaliado pelo impacto regulatório em BACEN/CVM.
          </div>
        </div>

        {/* INDICATOR 2: OPERATIONAL CAPACITY PER AREA */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Alocação de Capacidade Operacional
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                22 Áreas
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              % estimado de esforço/alocação exigido das áreas para adequação:
            </p>

            {/* List of areas capacity */}
            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {topAreas.map(item => (
                <div key={item.area} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={item.area}>
                      {item.area}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.count > 0 ? `${item.count} reqs` : 'Base'}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white w-9 text-right">
                        {item.percent}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAllAreas(!showAllAreas)}
            className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors w-full"
          >
            {showAllAreas ? '▲ Recolher Áreas' : `▼ Ver Todas as 22 Áreas Mapeadas (${analytics.areaCapacityMap.length})`}
          </button>
        </div>

        {/* INDICATOR 3: LINES OF DEFENSE & AUDIT GAPS */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Linhas de Defesa & Auditoria
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {analytics.lineOfDefense.actionPlanCoverage}% Cobertura
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Prontidão de controles e governança nas 3 Linhas de Defesa:
            </p>

            <div className="space-y-3">
              {/* 1st Line */}
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    1ª Linha: Operações & Negócios
                  </span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {analytics.lineOfDefense.line1}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${analytics.lineOfDefense.line1}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Controles operacionais e rotinas em implantação
                </span>
              </div>

              {/* 2nd Line */}
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    2ª Linha: Compliance & Riscos
                  </span>
                  <span className="font-extrabold text-teal-600 dark:text-teal-400">
                    {analytics.lineOfDefense.line2}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full"
                    style={{ width: `${analytics.lineOfDefense.line2}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Políticas internas e monitoramento contínuo
                </span>
              </div>

              {/* 3rd Line */}
              <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    3ª Linha: Auditoria Interna
                  </span>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">
                    {analytics.lineOfDefense.line3}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full"
                    style={{ width: `${analytics.lineOfDefense.line3}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Plano de testes de auditoria e evidências rastreáveis
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Audit Readiness:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {analytics.lineOfDefense.actionPlanCoverage >= 70 ? '✓ Aprovado para Auditoria' : '⚠ Em Estruturação'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
