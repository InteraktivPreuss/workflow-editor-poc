import type { WorkflowExport } from './types';

/** Client for the Nick-compatible workflow store (see backend/). */

export interface WorkflowListItem {
  id: string;
  title: string;
}

const trim = (baseUrl: string) => baseUrl.replace(/\/$/, '');

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json())?.error ?? '';
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export async function listWorkflows(baseUrl: string): Promise<WorkflowListItem[]> {
  return json(await fetch(`${trim(baseUrl)}/workflows`));
}

export async function getWorkflow(baseUrl: string, id: string): Promise<WorkflowExport> {
  return json(await fetch(`${trim(baseUrl)}/workflows/${encodeURIComponent(id)}`));
}

export async function saveWorkflow(baseUrl: string, id: string, wf: WorkflowExport): Promise<{ id: string }> {
  return json(
    await fetch(`${trim(baseUrl)}/workflows/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf),
    }),
  );
}

export async function createWorkflow(baseUrl: string, wf: WorkflowExport): Promise<{ id: string }> {
  return json(
    await fetch(`${trim(baseUrl)}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf),
    }),
  );
}

export async function deleteWorkflow(baseUrl: string, id: string): Promise<void> {
  const res = await fetch(`${trim(baseUrl)}/workflows/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
}
