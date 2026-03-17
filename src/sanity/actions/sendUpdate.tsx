import { useState } from "react";
import { type DocumentActionProps } from "sanity";

export function SendUpdateAction(props: DocumentActionProps) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState("");
  const [milestones, setMilestones] = useState(true);
  const [procurement, setProcurement] = useState(true);
  const [artifacts, setArtifacts] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const doc = props.draft || props.published;

  if (props.type !== "project") return null;

  // Extract data for preview
  const clients = (doc?.clients as any[]) || [];
  const primaryClient =
    clients.find((c: any) => c.isPrimary)?.client?.name ||
    clients[0]?.client?.name ||
    "there";
  const projectTitle = (doc?.title as string) || "your project";
  const milestonesArr = (doc?.milestones as any[]) || [];
  const completedMilestones = milestonesArr.filter(
    (m: any) => m.completed,
  ).length;
  const procurementArr = (doc?.procurementItems as any[]) || [];
  const artifactsArr = (doc?.artifacts as any[]) || [];
  const pendingReviews = artifactsArr.filter(
    (a: any) =>
      a.currentVersionKey &&
      !(a.decisionLog || []).some((d: any) => d.action === "approved"),
  ).length;
  const isFullInterior = doc?.engagementType === "full-interior-design";

  // Frequency warning
  const updateLog = (doc?.updateLog as any[]) || [];
  const lastUpdate = updateLog.length > 0 ? updateLog[updateLog.length - 1] : null;
  let lastUpdateHoursAgo: number | null = null;
  if (lastUpdate?.sentAt) {
    const diff = Date.now() - new Date(lastUpdate.sentAt).getTime();
    lastUpdateHoursAgo = Math.round(diff / (1000 * 60 * 60));
  }

  return {
    label: "Send Update",
    tone: "primary" as const,
    onHandle: () => {
      if (!initialized) {
        setNote(
          `Hi ${primaryClient}, here's the latest on ${projectTitle}.`,
        );
        setInitialized(true);
      }
      setDialogOpen(true);
    },
    dialog: isDialogOpen
      ? {
          type: "dialog" as const,
          onClose: () => {
            setDialogOpen(false);
            setError(false);
          },
          header: "Send Project Update",
          content: (
            <div style={{ padding: "16px" }}>
              {/* Frequency warning */}
              {lastUpdateHoursAgo !== null && lastUpdateHoursAgo < 24 && (
                <div
                  style={{
                    padding: "12px",
                    marginBottom: "16px",
                    backgroundColor: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#92400E",
                  }}
                >
                  Last update sent {lastUpdateHoursAgo} hours ago. Send
                  another?
                </div>
              )}

              {/* Personal note */}
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontSize: "13px",
                  color: "#666",
                  fontWeight: 500,
                }}
              >
                Personal Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "16px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />

              {/* Section toggles */}
              <p
                style={{
                  marginBottom: "8px",
                  fontSize: "13px",
                  color: "#666",
                  fontWeight: 500,
                }}
              >
                Include Sections
              </p>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={milestones}
                    onChange={(e) => setMilestones(e.target.checked)}
                  />
                  Milestones
                </label>
                {isFullInterior && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={procurement}
                      onChange={(e) => setProcurement(e.target.checked)}
                    />
                    Procurement
                  </label>
                )}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={artifacts}
                    onChange={(e) => setArtifacts(e.target.checked)}
                  />
                  Pending Artifact Reviews
                </label>
              </div>

              {/* Preview */}
              <div
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  border: "1px solid #E5E2DE",
                  borderRadius: "4px",
                  backgroundColor: "#FAF8F5",
                  fontSize: "13px",
                  color: "#2C2926",
                }}
              >
                <p style={{ margin: "0 0 8px", fontWeight: 500, fontSize: "12px", color: "#8A8478", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                  Preview
                </p>
                <p style={{ margin: "0 0 6px" }}>
                  {note || <em style={{ color: "#999" }}>No note</em>}
                </p>
                {milestones && milestonesArr.length > 0 && (
                  <p style={{ margin: "0 0 4px" }}>
                    {milestonesArr.length} milestones ({completedMilestones}{" "}
                    complete)
                  </p>
                )}
                {procurement && isFullInterior && procurementArr.length > 0 && (
                  <p style={{ margin: "0 0 4px" }}>
                    {procurementArr.length} procurement items
                  </p>
                )}
                {artifacts && pendingReviews > 0 && (
                  <p style={{ margin: "0 0 4px" }}>
                    {pendingReviews} pending reviews
                  </p>
                )}
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#C4836A",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  View in Your Portal
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  style={{
                    padding: "12px",
                    marginBottom: "16px",
                    backgroundColor: "#FEE2E2",
                    border: "1px solid #EF4444",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#991B1B",
                  }}
                >
                  Unable to send update. Please check your connection and try
                  again.
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setDialogOpen(false);
                    setError(false);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#666",
                  }}
                >
                  Discard
                </button>
                <button
                  disabled={sending}
                  onClick={async () => {
                    setSending(true);
                    setError(false);
                    try {
                      const response = await fetch("/api/send-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          projectId: props.id,
                          note,
                          sections: {
                            milestones,
                            procurement: isFullInterior ? procurement : false,
                            artifacts,
                          },
                        }),
                      });
                      if (!response.ok) throw new Error("Failed to send");
                      setDialogOpen(false);
                      props.onComplete();
                    } catch {
                      setError(true);
                    } finally {
                      setSending(false);
                    }
                  }}
                  style={{
                    flex: 2,
                    backgroundColor: !sending ? "#C4836A" : "#ccc",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: !sending ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {sending ? "Sending..." : "Send Update"}
                </button>
              </div>
            </div>
          ),
        }
      : undefined,
  };
}
