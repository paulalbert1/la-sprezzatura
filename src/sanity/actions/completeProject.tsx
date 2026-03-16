import { useState } from "react";
import { useDocumentOperation, type DocumentActionProps } from "sanity";

export function CompleteProjectAction(props: DocumentActionProps) {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const doc = props.draft || props.published;

  // Only show for active or reopened projects (not already completed)
  if (props.type !== "project" || doc?.projectStatus === "completed")
    return null;

  return {
    label: "Complete Project",
    tone: "positive" as const,
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen
      ? {
          type: "confirm" as const,
          onCancel: () => setDialogOpen(false),
          onConfirm: () => {
            patch.execute([
              {
                set: {
                  projectStatus: "completed",
                  completedAt: new Date().toISOString(),
                },
              },
            ]);
            publish.execute();
            setDialogOpen(false);
            props.onComplete();
          },
          message: (
            <div>
              <p>
                <strong>This will:</strong>
              </p>
              <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                <li>Mark the project as completed</li>
                <li>Start the 30-day portal visibility countdown</li>
                <li>
                  Disable client actions on the portal (approvals, notes)
                </li>
              </ul>
              <p
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "#666",
                }}
              >
                You can reopen the project later if needed.
              </p>
            </div>
          ),
        }
      : undefined,
  };
}
