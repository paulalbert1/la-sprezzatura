import { useState } from "react";
import { useDocumentOperation, type DocumentActionProps } from "sanity";

export function NotifyClientAction(props: DocumentActionProps) {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedArtifactKey, setSelectedArtifactKey] = useState<string>("");
  const [sending, setSending] = useState(false);
  const doc = props.draft || props.published;

  // Only show for project documents with artifacts
  if (props.type !== "project" || !doc?.artifacts?.length) return null;

  return {
    label: "Notify Client",
    tone: "primary" as const,
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen
      ? {
          type: "dialog" as const,
          onClose: () => {
            setDialogOpen(false);
            setSelectedArtifactKey("");
          },
          header: "Send Artifact Notification",
          content: (
            <div style={{ padding: "16px" }}>
              <p
                style={{
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "#666",
                }}
              >
                Select an artifact to notify the client about:
              </p>
              <select
                value={selectedArtifactKey}
                onChange={(e) => setSelectedArtifactKey(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="">Select artifact...</option>
                {(doc.artifacts as any[]).map((a: any) => (
                  <option key={a._key} value={a._key}>
                    {a.customTypeName ||
                      (a.artifactType
                        ? a.artifactType.charAt(0).toUpperCase() +
                          a.artifactType.slice(1).replace(/-/g, " ")
                        : "Untitled")}
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedArtifactKey || sending}
                onClick={async () => {
                  setSending(true);
                  try {
                    const response = await fetch("/api/notify-artifact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        projectId: props.id,
                        artifactKey: selectedArtifactKey,
                      }),
                    });
                    if (!response.ok) throw new Error("Failed to send");
                    setDialogOpen(false);
                    setSelectedArtifactKey("");
                    props.onComplete();
                  } catch (err) {
                    console.error("Notification failed:", err);
                  } finally {
                    setSending(false);
                  }
                }}
                style={{
                  backgroundColor:
                    selectedArtifactKey && !sending ? "#C4836A" : "#ccc",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    selectedArtifactKey && !sending
                      ? "pointer"
                      : "not-allowed",
                  width: "100%",
                }}
              >
                {sending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          ),
        }
      : undefined,
  };
}
