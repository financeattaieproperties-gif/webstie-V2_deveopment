import type {
  DashboardData,
  Feedback,
  Lead,
  Session,
} from "../../../packages/staff-contracts/types";

import { signIn, resetPassword } from './auth/firebase.mjs';
const firebaseKey = import.meta.env.VITE_STAFF_FIREBASE_API_KEY || '';
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
  async session() {
    const data = await request<Session & { user: Session["user"] | null }>(
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
    request<Lead>(`leads/${id}/submit-entry`, "POST", body, key),
  feedback: (id: number, body: Feedback, key: string) =>
    request(`followups/${id}/feedback`, "POST", body, key),
  createTask: (body: unknown, key: string) =>
    request("tasks", "POST", body, key),
  taskStatus: (id: number, status: string, version: number, key: string) =>
    request(`tasks/${id}`, "PATCH", { status, version }, key),
  staff: () => request<Session["user"][]>("staff"),
  createStaff: (body: unknown, key: string) =>
    request("staff", "POST", body, key),
  resetPassword: (email: string) => resetPassword(firebaseKey, email),
};
