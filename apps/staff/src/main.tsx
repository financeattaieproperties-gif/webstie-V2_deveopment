import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  ClipboardList,
  PhoneIncoming,
  Plus,
  Search,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  X,
  Menu,
  LogOut,
  Check,
  ChevronDown,
  Clock3,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  UserRound,
  Headphones,
  Building2,
  Globe,
  CheckCheck,
  FileText,
  DollarSign,
  Film,
  Send,
  Compass,
  Download,
} from "lucide-react";
import type {
  DashboardData,
  Followup,
  InventoryProject,
  Lead,
  ManagementTask,
  Role,
  Session,
  StaffUser,
  Feedback,
} from "../../../packages/staff-contracts/types";
import {
  canAccessDatabase,
  feedbackDeadline,
  followupState,
  formatLeadsToCsv,
  generateLeadsPdfDocument,
  isManagerRole,
  summarizeLeadsPipeline,
  taskState,
} from "../../../packages/staff-contracts/workflow.mjs";
import { api } from "./api";
import { AttaieLogoEntrance } from "./components/AttaieLogoEntrance";
import { ProjectInventoryWizard } from "./components/ProjectInventoryWizard";
import { HrContractsWorkspace } from "./components/HrContractsWorkspace";
import { AgreementVerification } from "./components/AgreementVerification";
import { FinanceWorkspace } from "./components/FinanceWorkspace";
import {
  MarketingWorkspace,
  SubmissionsStatusView,
} from "./components/MarketingWorkspace";
import { EngineeringWorkspace } from "./components/EngineeringWorkspace";
import logo from "./assets/logo.png";
import "./styles.css";
import "./callcenter-theme.css";

type Client = typeof api;
type Page =
  | "overview"
  | "followups"
  | "customers"
  | "leads"
  | "tasks"
  | "team"
  | "projects"
  | "contracts"
  | "finance"
  | "marketing"
  | "submissions"
  | "deliverables"
  | "profile";

const searchParams = new URLSearchParams(location.search);
const isDashboardPath = location.pathname.startsWith("/dashboard");
const isPreview =
  (__STAFF_PREVIEW_ALLOWED__ && searchParams.get("preview") === "1") ||
  (__STAFF_PREVIEW_ALLOWED__ && isDashboardPath);
const management = __STAFF_PREVIEW_ALLOWED__
  ? location.pathname.startsWith("/management") || isDashboardPath
  : __STAFF_ROLE__ === "management" || __STAFF_ROLE__ === "dashboard";

const initialRoleParam = searchParams.get("role") as Role | null;
document.documentElement.dataset.staffRole = isDashboardPath
  ? "dashboard"
  : management
    ? "management"
    : "callcenter";

const base = isDashboardPath
  ? "/dashboard"
  : management
    ? "/management"
    : "/callcenter";

const client: Client = isPreview
  ? await import("./preview").then((m) =>
      m.previewClient(management, initialRoleParam || undefined),
    )
  : api;

const labels: Record<string, string> = {
  upcoming: "Upcoming",
  due: "Due now",
  overtime: "Overtime",
  completed: "Completed",
  completed_late: "Completed late",
  todo: "To do",
  in_progress: "In progress",
  overdue: "Overdue",
  cancelled: "Cancelled",
  draft: "Needs details",
  active: "Active",
  closed: "Deal closed",
  lost: "Deal lost",
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  ceo: "CEO",
  sales_leader: "Sales Team Leader",
  sales: "Sales Agent",
  callcenter: "Call Center Agent",
  marketing_manager: "Marketing Manager",
  editor: "Editor",
  videographer: "Videographer",
  finance_manager: "Finance Manager",
  architect: "Architect",
  graphic_designer: "Graphic Designer",
  visual_designer_3d: "3D Visualization Engineer",
};

const SWITCHABLE_ROLES: { role: Role; label: string }[] = [
  { role: "ceo", label: "CEO (Global Internal CRM Authority)" },
  { role: "manager", label: "Manager (Branch Contracts & Operations)" },
  { role: "sales_leader", label: "Sales Team Leader" },
  { role: "sales", label: "Sales Agent (Pipeline & Deal Closure)" },
  { role: "callcenter", label: "Call Center Agent" },
  { role: "marketing_manager", label: "Marketing Manager (Filming Schedule)" },
  { role: "videographer", label: "Videographer (Filming Completion)" },
  { role: "editor", label: "Editor (Editing & Mark Posted -> Submissions DB)" },
  { role: "finance_manager", label: "Finance Manager (Approve/Post/Reverse)" },
  { role: "architect", label: "Architect (2D Floor Plans)" },
  { role: "graphic_designer", label: "Graphic Designer (Brochures & Print)" },
  { role: "visual_designer_3d", label: "3D Visualization Engineer (3D Renders)" },
];

const fa: Record<string, string> = management
  ? (await import("./i18n/fa.json")).default
  : {};

function App() {
  const [language, setLanguage] = useState<"en" | "fa">(() =>
    management && localStorage.getItem("staff-language") === "fa" ? "fa" : "en",
  );
  const t = useCallback(
    (s: string) => (language === "fa" ? fa[s] || s : s),
    [language],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [playingEntrance, setPlayingEntrance] = useState(false);
  const [starting, setStarting] = useState(true);
  const [page, setPage] = useState<Page>(() => pageFromPath());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [number, setNumber] = useState(0);
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState("today");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<{
    kind:
      | "entry"
      | "feedback"
      | "task"
      | "detail"
      | "assign"
      | "staff"
      | "department";
    item?: Lead | Followup | ManagementTask;
  } | null>(null);
  const generation = useRef(0);

  const activeRole: Role = session?.user?.role || (management ? "ceo" : "callcenter");
  const isCallCenterOnly = activeRole === "callcenter" && !isDashboardPath && !management;

  useEffect(() => {
    const effectiveLang = isCallCenterOnly ? "en" : language;
    document.documentElement.lang = effectiveLang;
    document.documentElement.dir = effectiveLang === "fa" ? "rtl" : "ltr";
    if (!isCallCenterOnly) localStorage.setItem("staff-language", effectiveLang);
  }, [language, isCallCenterOnly]);

  useEffect(() => {
    client
      .session()
      .then((s) => setSession(s.user ? {...s, user: s.user} : null))
      .catch((e) => setError(e.message))
      .finally(() => setStarting(false));
    const expire = () => {
      setSession(null);
      setData(null);
      setError("Your session ended. Please sign in again.");
    };
    window.addEventListener("staff-session-expired", expire);
    return () => window.removeEventListener("staff-session-expired", expire);
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    const current = ++generation.current;
    setLoading(true);
    try {
      const result = await client.load(
        page === "profile" ? "overview" : page,
        query,
        number,
        page === "followups" ? filter : "all",
      );
      if (current === generation.current) {
        setData(result);
        setError("");
      }
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [session, page, query, number, filter]);

  useEffect(() => {
    const timer = window.setTimeout(refresh, 180);
    return () => {
      clearTimeout(timer);
      generation.current++;
    };
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 60000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [refresh]);

  useEffect(() => {
    const pop = () => {
      setPage(pageFromPath());
      setQuery("");
      setNumber(0);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);

  const navigate = (next: Page) => {
    history.pushState(
      {},
      "",
      `${base}/${next === "overview" ? "" : next}${isPreview ? "?preview=1" : ""}`,
    );
    setPage(next);
    setQuery("");
    setNumber(0);
    setMenu(false);
  };

  const handleSwitchRole = async (nextRole: Role) => {
    const updatedUser = client.setActiveRole(nextRole);
    if (updatedUser && session) {
      setSession({ ...session, user: updatedUser });
      setNotice(`Switched active workspace role to ${ROLE_LABELS[nextRole] || nextRole}.`);
      const s = await client.session();
      setSession(s.user ? {...s, user: s.user} : null);
      await refresh();
    }
  };

  const format = (value: string) =>
    new Intl.DateTimeFormat(language === "fa" && !isCallCenterOnly ? "fa-AF" : "en-GB", {
      timeZone: "Asia/Kabul",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const badge = (value: string) => (
    <span className={`badge ${value}`}>{t(labels[value] || value)}</span>
  );

  const manager = !!session && isManagerRole(session.user.role);

  const canAssignTasks =
    !!session &&
    [
      "manager",
      "ceo",
      "sales_leader",
      "marketing_manager",
      "finance_manager",
    ].includes(session.user.role);

  const complete = async () => {
    setModal(null);
    setNotice(t("Saved successfully."));
    await refresh();
  };

  const hasSalesOrCallAccess = [
    "callcenter",
    "sales",
    "sales_leader",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasProjectsAccess = [
    "manager",
    "ceo",
    "manager",
    "sales_leader",
    "sales",
    "callcenter",
    "finance_manager",
    "architect",
    "graphic_designer",
    "visual_designer_3d",
  ].includes(activeRole);
  const hasContractsAccess = [
    "manager",
    "ceo",
    "finance_manager",
  ].includes(activeRole);
  const hasFinanceAccess = [
    "finance_manager",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasMarketingAccess = [
    "marketing_manager",
    "production_manager",
    "editor",
    "videographer",
    "photographer",
    "sales",
    "sales_leader",
    "callcenter",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasEngineeringAccess = [
    "architect",
    "graphic_designer",
    "visual_designer_3d",
    "manager",
    "ceo",
  ].includes(activeRole);
  const hasSubmissionsReadAccess =
    canAccessDatabase(activeRole, "submissions") !== false;

  const tabs: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    ...(hasSalesOrCallAccess && !manager
      ? [
          { id: "followups" as Page, label: "Follow-ups", icon: CalendarClock },
          { id: "customers" as Page, label: "Customers", icon: Users },
          { id: "leads" as Page, label: "Leads", icon: PhoneIncoming },
        ]
      : []),
    ...(manager
      ? [
          { id: "customers" as Page, label: "Customers", icon: Users },
          { id: "leads" as Page, label: "Leads", icon: PhoneIncoming },
        ]
      : []),
    ...(hasProjectsAccess
      ? [{ id: "projects" as Page, label: "Pre-Sale Projects", icon: Building2 }]
      : []),
    ...(hasContractsAccess
      ? [{ id: "contracts" as Page, label: "HR Contracts", icon: FileText }]
      : []),
    ...(hasFinanceAccess
      ? [{ id: "finance" as Page, label: "Finance Ledger", icon: DollarSign }]
      : []),
    ...(hasMarketingAccess
      ? [{ id: "marketing" as Page, label: "Marketing & Media", icon: Film }]
      : []),
    ...(hasEngineeringAccess
      ? [
          {
            id: "deliverables" as Page,
            label: "Engineering",
            icon: Compass,
          },
        ]
      : []),
    ...(hasSubmissionsReadAccess
      ? [{ id: "submissions" as Page, label: "Submissions", icon: Send }]
      : []),
    { id: "tasks", label: "My Tasks", icon: ClipboardList },
    ...(canAssignTasks
      ? [{ id: "team" as Page, label: "Team tasks", icon: Users }]
      : []),
  ];

  const headings: Record<Page, [string, string]> = {
    overview: ["Overview", "Your day, clearly organized."],
    followups: ["Follow-ups", "Focus on the next conversation."],
    customers: ["Customers", "Customer requirements, in one place."],
    leads: ["Leads", "Every inquiry has a next step."],
    tasks: ["My Tasks", "A clear view of your assigned work."],
    team: ["Team tasks", "Give your team a clear next step."],
    projects: [
      "Pre-Sale Projects",
      "Manager project inventory, multiple sellers, construction company, and floor apartments.",
    ],
    contracts: [
      "HR Contracts",
      "4-step bilingual apartment contract issuance and Two-Page A4 legal printout.",
    ],
    finance: [
      "Finance Ledger",
      "Contract installment schedules, draft customer deposits, and Finance Manager approvals.",
    ],
    marketing: [
      "Marketing & Media",
      "Filming, editing, and social media post workflow connected to the Submission DB.",
    ],
    submissions: [
      "Submissions",
      "Read-only status of property posts sent to the isolated Submission Database.",
    ],
    deliverables: [
      "Engineering",
      "Project-linked architectural plans, graphic brochures, and 3D renders with version history.",
    ],
    profile: ["Profile", "Your workspace preferences and security."],
  };

  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("all");

  const leadsPipelineSummary = summarizeLeadsPipeline(data?.leads || []);

  const visibleLeads = (data?.leads || []).filter(
    (l) => leadStatusFilter === "all" || l.status === leadStatusFilter,
  );

  const triggerBlobDownload = (
    content: string,
    mimeType: string,
    filename: string,
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportLeadsCsv = () => {
    const csvContent = formatLeadsToCsv(visibleLeads);
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerBlobDownload(
      csvContent,
      "text/csv;charset=utf-8;",
      `attaie-leads-${leadStatusFilter}-${dateStamp}.csv`,
    );
    setNotice(
      `${t("Exported current leads view to CSV.")} (${visibleLeads.length})`,
    );
  };

  const handleExportLeadsPdf = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    const pdfContent = generateLeadsPdfDocument(visibleLeads, {
      title: "Attaie Properties — Internal CRM Leads Export",
      subtitle: `Role: ${ROLE_LABELS[activeRole] || activeRole} · Filter: ${leadStatusFilter.toUpperCase()} · Search: "${query || "All"}" · Records: ${visibleLeads.length}`,
    });
    triggerBlobDownload(
      pdfContent,
      "application/pdf",
      `attaie-leads-${leadStatusFilter}-${dateStamp}.pdf`,
    );
    setNotice(
      `${t("Exported current leads view to PDF.")} (${visibleLeads.length})`,
    );
  };

  const followups = (data?.followups || []).filter((f) => {
    const state = followupState(f, data?.serverTime);
    return (
      filter === "all" ||
      (filter === "today"
        ? !f.completedAt &&
          new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kabul" }).format(
            new Date(f.scheduledAt),
          ) ===
            new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kabul" }).format(
              new Date(data?.serverTime || Date.now()),
            )
        : filter === "completed"
          ? !!f.completedAt
          : state === filter)
    );
  });

  const followupTable = (items: Followup[]) =>
    items.length ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("Customer")}</th>
              <th>{t("Scheduled")}</th>
              <th>{t("Deadline")}</th>
              <th>{t("Status")}</th>
              <th>
                <span className="sr-only">{t("Action")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <button
                    className="person-link"
                    onClick={() =>
                      setModal({
                        kind: "detail",
                        item: { id: item.leadId } as Lead,
                      })
                    }
                  >
                    <span className="avatar">
                      {initials(item.customerName)}
                    </span>
                    <span>
                      <strong>{item.customerName}</strong>
                      <small className="serial">{item.serial}</small>
                    </span>
                  </button>
                </td>
                <td>{format(item.scheduledAt)}</td>
                <td className="muted">
                  {format(feedbackDeadline(item.scheduledAt))}
                </td>
                <td>{badge(followupState(item, data?.serverTime))}</td>
                <td>
                  <button
                    className="text-button"
                    onClick={() =>
                      setModal({
                        kind: item.completedAt ? "detail" : "feedback",
                        item: item.completedAt
                          ? ({ id: item.leadId } as Lead)
                          : item,
                      })
                    }
                  >
                    {t(item.completedAt ? "Open" : "Feedback")}
                    <ArrowUpRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty
        title={t("No records to show")}
        text={t("Try another filter or check back when new work is assigned.")}
      />
    );

  const verificationToken = searchParams.get("verify");
  if (verificationToken) return <AgreementVerification token={verificationToken} verify={client.verifyContract} lang={language} />;

  if (starting)
    return (
      <div className="center-screen">
        <div className="spinner" />
        <p>{t("Loading your workspace…")}</p>
      </div>
    );

  if (!session)
    return (
      <Login
        t={t}
        error={error}
        onLogin={(s) => {
          setPlayingEntrance(true);
          setSession(s);
          setError("");
        }}
        management={management}
      />
    );

  if (playingEntrance) {
    return (
      <AttaieLogoEntrance
        mode="login-transition"
        variant="teal"
        onComplete={() => setPlayingEntrance(false)}
      />
    );
  }

  if (
    !isDashboardPath &&
    !isPreview &&
    ((management && !manager) ||
      (!management && session.user.role !== "callcenter"))
  )
    return (
      <div className="center-screen">
        <ShieldCheck size={36} />
        <h1>{t("This account does not have access to this workspace.")}</h1>
        <button
          className="button"
          onClick={() =>
            client
              .logout()
              .then(() => {
                setSession(null);
                setData(null);
              })
              .catch((e) => setError(e.message))
          }
        >
          {t("Sign out")}
        </button>
      </div>
    );

  const roleLabel =
    ROLE_LABELS[session.user.role] ||
    (manager ? "Management" : "Call Center");

  return (
    <div className="staff-shell">
      {menu && (
        <button
          className="nav-shade"
          aria-label={t("Close")}
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <a className="brand" href={`${base}/${isPreview ? "?preview=1" : ""}`}>
          <img src={logo} alt="Attaie Properties" />
          <span>
            {t("Workspace")}
            <span className="brand-dot" />
          </span>
        </a>
        <div className="workspace-tag">
          <span className="workspace-icon">
            <Headphones size={18} />
          </span>
          <span>
            <strong>
              {t(
                !isDashboardPath
                  ? manager
                    ? "Management"
                    : "Call Center"
                  : roleLabel,
              )}
            </strong>
            <small>ATTAIE PROPERTIES</small>
          </span>
        </div>
        <p className="nav-caption">{t("WORKSPACE")}</p>
        <nav aria-label={t("Workspace")}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              className={`nav-item ${page === id ? "selected" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{t(label)}</span>
              {id === "followups" && (data?.counts.overtime || 0) > 0 && (
                <span className="nav-count">{data!.counts.overtime}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <ShieldCheck size={19} />
            <p>
              {t("Private staff workspace")}
              <small>{t("Your work stays within your team.")}</small>
            </p>
          </div>
          <button className="account" onClick={() => navigate("profile")}>
            <span className="avatar gold">{initials(session.user.name)}</span>
            <span>
              <strong>{session.user.name}</strong>
              <small>{t(roleLabel)}</small>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span>
              {t(
                !isDashboardPath
                  ? manager
                    ? "Management"
                    : "Call Center"
                  : roleLabel,
              )}
            </span>
            <span className="crumb-divider">/</span>
            <strong>{t(headings[page][0])}</strong>
          </div>
          <div className="topbar-actions">
            <span className="timezone">Kabul · UTC+04:30</span>
            {!isCallCenterOnly && (
              <button
                className="language-toggle"
                data-testid="staff-language-toggle"
                onClick={() => setLanguage(language === "en" ? "fa" : "en")}
              >
                <Globe size={15} />
                {language === "en" ? "دری" : "English"}
              </button>
            )}
            <span className="avatar small gold">
              {initials(session.user.name)}
            </span>
          </div>
        </header>
        {isPreview && (
          <div className="role-switcher-bar" data-testid="role-switcher-bar">
            <span>
              <strong>{t("Internal Office CRM Role Switcher")}</strong> ·{" "}
              Active: <strong>{session.user.name}</strong> ({roleLabel})
            </span>
            <div className="role-switcher-controls">
              <label htmlFor="preview-role-select" style={{ fontWeight: 600 }}>
                Switch Department Role:
              </label>
              <select
                id="preview-role-select"
                data-testid="preview-role-select"
                value={session.user.role}
                onChange={(e) => void handleSwitchRole(e.target.value as Role)}
              >
                {SWITCHABLE_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
              <a href={base + "/"}>{t("Exit preview")}</a>
            </div>
          </div>
        )}
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{t("ATTAIE WORKSPACE")}</div>
              <h1>{t(headings[page][0])}</h1>
              <p>{t(headings[page][1])}</p>
            </div>
            <div className="heading-actions">
              <button
                className="icon-button"
                onClick={refresh}
                disabled={loading}
                aria-label={t("Refresh")}
              >
                <RefreshCw className={loading ? "spinning" : ""} size={18} />
              </button>
              {canAssignTasks && (
                <button
                  className="button secondary"
                  data-testid="assign-task-btn"
                  onClick={() => setModal({ kind: "assign" })}
                >
                  <Plus size={17} />
                  {t("Assign task")}
                </button>
              )}
              {(activeRole === "callcenter" || activeRole === "sales") && (
                <button
                  className="button"
                  data-testid="new-entry-btn"
                  onClick={() => setModal({ kind: "entry" })}
                >
                  <Plus size={17} />
                  {t("New entry")}
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="alert error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={refresh}>{t("Refresh")}</button>
            </div>
          )}
          {notice && (
            <div className="alert success" role="status">
              <Check size={17} />
              {notice}
              <button aria-label={t("Close")} onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}

          {page === "overview" && (
            <>
              <div className="stats-grid">
                {[
                  {
                    label: "New inquiries",
                    value:
                      data?.counts.newLeads ??
                      data?.leads.filter((l) => l.status === "draft").length ??
                      0,
                    note: "Needs a first response",
                    icon: PhoneIncoming,
                    color: "gold",
                    target: (hasSalesOrCallAccess ? "leads" : "tasks") as Page,
                  },
                  {
                    label: "Due now",
                    value:
                      data?.counts.due ??
                      data?.followups.filter((f) => followupState(f) === "due")
                        .length ??
                      0,
                    note: "Within the feedback window",
                    icon: CalendarClock,
                    color: "blue",
                    target: (hasSalesOrCallAccess ? "followups" : "tasks") as Page,
                  },
                  {
                    label: "Overtime",
                    value:
                      data?.counts.overtime ??
                      data?.followups.filter(
                        (f) => followupState(f) === "overtime",
                      ).length ??
                      0,
                    note: "Past the 24-hour deadline",
                    icon: Clock3,
                    color: "red",
                    target: (hasSalesOrCallAccess ? "followups" : "tasks") as Page,
                  },
                  {
                    label: "My Tasks",
                    value:
                      data?.counts.tasks ??
                      data?.tasks.filter((task) => task.status !== "completed")
                        .length ??
                      0,
                    note: "Assigned by management",
                    icon: ClipboardList,
                    color: "purple",
                    target: "tasks" as Page,
                  },
                ].map(({ label, value, note, icon: Icon, color, target }) => (
                  <button
                    className="stat-card"
                    key={label}
                    onClick={() => {
                      setFilter(label === "Overtime" ? "overtime" : "due");
                      navigate(target);
                    }}
                  >
                    <div className="stat-top">
                      <span>{t(label)}</span>
                      <span className={`stat-icon ${color}`}>
                        <Icon size={18} />
                      </span>
                    </div>
                    <strong className="stat-number">{value}</strong>
                    <span className="stat-note">
                      {t(note)}
                      <ArrowUpRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="overview-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t("Your follow-ups")}</h2>
                      <p>{t("All times in Kabul · UTC+04:30")}</p>
                    </div>
                    {hasSalesOrCallAccess && (
                      <button
                        className="text-button"
                        onClick={() => {
                          setFilter("all");
                          navigate("followups");
                        }}
                      >
                        {t("View all")}
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                  {followupTable(
                    (data?.followups || [])
                      .filter((f) => !f.completedAt)
                      .slice(0, 5),
                  )}
                </section>
                <section className="panel task-preview">
                  <div className="panel-heading">
                    <div>
                      <h2>{t("Next on your list")}</h2>
                      <p>{t("Assigned by management")}</p>
                    </div>
                    <ClipboardList size={19} />
                  </div>
                  {data?.tasks.slice(0, 3).map((task) => (
                    <button
                      className="task-mini"
                      key={task.id}
                      onClick={() => setModal({ kind: "task", item: task })}
                    >
                      <span className="task-check">
                        <Check size={14} />
                      </span>
                      <span>
                        <strong>{task.title}</strong>
                        <small>{format(task.deadlineAt)}</small>
                      </span>
                      {badge(task.priority)}
                    </button>
                  ))}
                  {!data?.tasks.length && (
                    <Empty
                      title={t("No records to show")}
                      text={t("Tasks from management will appear here.")}
                    />
                  )}
                  <button
                    className="task-footer"
                    onClick={() => navigate("tasks")}
                  >
                    {t("My Tasks")}
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <div className="integration-note">
                <span className="status-dot" />
                <span>
                  <strong>{t("Etisalat not connected")}</strong> ·{" "}
                  {t(
                    "Call time is entered manually; this is not a verified provider event.",
                  )}
                </span>
              </div>
            </>
          )}

          {/* Phase 2: Pre-Sale Projects & Apartments Wizard */}
          {page === "projects" && (
            <ProjectInventoryWizard
              projects={data?.projects || []}
              staffUsers={data?.assignees || []}
              language={language}
              onUpload={client.upload}
              actorRole={activeRole}
              onSaveProject={async (proj) => {
                await client.saveProject(proj);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 4: HR Deal Contracts & Two-Page A4 Legal Printout */}
          {page === "contracts" && (
            <HrContractsWorkspace
              lang={language}
              onUpload={client.upload}
              onSavePreparation={async (projectId, body) => { const result = await client.saveProjectPreparation(projectId, body); await refresh(); return result; }}
              contracts={data?.hrContracts || []}
              projects={data?.projects || []}
              closedDeals={(data?.leads || []).filter(
                (l) => l.status === "closed",
              )}
              actorRole={activeRole}
              onAmendContract={async (id, body) => { const updated = await client.amendContract(id, body); await refresh(); return updated; }}
              onIssueContract={async (payload) => {
                const created = await client.issueContract(payload);
                await refresh();
                return created;
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 4: Finance Installment Schedule & Customer Deposits */}
          {page === "finance" && (
            <FinanceWorkspace
              lang={language}
              contracts={data?.hrContracts || []}
              deposits={data?.financeDeposits || []}
              actorRole={activeRole}
              onManageDeposit={async (payload) => {
                await client.manageDeposit(payload);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 5: Marketing & Media Production Pipeline */}
          {page === "marketing" && (
            <MarketingWorkspace
              onUpload={client.upload}
              entries={data?.marketingEntries || []}
              submissions={data?.submissions || []}
              staffUsers={data?.assignees || []}
              actorRole={activeRole}
              onCreateEntry={async (payload) => {
                await client.createMarketingEntry(payload);
                await refresh();
              }}
              onAdvanceEntry={async (id, action, payload) => {
                await client.advanceMarketing(id, action, payload);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {/* Phase 5: Read-Only Submissions Status View */}
          {page === "submissions" && (
            <SubmissionsStatusView submissions={data?.submissions || []} />
          )}

          {/* Phase 6: Engineering Project Tasks & Versioned Deliverables */}
          {page === "deliverables" && (
            <EngineeringWorkspace
              onUpload={client.upload}
              deliverables={data?.engineeringDeliverables || []}
              actorRole={activeRole}
              onUploadVersion={async (id, payload) => {
                await client.uploadDeliverableVersion(id, payload);
                await refresh();
              }}
              onReviewVersion={async (id, payload) => {
                await client.reviewDeliverable(id, payload);
                await refresh();
              }}
              onNotice={setNotice}
              onError={setError}
            />
          )}

          {["followups", "customers", "leads", "tasks", "team"].includes(page) && (
            <>
              {/* Manager Customer Duplicate Review Queue */}
              {page === "customers" &&
                manager &&
                (data?.customerReviewRequests || []).filter(
                  (r) => r.status === "pending_review",
                ).length > 0 && (
                  <section
                    className="panel"
                    style={{ marginBottom: 16 }}
                    data-testid="manager-customer-review-queue"
                  >
                    <div className="panel-heading">
                      <div>
                        <p className="eyebrow">
                          Phase 3 Deduplication · Redacted Conflict Queue
                        </p>
                        <h2>Pending Customer Duplicate Review Requests</h2>
                      </div>
                    </div>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Phone</th>
                            <th>Requesting Agent</th>
                            <th>Submitted Name & Requirements</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.customerReviewRequests || [])
                            .filter((r) => r.status === "pending_review")
                            .map((req) => (
                              <tr key={req.id}>
                                <td dir="ltr">
                                  <strong>{req.phone}</strong>
                                </td>
                                <td>{req.requestingAgentName}</td>
                                <td>
                                  <strong>{req.submittedName}</strong>
                                  <small>{req.submittedRequirements}</small>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                      type="button"
                                      className="button"
                                      data-testid={`approve-customer-review-${req.id}`}
                                      onClick={async () => {
                                        await client.resolveCustomerReview(
                                          req.id,
                                          "approved_shared",
                                        );
                                        setNotice(
                                          `Granted shared customer access to ${req.requestingAgentName}.`,
                                        );
                                        await refresh();
                                      }}
                                    >
                                      Approve Shared Access
                                    </button>
                                    <button
                                      type="button"
                                      className="button secondary"
                                      onClick={async () => {
                                        await client.resolveCustomerReview(
                                          req.id,
                                          "rejected",
                                        );
                                        setNotice("Rejected duplicate request.");
                                        await refresh();
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

              {page === "leads" && (
                <section
                  className="panel"
                  style={{ marginBottom: 16 }}
                  data-testid="leads-pipeline-summary-card"
                >
                  <div className="panel-heading" style={{ marginBottom: 12 }}>
                    <div>
                      <p className="eyebrow">{t("ATTAIE WORKSPACE")}</p>
                      <h2>{t("Pipeline Health Summary")}</h2>
                      <p>{t("Quick glance at lead pipeline distribution by status.")}</p>
                    </div>
                    <span className="badge active">
                      {t("Total Leads")}: {leadsPipelineSummary.total}
                    </span>
                  </div>

                  {/* Proportional Pipeline Health Bar */}
                  <div
                    style={{
                      display: "flex",
                      height: 10,
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "#e6fffb",
                      border: "1px solid #b9e8df",
                      marginBottom: 14,
                    }}
                    aria-label="Pipeline status distribution bar"
                  >
                    {leadsPipelineSummary.active > 0 && (
                      <div
                        style={{
                          width: `${Math.max(4, leadsPipelineSummary.percentages.activePct)}%`,
                          background: "#14b8a6",
                        }}
                        title={`Active: ${leadsPipelineSummary.active} (${leadsPipelineSummary.percentages.activePct}%)`}
                      />
                    )}
                    {leadsPipelineSummary.draft > 0 && (
                      <div
                        style={{
                          width: `${Math.max(4, leadsPipelineSummary.percentages.draftPct)}%`,
                          background: "#f59e0b",
                        }}
                        title={`Draft: ${leadsPipelineSummary.draft} (${leadsPipelineSummary.percentages.draftPct}%)`}
                      />
                    )}
                    {leadsPipelineSummary.closed > 0 && (
                      <div
                        style={{
                          width: `${Math.max(4, leadsPipelineSummary.percentages.closedPct)}%`,
                          background: "#0b3d3b",
                        }}
                        title={`Closed: ${leadsPipelineSummary.closed} (${leadsPipelineSummary.percentages.closedPct}%)`}
                      />
                    )}
                    {leadsPipelineSummary.lost > 0 && (
                      <div
                        style={{
                          width: `${Math.max(4, leadsPipelineSummary.percentages.lostPct)}%`,
                          background: "#ef4444",
                        }}
                        title={`Lost: ${leadsPipelineSummary.lost} (${leadsPipelineSummary.percentages.lostPct}%)`}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {[
                      {
                        key: "all",
                        label: t("Total Leads"),
                        count: leadsPipelineSummary.total,
                        pct: 100,
                        accent: "#0b3d3b",
                        testId: "pipeline-stat-total",
                      },
                      {
                        key: "active",
                        label: t("Active"),
                        count: leadsPipelineSummary.active,
                        pct: leadsPipelineSummary.percentages.activePct,
                        accent: "#14b8a6",
                        testId: "pipeline-stat-active",
                      },
                      {
                        key: "draft",
                        label: t("Draft"),
                        count: leadsPipelineSummary.draft,
                        pct: leadsPipelineSummary.percentages.draftPct,
                        accent: "#d97706",
                        testId: "pipeline-stat-draft",
                      },
                      {
                        key: "closed",
                        label: t("Closed"),
                        count: leadsPipelineSummary.closed,
                        pct: leadsPipelineSummary.percentages.closedPct,
                        accent: "#0f766e",
                        testId: "pipeline-stat-closed",
                      },
                      {
                        key: "lost",
                        label: t("Lost"),
                        count: leadsPipelineSummary.lost,
                        pct: leadsPipelineSummary.percentages.lostPct,
                        accent: "#dc2626",
                        testId: "pipeline-stat-lost",
                      },
                    ].map((stat) => {
                      const isSelected = leadStatusFilter === stat.key;
                      return (
                        <button
                          key={stat.key}
                          type="button"
                          data-testid={stat.testId}
                          onClick={() => setLeadStatusFilter(stat.key)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: 10,
                            border: isSelected
                              ? "2px solid #0b3d3b"
                              : "1px solid #b9e8df",
                            background: isSelected ? "#e6fffb" : "#f8fffe",
                            cursor: "pointer",
                            textAlign: "start",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              width: "100%",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#376663",
                              }}
                            >
                              {stat.label}
                            </span>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: stat.accent,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              width: "100%",
                              alignItems: "baseline",
                              justifyContent: "space-between",
                            }}
                          >
                            <strong
                              style={{
                                fontSize: 24,
                                lineHeight: 1.1,
                                color: "#0b3d3b",
                              }}
                            >
                              {stat.count}
                            </strong>
                            <small
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#376663",
                              }}
                            >
                              {stat.key === "all" ? "100%" : `${stat.pct}%`}
                            </small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="list-toolbar">
                  <div className="search-field">
                    <Search size={17} />
                    <input
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setNumber(0);
                      }}
                      placeholder={`${t("Search")}…`}
                      aria-label={t("Search")}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {page === "leads" && (
                      <>
                        <button
                          type="button"
                          className="button secondary"
                          data-testid="export-leads-csv-btn"
                          onClick={handleExportLeadsCsv}
                          disabled={!visibleLeads.length}
                        >
                          <Download size={15} />
                          {t("Export CSV")} ({visibleLeads.length})
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          data-testid="export-leads-pdf-btn"
                          onClick={handleExportLeadsPdf}
                          disabled={!visibleLeads.length}
                        >
                          <FileText size={15} />
                          {t("Export PDF")} ({visibleLeads.length})
                        </button>
                      </>
                    )}
                    <span className="list-note">
                      <SlidersHorizontal size={15} />
                      {t("Your permitted records")}
                    </span>
                  </div>
                </div>
                {page === "followups" && (
                  <div className="filter-bar">
                    {[
                      ["today", "Today"],
                      ["due", "All due"],
                      ["upcoming", "Upcoming"],
                      ["overtime", "Overtime"],
                      ["completed", "Completed"],
                      ["all", "All"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        onClick={() => setFilter(id)}
                        className={filter === id ? "active" : ""}
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                )}
                {page === "leads" && (
                  <div className="filter-bar" data-testid="leads-status-filter-bar">
                    {[
                      ["all", "All"],
                      ["active", "Active"],
                      ["draft", "Needs details"],
                      ["closed", "Deal closed"],
                      ["lost", "Deal lost"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setLeadStatusFilter(id)}
                        className={leadStatusFilter === id ? "active" : ""}
                      >
                        {t(label)}
                      </button>
                    ))}
                  </div>
                )}
                {page === "followups" && followupTable(followups)}
                {page === "customers" &&
                  (data?.customers.length ? (
                    <div className="customer-grid">
                      {data.customers.map((customer) => (
                        <button
                          className="customer-card"
                          key={customer.id}
                          onClick={() => {
                            setQuery(customer.phone);
                            navigate("leads");
                            setQuery(customer.phone);
                          }}
                        >
                          <div className="customer-top">
                            <span className="avatar">
                              {initials(customer.name)}
                            </span>
                            <ArrowUpRight size={17} />
                          </div>
                          <h3>{customer.name}</h3>
                          {customer.serial && (
                            <small className="serial">{customer.serial}</small>
                          )}
                          <p className="phone" dir="ltr">
                            {customer.phone}
                          </p>
                          <div className="customer-requirements">
                            <small>{t("Requirements")}</small>
                            <p>{customer.requirements}</p>
                          </div>
                          <span className="customer-footer">
                            {t("Linked inquiries")}
                            <strong>{customer.leadCount}</strong>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={t("No records to show")}
                      text={t(
                        "Submitting a lead automatically adds its customer here.",
                      )}
                    />
                  ))}
                {page === "leads" &&
                  (visibleLeads.length ? (
                    <div className="table-scroll">
                      <table data-testid="staff-leads-table">
                        <thead>
                          <tr>
                            <th>{t("Customer")}</th>
                            <th>{t("Requirements")}</th>
                            <th>{t("Call date and time")}</th>
                            <th>{t("Status")}</th>
                            <th>{t("Action")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleLeads.map((lead) => (
                            <tr key={lead.id}>
                              <td>
                                <strong>
                                  {lead.customerName || t("New inquiry")}
                                </strong>
                                <small className="serial">{lead.serial}</small>
                                <small dir="ltr">{lead.phone}</small>
                                {lead.projectName && (
                                  <small>
                                    Project: {lead.projectName}{" "}
                                    {lead.apartmentNumber || ""}
                                  </small>
                                )}
                              </td>
                              <td>
                                <p className="truncate-text">
                                  {lead.requirements || "—"}
                                </p>
                              </td>
                              <td>
                                {format(lead.callAt)}
                                <small>
                                  {t(
                                    lead.source === "provider"
                                      ? "Provider event"
                                      : "Manual entry",
                                  )}
                                </small>
                              </td>
                              <td>{badge(lead.status)}</td>
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    setModal({
                                      kind:
                                        lead.status === "draft"
                                          ? "entry"
                                          : "detail",
                                      item: lead,
                                    })
                                  }
                                >
                                  {t(
                                    lead.status === "draft"
                                      ? "Complete entry"
                                      : "Open",
                                  )}
                                  <ArrowUpRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title={t("No records to show")}
                      text={t("Record your first call to create a lead.")}
                    />
                  ))}
                {(page === "tasks" || page === "team") &&
                  (data?.tasks.length ? (
                    <div className="task-list">
                      {data.tasks.map((task) => (
                        <button
                          className="task-row"
                          key={task.id}
                          onClick={() => setModal({ kind: "task", item: task })}
                        >
                          <span className="task-check">
                            <ClipboardList size={17} />
                          </span>
                          <span className="task-row-title">
                            <strong>{task.title}</strong>
                            <small>
                              {task.assignedBy} · {format(task.deadlineAt)}
                              {task.projectName ? ` · ${task.projectName}` : ""}
                            </small>
                          </span>
                          {badge(task.priority)}
                          {badge(taskState(task, data.serverTime))}
                          <ArrowUpRight size={17} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={t("No records to show")}
                      text={t(
                        "Assigned tasks appear here with a priority and deadline.",
                      )}
                    />
                  ))}
                <div className="pagination">
                  <span>
                    {t("Page")} {number + 1} · {t("Up to 25 records")}
                  </span>
                  <div>
                    <button
                      className="icon-button"
                      disabled={!number || loading}
                      onClick={() => setNumber((n) => n - 1)}
                      aria-label={t("Previous")}
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <button
                      className="icon-button"
                      disabled={
                        loading ||
                        Math.max(
                          data?.leads.length || 0,
                          data?.followups.length || 0,
                          data?.customers.length || 0,
                          data?.tasks.length || 0,
                        ) < 25
                      }
                      onClick={() => setNumber((n) => n + 1)}
                      aria-label={t("Next")}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
              {page === "followups" && (
                <p className="below-note">
                  <Clock3 size={15} />
                  {t(
                    "Feedback is due within 24 hours of the scheduled time.",
                  )}{" "}
                  {t("Late feedback remains in the activity history.")}
                </p>
              )}
              {page === "team" && manager && (
                <div className="team-action" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    className="button secondary"
                    data-testid="create-department-btn"
                    onClick={() => setModal({ kind: "department" })}
                  >
                    <Building2 size={17} />
                    {t("Create department")}
                  </button>
                  <button
                    className="button secondary"
                    data-testid="create-agent-btn"
                    onClick={() => setModal({ kind: "staff" })}
                  >
                    <UserRound size={17} />
                    {t("Create agent")}
                  </button>
                </div>
              )}
            </>
          )}
          {page === "profile" && (
            <div className="profile-grid">
              <section className="panel profile-card">
                <span className="avatar large gold">
                  {initials(session.user.name)}
                </span>
                <h2>{session.user.name}</h2>
                <p>{t(roleLabel)}</p>
                <p>{t("All times in Kabul · UTC+04:30")}</p>
                <button
                  className="button secondary"
                  onClick={() =>
                    client
                      .logout()
                      .then(() => {
                        setSession(null);
                        setData(null);
                      })
                      .catch((e) => setError(e.message))
                  }
                >
                  <LogOut size={16} />
                  {t("Sign out")}
                </button>
              </section>
              <PasswordForm
                t={t}
                done={() => {
                  setSession(null);
                  setData(null);
                }}
              />
            </div>
          )}
          <footer className="page-footer">
            <span>© {new Date().getFullYear()} Attaie Properties</span>
            <span>
              <ShieldCheck size={13} />
              {t("Private staff workspace")}
            </span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          title={t(
            {
              entry: "New entry",
              feedback: "Feedback",
              task: "Task details",
              detail: "Activity history",
              assign: "Assign task",
              staff: "Create agent",
              department: "Create department",
            }[modal.kind],
          )}
          close={() => setModal(null)}
          t={t}
        >
          {modal.kind === "entry" ? (
            <EntryForm
              t={t}
              item={modal.item as Lead | undefined}
              users={data?.assignees || []}
              projects={data?.projects || []}
              self={session.user}
              done={complete}
            />
          ) : modal.kind === "feedback" ? (
            <FeedbackForm
              t={t}
              task={modal.item as Followup}
              users={data?.assignees || []}
              projects={data?.projects || []}
              self={session.user}
              done={complete}
              format={format}
            />
          ) : modal.kind === "assign" ? (
            <AssignForm
              t={t}
              users={data?.assignees || []}
              projects={data?.projects || []}
              done={complete}
            />
          ) : modal.kind === "staff" ? (
            <StaffForm
              t={t}
              departments={data?.departments || []}
              done={complete}
            />
          ) : modal.kind === "department" ? (
            <DepartmentForm t={t} done={complete} />
          ) : modal.kind === "task" ? (
            <TaskDetail
              t={t}
              task={modal.item as ManagementTask}
              self={session.user}
              done={complete}
              format={format}
            />
          ) : (
            <LeadDetail t={t} id={modal.item!.id} format={format} />
          )}
        </Modal>
      )}
    </div>
  );
}

function pageFromPath(): Page {
  const part = location.pathname.replace(/\/$/, "").split("/").pop();
  return [
    "followups",
    "customers",
    "leads",
    "tasks",
    "team",
    "projects",
    "contracts",
    "finance",
    "marketing",
    "submissions",
    "deliverables",
    "profile",
  ].includes(part || "")
    ? (part as Page)
    : "overview";
}
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}
type Translate = (s: string) => string;
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <span>
        <ClipboardList size={23} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Modal({
  title,
  children,
  close,
  t,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  t: Translate;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement as HTMLElement);
  useEffect(() => {
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      opener.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button className="icon-button" aria-label={t("Close")} onClick={close}>
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function useSubmission(done: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key = useRef({ body: "", key: crypto.randomUUID() });
  const submit = async (
    body: unknown,
    operation: (key: string) => Promise<unknown>,
  ) => {
    if (busy) return;
    const serialized = JSON.stringify(body);
    if (key.current.body !== serialized)
      key.current = { body: serialized, key: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      await operation(key.current.key);
      await done();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id: string }>, {
            id,
          })
        : children}
    </div>
  );
}
function FormError({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      <AlertCircle size={16} />
      {message}
    </p>
  ) : null;
}
function Agents({
  users,
  self,
  t,
}: {
  users: StaffUser[];
  self: StaffUser;
  t: Translate;
}) {
  return (
    <Field label={t("Next agent")}>
      <select name="nextAssigneeId" defaultValue={self.id} required>
        {[self, ...users.filter((u) => u.id !== self.id)]
          .filter(
            (u) =>
              u.id === self.id ||
              (self.role === "callcenter"
                ? u.role === "sales"
                : u.role === "callcenter" || u.role === "sales"),
          )
          .map((u) => (
            <option key={u.id} value={u.id}>
              {u.id === self.id ? t("Follow up myself") : u.name}
            </option>
          ))}
      </select>
    </Field>
  );
}
function toUtc(value: FormDataEntryValue | null) {
  if (!value) throw new Error("Choose a date and time.");
  return new Date(`${value}:00+04:30`).toISOString();
}
function localInputNow() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kabul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(" ", "T");
}
function EntryForm({
  t,
  item,
  users,
  projects,
  self,
  done,
}: {
  t: Translate;
  item?: Lead;
  users: StaffUser[];
  projects: InventoryProject[];
  self: StaffUser;
  done: () => Promise<void>;
}) {
  const draft = useRef<Lead | undefined>(item);
  const draftKey = useRef(crypto.randomUUID());
  const { busy, error, submit } = useSubmission(done);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = {
          customerName: String(f.get("customerName")),
          requirements: String(f.get("requirements")),
          nextScheduledAt: toUtc(f.get("nextScheduledAt")),
          nextAssigneeId: Number(f.get("nextAssigneeId")),
          projectId: f.get("projectId") ? Number(f.get("projectId")) : undefined,
        };
        void submit(body, async (key) => {
          if (!draft.current)
            draft.current = await client.draft(
              {
                phone: f.get("phone"),
                callAt: toUtc(f.get("callAt")),
                source: f.get("source") || "manual",
                projectId: body.projectId,
              },
              draftKey.current,
            );
          return client.entry(
            draft.current.id,
            { ...body, version: draft.current.version },
            key,
          );
        });
      }}
    >
      <p className="form-description">
        {t("This entry creates a customer and schedules the next follow-up.")}
      </p>
      {item && <p className="serial form-serial">{item.serial}</p>}
      <div className="form-grid">
        <Field label={t("Customer name")}>
          <input
            name="customerName"
            required
            maxLength={160}
            autoComplete="name"
          />
        </Field>
        <Field label={t("Phone")}>
          <input
            name="phone"
            required
            defaultValue={item?.phone}
            readOnly={!!draft.current}
            placeholder="07…"
            dir="ltr"
            inputMode="tel"
          />
        </Field>
      </div>
      {!item && (
        <div className="form-grid">
          <Field label={`${t("Call date and time")} · Kabul`}>
            <input
              type="datetime-local"
              name="callAt"
              required
              defaultValue={localInputNow()}
              readOnly={!!draft.current}
            />
          </Field>
          <Field label={t("Pre-Sale Project (Optional)")}>
            <select name="projectId" defaultValue="">
              <option value="">General Inquiry</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      {self.role === "sales" && (
        <Field label={t("Lead Source")}>
          <select name="source" defaultValue="walk_in">
            <option value="walk_in">Walk-in</option>
            <option value="direct_call">Direct Call</option>
            <option value="company_referral">Company Referral</option>
            <option value="callcenter">Call Center Handoff</option>
            <option value="social_media">Social Media</option>
          </select>
        </Field>
      )}
      <Field label={t("Requirements")}>
        <textarea
          name="requirements"
          required
          rows={4}
          maxLength={4000}
          placeholder={t(
            "Describe the property, budget, location, and customer’s priorities.",
          )}
        />
      </Field>
      <div className="form-grid">
        <Field label={`${t("Next follow-up")} · Kabul`}>
          <input
            type="datetime-local"
            name="nextScheduledAt"
            required
            min={localInputNow()}
          />
        </Field>
        <Agents users={users} self={self} t={t} />
      </div>
      <p className="form-note">
        <AlertCircle size={14} />
        {t(
          "Call time is entered manually; this is not a verified provider event.",
        )}
      </p>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {busy ? t("Saving…") : t("Save entry")}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
function FeedbackForm({
  t,
  task,
  users,
  projects,
  self,
  done,
  format,
}: {
  t: Translate;
  task: Followup;
  users: StaffUser[];
  projects: InventoryProject[];
  self: StaffUser;
  done: () => Promise<void>;
  format: (s: string) => string;
}) {
  const [outcome, setOutcome] = useState<
    "followup" | "visit" | "closed" | "lost"
  >("followup");
  const [selectedProjId, setSelectedProjId] = useState<number>(
    projects[0]?.id || 1,
  );
  const selectedProj =
    projects.find((p) => p.id === selectedProjId) || projects[0];
  const { busy, error, submit } = useSubmission(done);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body: Feedback = {
          outcome,
          version: task.version,
          ...(outcome === "lost"
            ? { reason: String(f.get("notes")) }
            : outcome === "closed"
              ? {
                  amount: String(f.get("amount")),
                  currency: String(f.get("currency")) as "AFN" | "USD",
                  projectId: Number(f.get("projectId")),
                  apartmentId: Number(f.get("apartmentId")),
                  buyerPhotoUrl: String(f.get("buyerPhotoUrl")),
                  tazkiraPhotoUrl: String(f.get("tazkiraPhotoUrl")),
                }
              : {
                  notes: String(f.get("notes")),
                  nextScheduledAt: toUtc(f.get("nextScheduledAt")),
                  nextAssigneeId: Number(f.get("nextAssigneeId")),
                }),
        };
        void submit(body, (key) => client.feedback(task.id, body, key));
      }}
    >
      <div className="form-customer">
        <span className="avatar">{initials(task.customerName)}</span>
        <div>
          <strong>{task.customerName}</strong>
          <small className="serial">{task.serial}</small>
        </div>
        <span className="badge normal">{format(task.scheduledAt)}</span>
      </div>
      <Field label={t("Outcome")}>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as typeof outcome)}
        >
          <option value="followup">{t("Follow up")}</option>
          <option value="visit">{t("Visit")}</option>
          {self.role === "sales" && (
            <option value="closed">{t("Deal closed")}</option>
          )}
          <option value="lost">{t("Deal lost")}</option>
        </select>
      </Field>

      {outcome === "closed" ? (
        <div className="form-grid">
          <Field label={t("Select Pre-Sale Project")}>
            <select
              name="projectId"
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Select Apartment Unit")}>
            <select name="apartmentId">
              {(selectedProj?.apartments || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.unitNumber} ({a.areaSqm} m² • ${a.totalPrice.toLocaleString()})
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("Agreed Total Amount")}>
            <input
              name="amount"
              type="number"
              step="0.01"
              defaultValue={selectedProj?.apartments[0]?.totalPrice || 120000}
              required
            />
          </Field>
          <Field label={t("Currency")}>
            <select name="currency" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="AFN">AFN</option>
            </select>
          </Field>
          <Field label={t("Buyer 3×4 Portrait Photo URL")}>
            <input name="buyerPhotoUrl" defaultValue="/logo.png" required />
          </Field>
          <Field label={t("Buyer Tazkira Photo URL")}>
            <input name="tazkiraPhotoUrl" defaultValue="/logo.png" required />
          </Field>
        </div>
      ) : (
        <>
          <Field label={t(outcome === "lost" ? "Reason for loss" : "Feedback")}>
            <textarea name="notes" required rows={4} maxLength={4000} />
          </Field>
          {outcome !== "lost" && (
            <div className="form-grid">
              <Field label={`${t("Next follow-up")} · Kabul`}>
                <input
                  type="datetime-local"
                  name="nextScheduledAt"
                  min={localInputNow()}
                  required
                />
              </Field>
              <Agents users={users} self={self} t={t} />
            </div>
          )}
        </>
      )}

      <p className="form-note">
        {t(
          outcome === "lost"
            ? "This lead will be completed. No next follow-up is required."
            : outcome === "closed"
              ? "Generates Deal Closed serial (SA01PRC-Project-Apt-DDMMYY) and sends handoff to HR Contracts."
              : "Feedback is due within 24 hours of the scheduled time.",
        )}
      </p>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {busy ? t("Saving…") : t("Submit feedback")}
        <Check size={17} />
      </button>
    </form>
  );
}
function AssignForm({
  t,
  users,
  projects,
  done,
}: {
  t: Translate;
  users: StaffUser[];
  projects: InventoryProject[];
  done: () => Promise<void>;
}) {
  const { busy, error, submit } = useSubmission(done);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = {
          title: String(f.get("title")),
          instructions: String(f.get("instructions")),
          priority: String(f.get("priority")),
          assigneeId: Number(f.get("assigneeId")),
          projectId: f.get("projectId") ? Number(f.get("projectId")) : undefined,
          deadlineAt: toUtc(f.get("deadlineAt")),
        };
        void submit(body, (key) => client.createTask(body, key));
      }}
    >
      <Field label={t("Task title")}>
        <input name="title" required maxLength={200} />
      </Field>
      <Field label={t("Instructions")}>
        <textarea name="instructions" rows={4} required maxLength={4000} />
      </Field>
      <div className="form-grid">
        <Field label={t("Assign to")}>
          <select name="assigneeId" required>
            <option value="">{t("Select an agent")}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABELS[u.role] || u.role})
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Priority")}>
          <select name="priority" defaultValue="normal">
            {["low", "normal", "high", "urgent"].map((p) => (
              <option value={p} key={p}>
                {t(labels[p])}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-grid">
        <Field label={`${t("Deadline")} · Kabul`}>
          <input
            type="datetime-local"
            name="deadlineAt"
            required
            min={localInputNow()}
          />
        </Field>
        <Field label={t("Linked Pre-Sale Project (Optional)")}>
          <select name="projectId" defaultValue="">
            <option value="">General Office Task</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="form-note">
        {t(
          "This task has an explicit deadline, without a 24-hour grace period.",
        )}
      </p>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {busy ? t("Saving…") : t("Assign task")}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
function TaskDetail({
  t,
  task,
  self,
  done,
  format,
}: {
  t: Translate;
  task: ManagementTask;
  self: StaffUser;
  done: () => Promise<void>;
  format: (s: string) => string;
}) {
  const { busy, error, submit } = useSubmission(done);
  const own = task.assigneeId === self.id;
  const active = !["completed", "cancelled"].includes(task.status);
  return (
    <div className="detail">
      <h3>{task.title}</h3>
      <p className="preserve-lines">{task.instructions}</p>
      <dl>
        <div>
          <dt>{t("Assigned by")}</dt>
          <dd>{task.assignedBy}</dd>
        </div>
        <div>
          <dt>{t("Priority")}</dt>
          <dd>{t(labels[task.priority])}</dd>
        </div>
        <div>
          <dt>{t("Deadline")}</dt>
          <dd>{format(task.deadlineAt)}</dd>
        </div>
        <div>
          <dt>{t("Status")}</dt>
          <dd>{t(labels[taskState(task)])}</dd>
        </div>
      </dl>
      <p className="form-note">
        {t(
          "This task has an explicit deadline, without a 24-hour grace period.",
        )}
      </p>
      <FormError message={error} />
      {own && active && (
        <div className="form-grid">
          {task.status === "todo" && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                submit({ status: "in_progress" }, (key) =>
                  client.taskStatus(task.id, "in_progress", task.version, key),
                )
              }
            >
              {t("Start task")}
            </button>
          )}
          <button
            className="button"
            disabled={busy}
            onClick={() =>
              submit({ status: "completed" }, (key) =>
                client.taskStatus(task.id, "completed", task.version, key),
              )
            }
          >
            <CheckCheck size={16} />
            {t("Mark complete")}
          </button>
        </div>
      )}
    </div>
  );
}
function LeadDetail({
  t,
  id,
  format,
}: {
  t: Translate;
  id: number;
  format: (s: string) => string;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    client
      .lead(id)
      .then((l) => {
        if (active) setLead(l);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  return (
    <div className="detail">
      <FormError message={error} />
      {!lead && !error ? (
        <p>{t("Loading your workspace…")}</p>
      ) : (
        lead && (
          <>
            <div className="form-customer">
              <span className="avatar">
                {initials(lead.customerName || "New inquiry")}
              </span>
              <div>
                <h3>{lead.customerName || t("New inquiry")}</h3>
                <small className="serial">{lead.serial}</small>
              </div>
            </div>
            <p dir="ltr">{lead.phone}</p>
            <h4>{t("Requirements")}</h4>
            <p className="preserve-lines">{lead.requirements}</p>
            {lead.deal && (
              <>
                <h4>{t("Deal closed")}</h4>
                <dl>
                  {lead.deal.dealSerial && (
                    <div>
                      <dt>Deal Serial</dt>
                      <dd>{lead.deal.dealSerial}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{t("Deal amount")}</dt>
                    <dd>
                      {lead.deal.currency} {lead.deal.amount}
                    </dd>
                  </div>
                  <div>
                    <dt>{t("Sales agent")}</dt>
                    <dd>{lead.deal.salesAgent}</dd>
                  </div>
                  <div>
                    <dt>{t("Completed")}</dt>
                    <dd>{format(lead.deal.closedAt)}</dd>
                  </div>
                </dl>
              </>
            )}
            <h4>{t("Activity history")}</h4>
            <div className="timeline">
              {lead.activities?.map((a) => (
                <div key={a.id}>
                  <span className="timeline-dot" />
                  <strong>{a.actorName}</strong>
                  <small>
                    {format(a.at)} · {t(a.type.replaceAll("_", " "))}
                  </small>
                  <p className="preserve-lines">{a.notes}</p>
                </div>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
function DepartmentForm({
  t,
  done,
}: {
  t: Translate;
  done: () => Promise<void>;
}) {
  const { busy, error, submit } = useSubmission(done);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = {
          code: String(f.get("code")),
          name: String(f.get("name")),
        };
        void submit(body, () => client.createDepartment(body));
      }}
    >
      <Field label={t("Department Code")}>
        <input name="code" required maxLength={60} placeholder="legal_affairs" />
      </Field>
      <Field label={t("Department Name")}>
        <input name="name" required maxLength={120} placeholder="Legal & Compliance" />
      </Field>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {t("Save Department")}
      </button>
    </form>
  );
}
function StaffForm({
  t,
  departments,
  done,
}: {
  t: Translate;
  departments: Array<{ code: string; name: string }>;
  done: () => Promise<void>;
}) {
  const { busy, error, submit } = useSubmission(done);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const body = Object.fromEntries(f);
        void submit(body, (key) => client.createStaff(body, key));
      }}
    >
      <Field label={t("Name")}>
        <input name="name" required maxLength={120} />
      </Field>
      <p>
        {t(
          "Create the account in Firebase first, then enter its exact UID and email here.",
        )}
      </p>
      <Field label={t("Email")}>
        <input
          name="username"
          type="email"
          autoComplete="off"
          required
          maxLength={254}
        />
      </Field>
      <Field label={t("Firebase UID")}>
        <input
          name="firebaseUid"
          autoComplete="off"
          required
          maxLength={128}
        />
      </Field>
      <div className="form-grid">
        <Field label={t("Department")}>
          <select name="departmentCode" defaultValue="sales">
            {departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("Role")}>
          <select name="role" defaultValue="callcenter">
            {SWITCHABLE_ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {t("Create agent")}
      </button>
    </form>
  );
}
function PasswordForm({ t }: { t: Translate; done: () => void }) {
  const [sent, setSent] = useState(false);
  const { busy, error, submit } = useSubmission(async () => {
    setSent(true);
  });
  return (
    <form
      className="panel profile-card"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        void submit({}, () => client.resetPassword(String(form.get("email"))));
      }}
    >
      <h2>{t("Security")}</h2>
      <p>{t("Reset your password by email.")}</p>
      <Field label={t("Email")}>
        <input name="email" type="email" autoComplete="email" required />
      </Field>
      <FormError message={error} />
      {sent && (
        <p role="status">
          {t("If the account exists, a password reset email has been sent.")}
        </p>
      )}
      <button className="button" disabled={busy}>
        {t("Send reset email")}
      </button>
    </form>
  );
}
function Login({
  t,
  error,
  onLogin,
  management,
}: {
  t: Translate;
  error: string;
  onLogin: (s: Session) => void;
  management: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  return (
    <div className="login-screen">
      <div className="login-brand">
        <AttaieLogoEntrance mode="header" variant="teal" />
        <span>{t("Workspace")}</span>
      </div>
      <main className="login-card">
        <span className="login-icon">
          <Headphones size={25} />
        </span>
        <div className="eyebrow">ATTAIE PROPERTIES</div>
        <h1>{t(management ? "Staff management" : "Welcome back.")}</h1>
        <p>
          {t(
            management
              ? "Sign in to support your team."
              : "Sign in to your call center workspace.",
          )}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setFailure("");
            try {
              onLogin(
                await client.login(
                  String(f.get("username")),
                  String(f.get("password")),
                ),
              );
            } catch (err) {
              setFailure((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={t("Email")}>
            <input
              name="username"
              type="email"
              autoComplete="username"
              required
            />
          </Field>
          <Field label={t("Password")}>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <FormError message={t(failure || error)} />
          <button className="button full" disabled={busy}>
            {t(busy ? "Signing in…" : "Sign in")}
            <ArrowRight size={16} />
          </button>
        </form>
        <details>
          <summary>{t("Forgot password?")}</summary>
          <PasswordForm t={t} done={() => {}} />
        </details>
        {__STAFF_PREVIEW_ALLOWED__ && (
          <a className="preview-link" href={`${base}/?preview=1`}>
            Explore sample workspace <ArrowUpRight size={14} />
          </a>
        )}
        <p className="login-private">
          <ShieldCheck size={14} />
          {t("Private, authorized staff access only")}
        </p>
      </main>
      <footer>Attaie Properties · Kabul, Afghanistan</footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
