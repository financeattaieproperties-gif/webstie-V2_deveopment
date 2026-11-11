export type Role = "callcenter" | "sales" | "admin" | "ceo"
  | "sales_leader" | "production_manager" | "editor" | "photographer"
  | "branch_manager" | "assistant_manager" | "finance_manager" | "finance_assistant"
  | "architect" | "graphic_designer" | "visual_designer_3d" | "customer";
export interface StaffUser {
  id: number;
  name: string;
  role: Role;
  username?: string;
  active?: boolean;
}
export interface Customer {
  id: number;
  name: string;
  phone: string;
  requirements: string;
  leadCount: number;
}
export interface Activity {
  id: number;
  actorName: string;
  type: string;
  notes: string;
  at: string;
}
export interface Lead {
  id: number;
  serial: string;
  customerId: number | null;
  customerName: string;
  phone: string;
  requirements: string;
  status: "draft" | "active" | "closed" | "lost";
  originAgentId: number;
  callAt: string;
  source: "manual" | "provider" | "fixture";
  version: number;
  activities?: Activity[];
  deal?: { amount: string; currency: string; salesAgent: string; closedAt: string } | null;
}
export interface Followup {
  id: number;
  leadId: number;
  serial: string;
  customerName: string;
  phone: string;
  requirements: string;
  assigneeId: number;
  scheduledAt: string;
  completedAt: string | null;
  notes: string;
  version: number;
}
export interface ManagementTask {
  id: number;
  title: string;
  instructions: string;
  priority: "low" | "normal" | "high" | "urgent";
  assigneeId: number;
  assignedBy: string;
  deadlineAt: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  version: number;
  completedAt?: string | null;
}
export interface Session {
  user: StaffUser;
  csrfToken: string;
  serverTime: string;
}
export interface Feedback {
  outcome: "followup" | "visit" | "closed" | "lost";
  notes?: string;
  reason?: string;
  amount?: string;
  currency?: string;
  nextScheduledAt?: string;
  nextAssigneeId?: number;
  version: number;
}
export interface DashboardData {
  leads: Lead[];
  followups: Followup[];
  tasks: ManagementTask[];
  customers: Customer[];
  assignees: StaffUser[];
  counts: Record<string, number>;
  page: number;
  integration: { enabled: boolean; message: string };
  serverTime: string;
}
