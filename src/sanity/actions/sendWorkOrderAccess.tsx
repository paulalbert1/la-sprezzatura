import { useState } from "react";
import { type DocumentActionProps } from "sanity";

export function SendWorkOrderAccessAction(props: DocumentActionProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const doc = props.draft || props.published;

  // Only show for contractor documents
  if (props.type !== "contractor") return null;

  const contractorName = (doc as any)?.name || "this contractor";
  const contractorEmail = (doc as any)?.email || "no email on file";

  return {
    label: "Send Work Order Access",
    tone: "primary" as const,
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen
      ? {
          type: "dialog" as const,
          onClose: () => {
            setDialogOpen(false);
          },
          header: "Send Work Order Access",
          content: (
            <div style={{ padding: "16px" }}>
              <p
                style={{
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Send a magic link to {contractorName} at {contractorEmail}?
              </p>
              <p
                style={{
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                They will receive an email with access to their work order portal.
              </p>
              <button
                disabled={sending}
                onClick={async () => {
                  setSending(true);
                  try {
                    const response = await fetch("/api/send-workorder-access", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        contractorId: props.id,
                      }),
                    });
                    if (!response.ok) throw new Error("Failed to send");
                    setDialogOpen(false);
                    props.onComplete();
                  } catch (err) {
                    console.error("Send work order access failed:", err);
                  } finally {
                    setSending(false);
                  }
                }}
                style={{
                  backgroundColor: sending ? "#ccc" : "#C4836A",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: sending ? "not-allowed" : "pointer",
                  width: "100%",
                }}
              >
                {sending ? "Sending..." : "Send Access Link"}
              </button>
            </div>
          ),
        }
      : undefined,
  };
}
