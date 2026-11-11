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
} from "lucide-react";
import type {
  DashboardData,
  Followup,
  Lead,
  ManagementTask,
  Session,
  StaffUser,
  Feedback,
} from "../../../packages/staff-contracts/types";
import {
  feedbackDeadline,
  followupState,
  taskState,
} from "../../../packages/staff-contracts/workflow.mjs";
import { api } from "./api";
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
  | "profile";
const isPreview =
  __STAFF_PREVIEW_ALLOWED__ &&
  new URLSearchParams(location.search).get("preview") === "1";
const management = __STAFF_PREVIEW_ALLOWED__
  ? location.pathname.startsWith("/management")
  : __STAFF_ROLE__ === "management";
document.documentElement.dataset.staffRole = management ? "management" : "callcenter";
const base = management ? "/management" : "/callcenter";
const client: Client = isPreview
  ? ((await import("./preview").then((m) =>
      m.previewClient(management),
    )) as Client)
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
const fa: Record<string, string> = management ? (await import("./i18n/fa.json")).default : {};

function App() {
  const [language, setLanguage] = useState<"en" | "fa">(() =>
    management && localStorage.getItem("staff-language") === "fa" ? "fa" : "en",
  );
  const t = useCallback(
    (s: string) => (language === "fa" ? fa[s] || s : s),
    [language],
  );
  const [session, setSession] = useState<Session | null>(null);
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
    kind: "entry" | "feedback" | "task" | "detail" | "assign" | "staff";
    item?: Lead | Followup | ManagementTask;
  } | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    if (management) localStorage.setItem("staff-language", language);
  }, [language]);
  useEffect(() => {
    client
      .session()
      .then((s) => setSession(s.user ? s : null))
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
    const timer = window.setTimeout(refresh, 250);
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
  const format = (value: string) =>
    new Intl.DateTimeFormat(language === "fa" ? "fa-AF" : "en-GB", {
      timeZone: "Asia/Kabul",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  const badge = (value: string) => (
    <span className={`badge ${value}`}>{t(labels[value] || value)}</span>
  );
  const manager = !!session && ["admin", "ceo"].includes(session.user.role);
  const complete = async () => {
    setModal(null);
    setNotice(t("Saved successfully."));
    await refresh();
  };
  const tabs: { id: Page; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    ...(manager
      ? []
      : [
          { id: "followups" as Page, label: "Follow-ups", icon: CalendarClock },
          { id: "customers" as Page, label: "Customers", icon: Users },
          { id: "leads" as Page, label: "Leads", icon: PhoneIncoming },
        ]),
    { id: "tasks", label: "My Tasks", icon: ClipboardList },
    ...(manager
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
    profile: ["Profile", "Your workspace preferences and security."],
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
          setSession(s);
          setError("");
        }}
        management={management}
      />
    );
  if (
    (management && !manager) ||
    (!management && session.user.role !== "callcenter")
  )
    return (
      <div className="center-screen">
        <ShieldCheck size={36} />
        <h1>{t("This account does not have access to this workspace.")}</h1>
        <button
          className="button"
          onClick={() =>
            client.logout().then(() => {
              setSession(null);
              setData(null);
            }).catch(e => setError(e.message))
          }
        >
          {t("Sign out")}
        </button>
      </div>
    );
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
            <strong>{t(manager ? "Management" : "Call Center")}</strong>
            <small>ATTAIE PROPERTIES</small>
          </span>
        </div>
        <p className="nav-caption">{t("WORKSPACE")}</p>
        <nav aria-label={t("Workspace")}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
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
              <small>{t(manager ? "Management" : "Call center")}</small>
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
            <span>{t(manager ? "Management" : "Call Center")}</span>
            <span className="crumb-divider">/</span>
            <strong>{t(headings[page][0])}</strong>
          </div>
          <div className="topbar-actions">
            <span className="timezone">Kabul · UTC+04:30</span>
            {management && <button
              className="language-toggle"
              onClick={() => setLanguage(language === "en" ? "fa" : "en")}
            >
              <Globe size={15} />
              {language === "en" ? "دری" : "English"}
            </button>}
            <span className="avatar small gold">
              {initials(session.user.name)}
            </span>
          </div>
        </header>
        {isPreview && (
          <div className="preview-banner">
            <span>
              <strong>{t("Sample preview")}</strong> ·{" "}
              {t(
                "No real calls or customer data. Changes last only in this preview.",
              )}
            </span>
            <a href={base + "/"}>{t("Exit preview")}</a>
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
              {manager ? (
                <button
                  className="button"
                  onClick={() => setModal({ kind: "assign" })}
                >
                  <Plus size={17} />
                  {t("Assign task")}
                </button>
              ) : (
                <button
                  className="button"
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
                    target: "leads" as Page,
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
                    target: "followups" as Page,
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
                    target: "followups" as Page,
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
          {page !== "overview" && page !== "profile" && (
            <>
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
                  <span className="list-note">
                    <SlidersHorizontal size={15} />
                    {t("Your permitted records")}
                  </span>
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
                  (data?.leads.length ? (
                    <div className="table-scroll">
                      <table>
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
                          {data.leads.map((lead) => (
                            <tr key={lead.id}>
                              <td>
                                <strong>
                                  {lead.customerName || t("New inquiry")}
                                </strong>
                                <small className="serial">{lead.serial}</small>
                                <small dir="ltr">{lead.phone}</small>
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
                <div className="team-action">
                  <button
                    className="button secondary"
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
                <p>{t(manager ? "Management" : "Call center")}</p>
                <p>{t("All times in Kabul · UTC+04:30")}</p>
                <button
                  className="button secondary"
                  onClick={() =>
                    client.logout().then(() => {
                      setSession(null);
                      setData(null);
                    }).catch(e => setError(e.message))
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
              self={session.user}
              done={complete}
            />
          ) : modal.kind === "feedback" ? (
            <FeedbackForm
              t={t}
              task={modal.item as Followup}
              users={data?.assignees || []}
              self={session.user}
              done={complete}
              format={format}
            />
          ) : modal.kind === "assign" ? (
            <AssignForm t={t} users={data?.assignees || []} done={complete} />
          ) : modal.kind === "staff" ? (
            <StaffForm t={t} done={complete} />
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
        {[self, ...users.filter(u => u.id !== self.id)]
          .filter(
            (u) =>
              u.id === self.id ||
              (self.role === "callcenter"
                ? u.role === "sales"
                : u.role === "callcenter"),
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
  self,
  done,
}: {
  t: Translate;
  item?: Lead;
  users: StaffUser[];
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
        };
        void submit(body, async (key) => {
          if (!draft.current)
            draft.current = await client.draft(
              { phone: f.get("phone"), callAt: toUtc(f.get("callAt")) },
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
        <Field label={`${t("Call date and time")} · Kabul`}>
          <input
            type="datetime-local"
            name="callAt"
            required
            defaultValue={localInputNow()}
            readOnly={!!draft.current}
          />
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
  self,
  done,
  format,
}: {
  t: Translate;
  task: Followup;
  users: StaffUser[];
  self: StaffUser;
  done: () => Promise<void>;
  format: (s: string) => string;
}) {
  const [outcome, setOutcome] = useState<"followup" | "visit" | "lost">(
    "followup",
  );
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
          <option value="lost">{t("Deal lost")}</option>
        </select>
      </Field>
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
      <p className="form-note">
        {t(
          outcome === "lost"
            ? "This lead will be completed. No next follow-up is required."
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
  done,
}: {
  t: Translate;
  users: StaffUser[];
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
                {u.name}
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
      <Field label={`${t("Deadline")} · Kabul`}>
        <input
          type="datetime-local"
          name="deadlineAt"
          required
          min={localInputNow()}
        />
      </Field>
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
                submit({ status: "in_progress" }, key =>
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
              submit({ status: "completed" }, key =>
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
            {lead.deal && <><h4>{t("Deal closed")}</h4><dl><div><dt>{t("Deal amount")}</dt><dd>{lead.deal.currency} {lead.deal.amount}</dd></div><div><dt>{t("Sales agent")}</dt><dd>{lead.deal.salesAgent}</dd></div><div><dt>{t("Completed")}</dt><dd>{format(lead.deal.closedAt)}</dd></div></dl></>}
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
function StaffForm({ t, done }: { t: Translate; done: () => Promise<void> }) {
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
      <p>{t("Create the account in Firebase first, then enter its exact UID and email here.")}</p>
      <Field label={t("Email")}>
        <input name="username" type="email" autoComplete="off" required maxLength={254} />
      </Field>
      <Field label={t("Firebase UID")}>
        <input name="firebaseUid" autoComplete="off" required maxLength={128} />
      </Field>
      <Field label={t("Role")}>
        <select name="role">
          <option value="callcenter">{t("Call center")}</option>
          <option value="sales">
            {t("Sales agent")} · {t("Dashboard not released")}
          </option>
        </select>
      </Field>
      <FormError message={error} />
      <button className="button full" disabled={busy}>
        {t("Create agent")}
      </button>
    </form>
  );
}
function PasswordForm({ t }: { t: Translate; done: () => void }) {
  const [sent, setSent] = useState(false);
  const { busy, error, submit } = useSubmission(async () => { setSent(true); });
  return <form className="panel profile-card" onSubmit={e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    void submit({}, () => client.resetPassword(String(form.get("email"))));
  }}>
    <h2>{t("Security")}</h2>
    <p>{t("Reset your password by email.")}</p>
    <Field label={t("Email")}><input name="email" type="email" autoComplete="email" required /></Field>
    <FormError message={error} />
    {sent && <p role="status">{t("If the account exists, a password reset email has been sent.")}</p>}
    <button className="button" disabled={busy}>{t("Send reset email")}</button>
  </form>;
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
        <img src={logo} alt="Attaie Properties" />
        <span>{t("Workspace")}</span>
      </div>
      <main className="login-card">
        <span className="login-icon">
          <Headphones size={25} />
        </span>
        <div className="eyebrow">ATTAIE PROPERTIES</div>
        <h1>{t(management ? "Staff management" : "Welcome back.")}</h1>
        <p>
          {t(management
            ? "Sign in to support your team."
            : "Sign in to your call center workspace.")}
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
            <input name="username" type="email" autoComplete="username" required />
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
        <details><summary>{t("Forgot password?")}</summary><PasswordForm t={t} done={() => {}} /></details>
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
