import { Investigation, PaymentLog } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function createInvestigation(claim: string, max_budget_usdc: number = 0.01): Promise<Investigation> {
  const res = await fetch(`${API_BASE_URL}/investigations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim, max_budget_usdc })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit claim investigation');
  }

  return await res.json();
}

export async function getInvestigation(id: string): Promise<Investigation> {
  const res = await fetch(`${API_BASE_URL}/investigations/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch investigation ${id}`);
  }
  return await res.json();
}

export async function listInvestigations(): Promise<Investigation[]> {
  const res = await fetch(`${API_BASE_URL}/investigations`);
  if (!res.ok) return [];
  return await res.json();
}

export async function listPayments(): Promise<PaymentLog[]> {
  const res = await fetch(`${API_BASE_URL}/payments`);
  if (!res.ok) return [];
  return await res.json();
}

export function subscribeToInvestigationSSE(
  investigationId: string,
  onEvent: (eventType: string, data: any) => void
): () => void {
  const sseUrl = `${API_BASE_URL}/investigations/${investigationId}/stream`;
  const eventSource = new EventSource(sseUrl);

  const eventTypes = ['CONNECTED', 'STATE_CHANGE', 'AGENT_LOG', 'PAYMENT_EVENT', 'EVIDENCE_ADDED'];

  eventTypes.forEach(evt => {
    eventSource.addEventListener(evt, (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(evt, parsed);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });
  });

  eventSource.onerror = (err) => {
    console.warn('SSE EventSource disconnected or error:', err);
  };

  return () => {
    eventSource.close();
  };
}
