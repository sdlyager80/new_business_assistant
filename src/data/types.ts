// ── Bloom Insurance — New Business Assistant — Type Definitions ───────────────

export type ProductType = 'Term Life' | 'Whole Life' | 'Universal Life' | 'Fixed Annuity' | 'Variable Annuity';
export type SubmissionStatus =
  | 'New Submission'
  | 'Pending Review'
  | 'In Review'
  | 'Requirements Needed'
  | 'STP Eligible'
  | 'Approved'
  | 'Declined';
export type PriorityLevel = 'High' | 'Medium' | 'Low';
export type WorkflowStageStatus = 'complete' | 'current' | 'blocked' | 'waived' | 'pending';

export interface WorkflowStage {
  name: string;
  status: WorkflowStageStatus;
  date?: string;
  note?: string;
}

export interface AcordForm {
  formNumber: string;      // e.g. 'ACORD 103'
  formName: string;        // e.g. 'Life Application'
  confidenceScore: number; // 0–100
  fieldsExtracted: number;
  totalFields: number;
  extractionTime: string;
  fileName: string;
}

export interface SupportingDocument {
  id: string;
  name: string;
  type: 'APS' | 'Paramedical' | 'Financial Statement' | 'Blood Profile' | 'Urine' | 'Other';
  status: 'Received' | 'Ordered' | 'Scheduled' | 'Pending' | 'Waived';
  receivedDate?: string;
}

export interface AIInsight {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  action?: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  note?: string;
}

export interface Submission {
  id: string;
  applicantName: string;
  dob: string;
  age: number;
  gender: 'M' | 'F';
  occupation: string;
  state: string;
  productType: ProductType;
  faceAmount: number;
  annuityAmount?: number;
  premiumMode?: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  status: SubmissionStatus;
  priority: PriorityLevel;
  riskScore: number;
  assignedTo: string;
  submittedDate: string;
  slaDate: string;
  slaDaysRemaining: number;
  acordForms: AcordForm[];
  supportingDocs: SupportingDocument[];
  workflowStages: WorkflowStage[];
  aiInsights: AIInsight[];
  activityLog: ActivityEntry[];
  routingDecision: string;
  routingReason: string;
  stpEligible: boolean;
  tableClass?: string;
  medicalNotes?: string;
}
