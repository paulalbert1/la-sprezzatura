import { useState } from "react";
import { type DocumentActionProps } from "sanity";

export function SendBuildingAccessAction(props: DocumentActionProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const doc = props.draft || props.published;

  // Only show for commercial projects with a building manager email
  if (!(doc as any)?.isCommercial) return null;
  if (!(doc as any)?.buildingManager?.email) return null;

  const managerName = (doc as any)?.buildingManager?.name || "the building manager";
  const managerEmail = (doc as any)?.buildingManager?.email || "no email on file";

  return {
    label: "Send Building Access",
    tone: "primary" as const,
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen
      ? {
          type: "dialog" as const,
          onClose: () => {
            setDialogOpen(false);
          },
          header: "Send Building Access",
          content: (
            <div style={{ padding: "16px" }}>
              <p
                style={{
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Send a magic link to {managerName} at {managerEmail}?
              </p>
              <p
                style={{
                  marginBottom: "16px",
                  fontSize: "12px",
                  color: "#999",
                }}
              >
                They will receive an email with access to the building portal for this project.
              </p>
              <button
                disabled={sending}
                onClick={async () => {
                  setSending(true);
                  try {
                    const response = await fetch("/api/send-building-access", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId: props.id,
                      }),
                    });
                    if (!response.ok) throw new Error("Failed to send");
                    setDialogOpen(false);
                    props.onComplete();
                  } catch (err) {
                    console.error("Send building access failed:", err);
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
