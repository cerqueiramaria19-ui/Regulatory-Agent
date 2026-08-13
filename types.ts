
export enum AppView {
  HISTORY = 'history',
  UPLOAD = 'upload',
  PROCESSING = 'processing',
  DASHBOARD = 'dashboard',
  ERROR = 'error',
  COMPARISON = 'comparison',
}

export enum Area {
  COMPLIANCE = 'Compliance',
  JURIDICO = 'Jurídico',
  TI = 'TI',
}

export enum Priority {
  HIGH = 'Alta',
  MEDIUM = 'Média',
  LOW = 'Baixa',
}

export enum Status {
  NOT_STARTED = 'Não Iniciado',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído',
  NA = 'N/A',
}

export interface Requirement {
  id: string;
  requirementText: string;
  detailedDescription: string;
  area: Area;
  priority: Priority;
  status: Status;
  textualEvidence: string;
  necessaryAction: string;
  serviceProposal: string;
  estimatedDeadline: string | null;
  responsible: string;
  nonComplianceRisks: string;
}

export interface Discrepancy {
    id: string;
    description: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
}

export interface FundingAgentMention {
    mention: string;
    pageNumber: number;
    context: string;
}

export interface AnalysisResult {
  summary: string;
  complianceScore: number;
  requirements: Requirement[];
  discrepancies: Discrepancy[];
  fundingAgentMentions: FundingAgentMention[];
  bipServiceScores: {
    [serviceId: string]: number;
  };
}

export interface StrategicFrameworkArea {
  areaName: string;
  pillarType: 'governance' | 'operations' | 'technology' | 'risk';
  challenges: string[];
  strategicRecommendations: string[];
  recommendations: {
    horizon: 'Immediate' | 'Structural' | 'Innovation';
    text: string;
  }[];
}

export interface ValuePropositionData {
  executiveSummary: string;
  regulatoryChallenges: string;
  strategicFramework: StrategicFrameworkArea[];
  businessImpact: {
    capitalEfficiency: string;
    reputationalRisk: string;
    operationalResilience: string;
  };
  ourSolution: string;
  nextSteps: string[];
}

export interface ChecklistItem {
  id: string;
  requirement: string;
  description: string;
  impact: string;
  isCritical: boolean;
}

export interface RegulatoryChecklistData {
  title: string;
  description: string;
  items: ChecklistItem[];
}

export interface BrainstormSection {
  title: string;
  pillarType: 'governance' | 'operations' | 'technology' | 'risk';
  ideas: string[];
}

export interface ServiceBrainstormData {
  sections: BrainstormSection[];
}

export interface GapAnalysisItem {
  id: string;
  regulatoryReference: string;
  obligationSummary: string;
  detailedActionPlan: string;
  responsibleArea: string;
  impactLevel: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  estimatedEffort: string;
}

export interface GapAnalysisData {
  title: string;
  description: string;
  items: GapAnalysisItem[];
}

export interface SavedAnalysis extends AnalysisResult {
    id: number;
    fileName: string;
    analyzedAt: string;
    fileHash: string;
    fileData?: string; // Base64 string of the original file
    valueProposition?: ValuePropositionData;
    regulatoryChecklist?: RegulatoryChecklistData;
    serviceBrainstorm?: ServiceBrainstormData;
    gapAnalysis?: GapAnalysisData;
}
