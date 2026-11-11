import type {
  DashboardData,
  Feedback,
  Lead,
  Session,
} from "../../../packages/staff-contracts/types";
import {
  normalizePhone,
  validateFeedback,
} from "../../../packages/staff-contracts/workflow.mjs";
const iso = (hours: number) =>
  new Date(Date.now() + hours * 3600000).toISOString();
let next = 100;
const users = [
  { id: 1, name: "Farid Ahmadi", role: "callcenter" as const },
  { id: 2, name: "Sara Karimi", role: "sales" as const },
  { id: 3, name: "Attaie Management", role: "ceo" as const },
];
const names = [
  "Ahmad Rahimi",
  "Maryam Noori",
  "Omar Sadiqi",
  "Zahra Azizi",
  "Hamid Karimi",
];
let data: DashboardData = {
  leads: names.map((name, index) => ({
    id: index + 1,
    serial: `CA01-L${index + 1}`,
    customerId: index + 1,
    customerName: name,
    phone: "+93700000000",
    requirements: [
      "Three-bedroom apartment in Shahr-e-Naw. Family home with parking.",
      "Commercial space near a main road. Interested in a viewing.",
      "Two-bedroom apartment in Kart-e-Char. Looking for payment options.",
      "Family apartment with a balcony. Arrange a weekend visit.",
      "Four-bedroom home, ready to move in.",
    ][index],
    status: "active",
    originAgentId: 1,
    callAt: iso(-48),
    source: "fixture",
    version: 1,
  })),
  followups: names.map((name, index) => ({
    id: index + 1,
    leadId: index + 1,
    serial: `CA01-L${index + 1}`,
    customerName: name,
    phone: "+93700000000",
    requirements: "Discuss property options and arrange the next step.",
    assigneeId: 1,
    scheduledAt: iso([-2, 3, -28, 22, -4][index]),
    completedAt: null,
    notes: "Customer requested a callback about suitable properties.",
    version: 1,
  })),
  customers: [],
  tasks: [
    {
      id: 1,
      title: "Review new customer inquiries",
      instructions:
        "Check the latest inquiries and confirm that every customer has a scheduled next step.",
      priority: "high",
      assigneeId: 1,
      assignedBy: "Attaie Management",
      deadlineAt: iso(4),
      status: "todo",
      version: 1,
    },
    {
      id: 2,
      title: "Prepare weekly follow-up summary",
      instructions:
        "Summarize this week’s customer follow-ups and flag any cases needing management support.",
      priority: "normal",
      assigneeId: 1,
      assignedBy: "Attaie Management",
      deadlineAt: iso(25),
      status: "in_progress",
      version: 1,
    },
  ],
  assignees: users,
  counts: {},
  page: 0,
  integration: {
    enabled: false,
    message:
      "Sample workspace only. No calls, messages, or server data are connected.",
  },
  serverTime: iso(0),
};
export function previewClient(management: boolean) {
  const user = users[management ? 2 : 0];
  const client = {
    async session() {
      return { user, csrfToken: "", serverTime: iso(0) } as Session;
    },
    async load(view: string, q = "", page = 0) {
      const search = q.toLowerCase();
      const result = structuredClone(data);
      result.serverTime = iso(0);
      result.page = page;
      result.customers = data.leads
        .filter((l) => l.customerId !== null)
        .map((l) => ({
          id: l.customerId!,
          name: l.customerName,
          phone: l.phone,
          requirements: l.requirements,
          leadCount: 1,
        }));
      result.leads = result.leads
        .filter((l) =>
          `${l.serial} ${l.customerName} ${l.phone}`
            .toLowerCase()
            .includes(search),
        )
        .slice(page * 25, (page + 1) * 25);
      result.customers = result.customers
        .filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(search))
        .slice(page * 25, (page + 1) * 25);
      result.followups = result.followups
        .filter(
          (f) =>
            f.assigneeId === user.id &&
            `${f.serial} ${f.customerName}`.toLowerCase().includes(search),
        )
        .slice(page * 25, (page + 1) * 25);
      result.tasks = result.tasks
        .filter(
          (t) =>
            t.assigneeId === user.id && t.title.toLowerCase().includes(search),
        )
        .slice(page * 25, (page + 1) * 25);
      return result;
    },
    async lead(id: number) {
      const lead = data.leads.find((l) => l.id === id);
      if (!lead) throw new Error("Lead not found.");
      return {
        ...lead,
        activities: [
          {
            id: 1,
            actorName: "Farid Ahmadi",
            type: "entry_submitted",
            notes: lead.requirements,
            at: lead.callAt,
          },
        ],
      };
    },
    async draft(body: unknown, _key: string) {
      const input = body as { phone: string; callAt: string };
      const lead: Lead = {
        id: ++next,
        serial: `CA01-L${next}`,
        customerId: null,
        customerName: "",
        phone: normalizePhone(input.phone),
        requirements: "",
        status: "draft",
        originAgentId: 1,
        callAt: input.callAt,
        source: "fixture",
        version: 1,
      };
      data.leads.unshift(lead);
      return lead;
    },
    async entry(id: number, body: unknown, _key: string) {
      const input = body as {
        customerName: string;
        requirements: string;
        nextScheduledAt: string;
        nextAssigneeId: number;
      };
      const lead = data.leads.find((l) => l.id === id)!;
      Object.assign(lead, {
        customerName: input.customerName,
        requirements: input.requirements,
        status: "active",
        customerId: ++next,
        version: lead.version + 1,
      });
      data.followups.unshift({
        id: ++next,
        leadId: id,
        serial: lead.serial,
        customerName: input.customerName,
        phone: lead.phone,
        requirements: input.requirements,
        assigneeId: input.nextAssigneeId,
        scheduledAt: input.nextScheduledAt,
        completedAt: null,
        notes: input.requirements,
        version: 1,
      });
      return lead;
    },
    async feedback(id: number, body: Feedback, _key: string) {
      validateFeedback(body, user.role);
      const task = data.followups.find((f) => f.id === id)!;
      task.completedAt = iso(0);
      task.version++;
      const lead = data.leads.find((l) => l.id === task.leadId)!;
      if (body.outcome === "lost") lead.status = "lost";
      else
        data.followups.unshift({
          ...task,
          id: ++next,
          assigneeId: body.nextAssigneeId!,
          scheduledAt: body.nextScheduledAt!,
          completedAt: null,
          notes: body.notes || "",
          version: 1,
        });
      return { success: true };
    },
    async createTask(body: unknown, _key: string) {
      const input = body as {
        title: string;
        instructions: string;
        assigneeId: number;
        priority: "normal";
        deadlineAt: string;
      };
      data.tasks.unshift({
        ...input,
        id: ++next,
        status: "todo",
        assignedBy: user.name,
        version: 1,
      });
      return { id: next };
    },
    async taskStatus(id: number, status: string, _version: number) {
      const task = data.tasks.find((t) => t.id === id)!;
      task.status = status as typeof task.status;
      task.version++;
      return { success: true };
    },
    async staff() {
      return users;
    },
    async createStaff(_body: unknown, _key: string) {
      throw new Error("Account creation is disabled in sample preview.");
    },
    async resetPassword(_email: string) {
      throw new Error("Passwords are not stored in sample preview.");
    },
    async logout() {
      location.href = location.pathname;
    },
  };
  return client;
}
