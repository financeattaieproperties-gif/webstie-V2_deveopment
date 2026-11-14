import React from "react";
import {
  ArrowUpRight,
  CalendarClock,
  Clock3,
  MessageCircle,
  Phone,
  PhoneCall,
} from "lucide-react";
import type { Followup, Lead } from "../../../../packages/staff-contracts/types";
import {
  feedbackDeadline,
  followupState,
} from "../../../../packages/staff-contracts/workflow.mjs";
import { formatMobileContactLinks } from "../../../../packages/staff-contracts/role-preference.mjs";

type Translate = (s: string) => string;

function initialsOf(name: string) {
  return (name || "NI")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

const STATUS_DOT_COLOR: Record<string, string> = {
  active: "#0F172A",
  due: "#2563EB",
  draft: "#D97706",
  overtime: "#DC2626",
  closed: "#059669",
  completed: "#059669",
  completed_late: "#D97706",
  lost: "#DC2626",
  upcoming: "#64748B",
};

export function MobileLeadCardList({
  leads,
  t,
  format,
  statusLabel,
  onSelectLead,
}: {
  leads: Lead[];
  t: Translate;
  format: (s: string) => string;
  statusLabel: (status: string) => string;
  onSelectLead: (lead: Lead, kind: "entry" | "detail") => void;
}) {
  return (
    <div className="mobile-card-feed" data-testid="mobile-leads-card-feed">
      {leads.map((lead) => {
        const contact = formatMobileContactLinks(lead.phone);
        const dotColor = STATUS_DOT_COLOR[lead.status] || "#64748B";
        const isDraft = lead.status === "draft";
        return (
          <article
            key={lead.id}
            className="crm-mobile-card"
            data-testid={`mobile-lead-card-${lead.id}`}
          >
            <div className="crm-mobile-card-head">
              <div className="crm-mobile-card-identity">
                <span className="avatar">
                  {initialsOf(lead.customerName || t("New inquiry"))}
                </span>
                <div className="crm-mobile-card-titles">
                  <strong>{lead.customerName || t("New inquiry")}</strong>
                  <div className="crm-mobile-card-meta">
                    <span className="serial">{lead.serial}</span>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr">{contact.display}</span>
                  </div>
                </div>
              </div>
              <span className="crm-status-inline">
                <span
                  className="crm-status-dot"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                {t(statusLabel(lead.status))}
              </span>
            </div>

            {lead.projectName && (
              <div className="crm-mobile-card-project">
                {t("Project")}: <strong>{lead.projectName}</strong>{" "}
                {lead.apartmentNumber || ""}
              </div>
            )}

            <p className="crm-mobile-card-body">
              {lead.requirements || t("No requirements recorded yet.")}
            </p>

            <div className="crm-mobile-card-subrow">
              <span>{format(lead.callAt)}</span>
              <span aria-hidden="true">·</span>
              <span>
                {t(
                  lead.source === "provider"
                    ? "Provider event"
                    : "Manual entry",
                )}
              </span>
            </div>

            <div className="crm-mobile-card-actions">
              {contact.telHref && (
                <a
                  href={contact.telHref}
                  className="crm-action-btn"
                  aria-label={`${t("Call")} ${lead.customerName || lead.phone}`}
                >
                  <Phone size={15} />
                  <span>{t("Call")}</span>
                </a>
              )}
              {contact.whatsappHref && (
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="crm-action-btn"
                  aria-label={`WhatsApp ${lead.customerName || lead.phone}`}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                className={`crm-action-btn ${isDraft ? "primary" : ""}`}
                onClick={() =>
                  onSelectLead(lead, isDraft ? "entry" : "detail")
                }
              >
                <span>{t(isDraft ? "Complete entry" : "Open")}</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function MobileFollowupCardList({
  followups,
  serverTime,
  t,
  format,
  statusLabel,
  onSelectFollowup,
}: {
  followups: Followup[];
  serverTime?: string;
  t: Translate;
  format: (s: string) => string;
  statusLabel: (status: string) => string;
  onSelectFollowup: (
    item: Followup,
    kind: "feedback" | "detail",
  ) => void;
}) {
  return (
    <div className="mobile-card-feed" data-testid="mobile-followups-card-feed">
      {followups.map((item) => {
        const state = followupState(item, serverTime);
        const dotColor = STATUS_DOT_COLOR[state] || "#64748B";
        const contact = formatMobileContactLinks(item.phone);
        const isDone = Boolean(item.completedAt);
        return (
          <article
            key={item.id}
            className="crm-mobile-card"
            data-testid={`mobile-followup-card-${item.id}`}
          >
            <div className="crm-mobile-card-head">
              <div className="crm-mobile-card-identity">
                <span className="avatar">
                  {initialsOf(item.customerName)}
                </span>
                <div className="crm-mobile-card-titles">
                  <strong>{item.customerName}</strong>
                  <div className="crm-mobile-card-meta">
                    <span className="serial">{item.serial}</span>
                    {item.projectName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.projectName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <span className="crm-status-inline">
                <span
                  className="crm-status-dot"
                  style={{ backgroundColor: dotColor }}
                  aria-hidden="true"
                />
                {t(statusLabel(state))}
              </span>
            </div>

            {item.requirements && (
              <p className="crm-mobile-card-body">{item.requirements}</p>
            )}

            <div className="crm-mobile-followup-times">
              <span>
                <CalendarClock size={13} />
                {t("Scheduled")}: <strong>{format(item.scheduledAt)}</strong>
              </span>
              <span>
                <Clock3 size={13} />
                {t("Deadline")}:{" "}
                <strong>{format(feedbackDeadline(item.scheduledAt))}</strong>
              </span>
            </div>

            <div className="crm-mobile-card-actions">
              {contact.telHref && (
                <a
                  href={contact.telHref}
                  className="crm-action-btn"
                  aria-label={`${t("Call")} ${item.customerName}`}
                >
                  <PhoneCall size={15} />
                  <span>{t("Call")}</span>
                </a>
              )}
              <button
                type="button"
                className={`crm-action-btn ${!isDone ? "primary" : ""}`}
                onClick={() =>
                  onSelectFollowup(item, isDone ? "detail" : "feedback")
                }
              >
                <span>{t(isDone ? "Open" : "Feedback")}</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
