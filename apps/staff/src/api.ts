import type {
  ContractIssueInput,
  ContractAmendInput,
  ContractVerification,
  ProjectPreparationInput,
  CustomerReviewRequest,
  DashboardData,
  EngineeringDeliverable,
  Feedback,
  FinanceDeposit,
  HrContract,
  InventoryProject,
  Lead,
  MarketingProductionEntry,
  Role,
  Session,
  StaffUser,
  SubmissionPost,
} from "../../../packages/staff-contracts/types";

import { signIn, resetPassword } from "./auth/firebase.mjs";
const firebaseKey = import.meta.env.VITE_STAFF_FIREBASE_API_KEY || "";
let csrf = "";
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
): Promise<T> {
  const response = await fetch(`/staff-api/v1/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(method !== "GET"
        ? {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf,
            "Idempotency-Key": key || crypto.randomUUID(),
          }
        : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || !("data" in payload)) {
    if (response.status === 401)
      window.dispatchEvent(new Event("staff-session-expired"));
    throw new Error(
      payload?.error?.message ||
        "The staff service could not confirm your request. Please try again.",
    );
  }
  return payload.data as T;
}
export const api = {
  getActiveUser(): StaffUser | null {
    return null;
  },
  setActiveRole(_role: Role): StaffUser | null {
    return null;
  },
  async session() {
    const data = await request<Omit<Session, "user"> & { user: StaffUser | null }>(
      "session",
    );
    csrf = data.csrfToken;
    return data;
  },
  async login(username: string, password: string) {
    await this.session();
    const idToken = await signIn(firebaseKey, username, password);
    const data = await request<Session>("auth/login", "POST", {
      idToken,
    });
    csrf = data.csrfToken;
    return data;
  },
  logout: () => request("auth/logout", "POST", {}),
  load: (view: string, q = "", page = 0, bucket = "all") =>
    request<DashboardData>(
      `dashboard?${new URLSearchParams({ view, q, page: String(page), bucket })}`,
    ),
  lead: (id: number) => request<Lead>(`leads/${id}`),
  draft: (body: unknown, key: string) =>
    request<Lead>("call-drafts", "POST", body, key),
  entry: (id: number, body: unknown, key: string) =>
    request<Lead & { duplicateConflict?: boolean }>(`leads/${id}/submit-entry`, "POST", body, key),
  feedback: (id: number, body: Feedback, key: string) =>
    request(`followups/${id}/feedback`, "POST", body, key),
  createTask: (body: unknown, key: string) =>
    request("tasks", "POST", body, key),
  taskStatus: (id: number, status: string, version: number, key?: string) =>
    request(`tasks/${id}`, "PATCH", { status, version }, key),
  staff: () => request<Session["user"][]>("staff"),
  createDepartment: (body: { code: string; name: string }) =>
    request("departments", "POST", body),
  createStaff: (body: unknown, key: string) =>
    request("staff", "POST", body, key),
  saveProject: (projectInput: Partial<InventoryProject>) =>
    request<InventoryProject>("inventory/projects", "POST", projectInput),
  resolveCustomerReview: (reviewId: number, decision: "approved_shared" | "rejected") =>
    request<CustomerReviewRequest>(`customers/review-requests/${reviewId}`, "POST", { decision }),
  upload: (dataUrl: string, fileName: string, purpose: string) =>
    request<{url: string; fileName: string}>("files", "POST", {dataUrl, fileName, purpose}),
  saveProjectPreparation: (projectId: number, body: ProjectPreparationInput) =>
    request<InventoryProject>(`inventory/projects/${projectId}/preparation`, "POST", body),
  verifyContract: (token: string) => request<ContractVerification>(`hr/contracts/verify?${new URLSearchParams({token})}`),
  issueContract: (payload: ContractIssueInput) => request<HrContract>("hr/contracts", "POST", payload),
  amendContract: (id: number, body: ContractAmendInput) => request<HrContract>(`hr/contracts/${id}/amend`, "POST", body),
  manageDeposit: (payload: {
    action: "draft" | "approve" | "return" | "reverse";
    contractId: number;
    installmentId: number;
    depositId?: number;
    version?: number;
    paymentDate?: string;
    amount?: number;
    paymentMethod?: "Cash" | "Bank Transfer" | "Cheque";
    receiptNumber?: string;
    notes?: string;
    reason?: string;
  }) => request<FinanceDeposit>("finance/deposits", "POST", payload),
  createMarketingEntry: (payload: {
    customerName: string;
    address: string;
    propertyType: "Villa" | "Block" | "Building" | "Apartment";
  }) => request<MarketingProductionEntry>("marketing/entries", "POST", payload),
  advanceMarketing: (
    entryId: number,
    action:
      | "schedule_filming"
      | "complete_filming"
      | "schedule_editing"
      | "ready_for_post"
      | "mark_posted",
    payload: Record<string, unknown>,
  ) =>
    request<{ entry: MarketingProductionEntry; submission?: SubmissionPost }>(
      `marketing/entries/${entryId}`,
      "POST",
      { action, ...payload },
    ),
  uploadDeliverableVersion: (
    deliverableId: number,
    payload: { fileUrl: string; fileName: string; format: string; notes: string; version: number },
  ) =>
    request<EngineeringDeliverable>(
      `engineering/deliverables/${deliverableId}/versions`,
      "POST",
      payload,
    ),
  reviewDeliverable: (
    deliverableId: number,
    payload: {
      version: number;
      versionNumber: number;
      decision: "approved" | "revision_requested";
      comment: string;
    },
  ) =>
    request<EngineeringDeliverable>(
      `engineering/deliverables/${deliverableId}/review`,
      "POST",
      payload,
    ),
  resetPassword: (email: string) => resetPassword(firebaseKey, email),
};
