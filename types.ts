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
}

export interface SavedAnalysis extends AnalysisResult {
    id: number;
    fileName: string;
    analyzedAt: string;
    fileHash: string;
}

export interface StrategicFrameworkArea {
  areaName: string;
  challenges: string[];
  recommendations: string[];
}

export interface ValuePropositionData {
  executiveSummary: string;
  regulatoryChallenges: string;
  strategicFramework: StrategicFrameworkArea[];
  ourSolution: string;
  nextSteps: string[];
}