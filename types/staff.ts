// types/staff.ts

export interface Ticket {
  id: number;
  title: string;
  department_id?: number;
  client_id: number;
  status: 'open' | 'closed' | 'pending';
  priority?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientTask {
  id: number;
  lead_id?: number;
  client_id?: number;
  task_title: string;
  due_date_shamsi?: string;
  status: string;
  assigned_agent_id?: number;
  created_at: string;
}