import { useState, useMemo, type ReactNode } from "react";
import { Check, ExternalLink, Loader2, Mail } from "lucide-react";
import AdminModal from "./ui/AdminModal";
import { useToast } from "./ui/ToastContainer";

// Phase 34 Plan 04 Task 3 — SendUpdateModal
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 3
//   - .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Send Update modal
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-13..D-17
//
// React modal for composing a project update email. Built on the Wave 1
// AdminModal primitive. Default checkbox states per D-15:
//   - Milestones: ON
//   - Procurement: ON only when engagementType='full-interior-design' AND
//     procurementItems.length > 0 (otherwise the row is hidden)
//   - Pending reviews: OFF (intentional — prevents deadline pressure)
//   - Personal link toggle: ON (usePersonalLinks default true per D-17)
//
// Send flow hits POST /api/send-update; Preview opens GET /api/send-update/preview
// in a new tab via window.open with `noopener,noreferrer`.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendUpdateModalClient {
  _id: string;
  name: string;
  email: string;
}

export interface SendUpdateModalProject {
  _id: string;
  title: string;
  engagementType: string;
  clients: SendUpdateModalClient[];
  milestones: { total: number; upcoming: number };
  procurement: { items: number; delivered: number };
  pendingReviews: { count: number };
}

export interface SendUpdateModalProps {
  open: boolean;
  onClose: () => void;
  project: SendUpdateModalProject;
}

// ---------------------------------------------------------------------------
// Small custom checkbox row — NOT a native input because UI-SPEC line 309 calls
// for a 16×16 bordered box with a gold fill and lucide Check glyph on check.
// ---------------------------------------------------------------------------

interface SectionCheckboxRowProps {
  label: ReactNode;
  meta: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  testId?: string;
}

function SectionCheckboxRow({
  label,
  meta,
  checked,
  onChange,
  disabled = false,
  testId,
}: SectionCheckboxRowProps) {
  const opacity = disabled ? 0.5 : 1;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      data-testid={testId}
      className="w-full flex items-center gap-3 text-left"
      style={{
        minHeight: "44px",
        padding: "12px 0",
        borderBottom: "0.5px solid #E8DDD0",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity,
        border: "none",
        fontFamily: "var(--font-sans)",
      }}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center shrink-0"
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          border: "0.5px solid #D4C8B8",
          backgroundColor: checked ? "#9A7B4B" : "transparent",
          transition: "background-color 150ms ease",
        }}
      >
        {checked ? (
          <Check size={12} strokeWidth={3} color="#FFFEFB" />
        ) : null}
      </span>
      <span
        style={{
          fontSize: "13px",
          color: "#2C2520",
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "11.5px",
          color: "#9E8E80",
          fontWeight: 400,
        }}
      >
        · {meta}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Personal-link toggle — 32×18 track + 14×14 thumb, gold on, stone off.
// ---------------------------------------------------------------------------

interface PersonalLinkToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
}

function PersonalLinkToggle({ checked, onChange }: PersonalLinkToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      aria-label="Send each recipient their personal portal link"
      style={{
        position: "relative",
        width: 32,
        height: 18,
        borderRadius: 9,
        backgroundColor: checked ? "#9A7B4B" : "#D4C8B8",
        border: "none",
        cursor: "pointer",
        transition: "background-color 150ms ease",
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 16 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transition: "left 150ms ease",
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export default function SendUpdateModal({
  open,
  onClose,
  project,
}: SendUpdateModalProps) {
  const { show } = useToast();

  // State
  const [personalNote, setPersonalNote] = useState("");
  const [includeMilestones, setIncludeMilestones] = useState(true);
  // Procurement is only shown at all when the engagement supports it AND items exist
  const showProcurementRow = useMemo(
    () =>
      project.engagementType === "full-interior-design" &&
      project.procurement.items > 0,
    [project.engagementType, project.procurement.items],
  );
  const [includeProcurement, setIncludeProcurement] = useState(
    () => showProcurementRow,
  );
  const [includePendingReviews, setIncludePendingReviews] = useState(false); // D-15
  const [usePersonalLinks, setUsePersonalLinks] = useState(true); // D-17
  const [ccLiz, setCcLiz] = useState(true); // CC liz@lasprezz.com on all sends
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recipients = project.clients;
  const hasRecipients = recipients.length > 0;

  const handlePreview = () => {
    const params = new URLSearchParams();
    params.set("projectId", project._id);
    if (personalNote) params.set("note", personalNote);
    params.set(
      "sections",
      JSON.stringify({
        milestones: includeMilestones,
        procurement: showProcurementRow ? includeProcurement : false,
        artifacts: includePendingReviews, // D-15 mapping: modal "pending reviews" → API "artifacts"
      }),
    );
    params.set("usePersonalLinks", String(usePersonalLinks));
    const url = `/api/send-update/preview?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSend = async () => {
    if (!hasRecipients || sending) return;
    setSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/send-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project._id,
          note: personalNote,
          sections: {
            milestones: includeMilestones,
            procurement: showProcurementRow ? includeProcurement : false,
            artifacts: includePendingReviews, // D-15 mapping
          },
          usePersonalLinks,
          ccLiz,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || "Send failed");
      }
      const data = (await res.json()) as { recipientCount?: number };
      const count = data.recipientCount ?? recipients.length;
      show({
        variant: "success",
        title: `Update sent to ${count} ${count === 1 ? "recipient" : "recipients"}`,
      });
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Could not send. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  // Footer actions — rendered into AdminModal `footer` prop.
  const footer = (
    <div
      data-send-update-footer
      className="flex items-center justify-between w-full"
    >
      <button
        type="button"
        onClick={handlePreview}
        disabled={sending}
        className="inline-flex items-center gap-1.5 transition-colors"
        style={{
          fontSize: "13px",
          color: "#6B5E52",
          background: "transparent",
          border: "none",
          padding: "0",
          cursor: sending ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)",
          textDecoration: "none",
        }}
        onMouseEnter={(e) => {
          if (!sending) e.currentTarget.style.textDecoration = "underline";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = "none";
        }}
      >
        Preview email
        <ExternalLink size={14} />
      </button>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={sending}
          className="luxury-secondary-btn"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !hasRecipients}
          data-testid="send-update-send-button"
          className="inline-flex items-center gap-2 transition-colors"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#FFFEFB",
            backgroundColor: sending ? "#C4A97A" : "#9A7B4B",
            padding: "8px 20px",
            borderRadius: "6px",
            border: "none",
            cursor:
              sending || !hasRecipients ? "not-allowed" : "pointer",
            fontFamily: "var(--font-sans)",
            opacity: !hasRecipients ? 0.5 : 1,
          }}
        >
          {sending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail size={14} />
              Send update
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Send project update"
      size="md"
      disableDismiss={sending}
      footer={footer}
    >
      <div data-send-update-body>
        {/* Recipients */}
        <div className="mb-4">
          <div
            style={{
              fontSize: "11.5px",
              color: "#6B5E52",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 500,
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Recipients
          </div>
          {hasRecipients ? (
            <div
              data-send-update-recipients
              className="flex flex-wrap gap-[7px]"
            >
              {recipients.map((c) => (
                <span
                  key={c._id}
                  className="inline-flex items-center gap-[6px] rounded-full"
                  style={{
                    backgroundColor: "#F3EDE3",
                    padding: "5px 11px",
                    border: "0.5px solid #D4C8B8",
                    fontSize: "12.5px",
                    color: "#2C2520",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {c.name}
                  <span style={{ color: "#9E8E80", fontSize: "11.5px" }}>
                    {c.email}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div
              data-send-update-no-clients
              style={{
                fontSize: "12px",
                color: "#9B3A2A",
                fontFamily: "var(--font-sans)",
              }}
            >
              This project has no clients assigned — assign clients before
              sending updates.
            </div>
          )}
        </div>

        {/* Personal note */}
        <div className="mb-4">
          <label
            htmlFor="send-update-note"
            style={{
              display: "block",
              fontSize: "11.5px",
              color: "#6B5E52",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 500,
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Personal note (optional)
          </label>
          <textarea
            id="send-update-note"
            rows={4}
            className="luxury-input w-full"
            placeholder="Hi, here's the latest on your project..."
            value={personalNote}
            onChange={(e) => setPersonalNote(e.target.value)}
            disabled={sending}
            style={{
              resize: "vertical",
              fontFamily: "var(--font-sans)",
            }}
          />
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "11px",
              color: "#9E8E80",
              fontFamily: "var(--font-sans)",
            }}
          >
            Appears at the top of the email, above the status sections.
          </p>
        </div>

        {/* Sections to include */}
        <div className="mb-4">
          <div
            style={{
              fontSize: "11.5px",
              color: "#6B5E52",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 500,
              marginBottom: "4px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Include in this update
          </div>
          <SectionCheckboxRow
            label="Milestones"
            meta={`${project.milestones.total} total, ${project.milestones.upcoming} upcoming`}
            checked={includeMilestones}
            onChange={setIncludeMilestones}
            disabled={project.milestones.total === 0}
            testId="section-milestones"
          />
          {showProcurementRow ? (
            <SectionCheckboxRow
              label="Procurement"
              meta={`${project.procurement.items} items, ${project.procurement.delivered} delivered`}
              checked={includeProcurement}
              onChange={setIncludeProcurement}
              testId="section-procurement"
            />
          ) : null}
          <SectionCheckboxRow
            label="Pending reviews"
            meta={`${project.pendingReviews.count} awaiting approval`}
            checked={includePendingReviews}
            onChange={setIncludePendingReviews}
            disabled={project.pendingReviews.count === 0}
            testId="section-pending-reviews"
          />
        </div>

        {/* Personal link toggle */}
        <div
          className="mb-2"
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "0.5px solid #E8DDD0",
          }}
        >
          <div className="flex items-center gap-3">
            <PersonalLinkToggle
              checked={usePersonalLinks}
              onChange={setUsePersonalLinks}
            />
            <label
              style={{
                fontSize: "13px",
                color: "#2C2520",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
              onClick={() => setUsePersonalLinks(!usePersonalLinks)}
            >
              Send each recipient their personal portal link
            </label>
          </div>
          <p
            style={{
              margin: "6px 0 0 44px",
              fontSize: "11px",
              color: "#9E8E80",
              fontFamily: "var(--font-sans)",
            }}
          >
            Each client gets a unique dashboard link for all their projects.
            Turn off to send the generic portal link.
          </p>

          {/* CC Liz toggle — default checked */}
          <div className="flex items-center gap-3" style={{ marginTop: "12px" }}>
            <PersonalLinkToggle checked={ccLiz} onChange={setCcLiz} />
            <label
              style={{
                fontSize: "13px",
                color: "#2C2520",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
              onClick={() => setCcLiz(!ccLiz)}
            >
              CC liz@lasprezz.com
            </label>
          </div>
          <p
            style={{
              margin: "6px 0 0 44px",
              fontSize: "11px",
              color: "#9E8E80",
              fontFamily: "var(--font-sans)",
            }}
          >
            Keep yourself on every send.
          </p>
        </div>

        {/* Error banner */}
        {errorMsg ? (
          <div
            data-send-update-error
            role="alert"
            style={{
              marginTop: "16px",
              padding: "6px 12px",
              backgroundColor: "#FBEEE8",
              color: "#9B3A2A",
              fontSize: "13px",
              borderRadius: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            {errorMsg}
          </div>
        ) : null}
      </div>
    </AdminModal>
  );
}
