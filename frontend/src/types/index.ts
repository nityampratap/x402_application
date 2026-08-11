export type InvestigationStatus = 
  | 'PENDING'
  | 'PLANNING'
  | 'AGENT_DISPATCH'
  | 'IN_PROGRESS'
  | 'SCORING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PLANNING_FAILED';

export type PaymentStatus = 
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SUCCESS'
  | 'PAYMENT_FAILED'
  | 'HTTP_ERROR';

export interface AgentRun {
  id: string;
  investigation_id: string;
  agent_name: string;
  agent_type: string;
  sub_question: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  estimated_value?: number;
  estimated_cost_usdc?: number;
  selection_status?: 'SELECTED' | 'SKIPPED';
  selection_reason?: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface EvidenceItem {
  id: string;
  investigation_id: string;
  agent_run_id: string;
  source_url: string;
  is_paid: boolean;
  content_summary: string;
  reliability_score: number;
  created_at: string;
}

export interface PaymentLog {
  id: string;
  investigation_id: string;
  agent_run_id: string;
  endpoint_url: string;
  amount_usdc: number;
  asset_address: string;
  network: string;
  tx_hash: string | null;
  status: PaymentStatus;
  failure_reason: string | null;
  created_at: string;
}

export interface Investigation {
  id: string;
  claim_text: string;
  status: InvestigationStatus;
  overall_confidence_score: number | null;
  total_spend_usdc: number;
  max_budget_usdc: number;
  created_at: string;
  updated_at: string;
  agent_runs: AgentRun[];
  evidence_items: EvidenceItem[];
  payment_logs: PaymentLog[];
}

export interface SSEEventData {
  event_type: string;
  investigation_id: string;
  timestamp: string;
  payload: Record<string, any>;
}
