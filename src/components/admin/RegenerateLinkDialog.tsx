import { useState, type ReactNode } from "react";
import { AlertTriangle, Copy, Loader2 } from "lucide-react";
import AdminModal from "./ui/AdminModal";
import { useToast } from "./ui/ToastContainer";

// Phase 34 Plan 05 Task 2 — RegenerateLinkDialog
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md §
//     "3. Per-client PURL regenerate control" (lines 347-386)
//   - .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-22
//
// Confirmation dialog that triggers the POST /api/admin/clients action
// `regenerate-portal-token`. Built on the Wave 1 AdminModal primitive with
// `size="sm"` (max-w-[440px]) and a destructive-red primary button — one of
// the few places this admin surface uses destructive red for a primary,
// justified by the irreversibility of the action (any active PURL session
// for this client gets killed across all their projects).
//
// On success, the new /portal/client/{token} URL is surfaced via an
// 8-second AdminToast that embeds a Copy link button. Clicking Copy flips
// the button label to "Copied ✓" for 1.5s.

export interface RegenerateLinkDialogProps {
  open: boolean;
  onClose: () => void;
  client: { _id: string; name: string };
  baseUrl?: string;
}

// Default site base URL. import.meta.env.SITE is populated by Astro's
// `site` config entry; fall back to the canonical production origin so
// tests and SSR-free renders get a sane value.
const DEFAULT_BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { SITE?: string } }).env?.SITE) ||
  "https://lasprezz.com";

export default function RegenerateLinkDialog({
  open,
  onClose,
  client,
  baseUrl = DEFAULT_BASE_URL,
}: RegenerateLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regenerate-portal-token",
          clientId: client._id,
        }),
      });
      if (!res.ok) {
        throw new Error(`Regenerate failed (${res.status})`);
      }
      const data = (await res.json()) as { portalToken?: string };
      if (!data.portalToken) {
        throw new Error("Regenerate response missing portalToken");
      }
      const newUrl = `${baseUrl}/portal/client/${data.portalToken}`;

      show({
        variant: "success",
        title: `New link generated for ${client.name}`,
        body: (
          <div className="flex flex-col gap-2">
            <span
              className="truncate"
              style={{
                fontSize: "12px",
                color: "#6B5E52",
                fontFamily: "var(--font-sans)",
              }}
            >
              {newUrl}
            </span>
            <CopyLinkButton url={newUrl} />
          </div>
        ),
        duration: 8000,
      });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("regenerate-portal-token failed:", err);
      setLoading(false);
      setError("Could not regenerate. Please try again.");
    }
  };

  const handleCancel = () => {
    if (loading) return;
    onClose();
  };

  const body: ReactNode = (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={20}
          color="#9B3A2A"
          aria-hidden="true"
          className="shrink-0 mt-0.5"
        />
        <p
          style={{
            fontSize: "13px",
            color: "#6B5E52",
            lineHeight: 1.6,
            fontFamily: "var(--font-sans)",
            margin: 0,
          }}
        >
          This invalidates the current link across ALL this client's projects.
          Any existing bookmarked links will stop working immediately. The
          client will need to receive the new link via a Send Update before
          they can access their dashboard again.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          data-regenerate-error
          style={{
            fontSize: "12px",
            color: "#9B3A2A",
            backgroundColor: "#FBEEE8",
            border: "0.5px solid #E8C9C0",
            borderRadius: "6px",
            padding: "8px 10px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );

  const footer: ReactNode = (
    <>
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        style={{
          fontSize: "13px",
          color: "#6B5E52",
          backgroundColor: "transparent",
          border: "0.5px solid #D4C8B8",
          padding: "7px 14px",
          borderRadius: "6px",
          fontFamily: "var(--font-sans)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.5 : 1,
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={loading}
        data-regenerate-confirm
        className="inline-flex items-center gap-2"
        style={{
          fontSize: "13px",
          fontWeight: 600,
          // Destructive primary per UI-SPEC line 370 — irreversible action
          // justifies red primary here.
          color: "#FFFEFB",
          backgroundColor: "#9B3A2A",
          border: "0.5px solid #9B3A2A",
          padding: "8px 20px",
          borderRadius: "6px",
          fontFamily: "var(--font-sans)",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Regenerating...
          </>
        ) : (
          "Regenerate link"
        )}
      </button>
    </>
  );

  return (
    <AdminModal
      open={open}
      onClose={handleCancel}
      title={`Regenerate personal link for ${client.name}?`}
      size="sm"
      disableDismiss={loading}
      footer={footer}
    >
      {body}
    </AdminModal>
  );
}

// Local CopyLinkButton. Lives in the same file so the toast body can
// embed it via ReactNode without a separate import surface. The 1.5s
// "Copied ✓" flip is the only user-facing feedback — no extra toast.
export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error("clipboard.writeText failed:", err);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 self-start"
      style={{
        fontSize: "12px",
        color: "#9A7B4B",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
      }}
    >
      <Copy size={12} aria-hidden="true" />
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
