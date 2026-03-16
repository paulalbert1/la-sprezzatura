import { useState } from "react";
import { useDocumentOperation, type DocumentActionProps } from "sanity";

export function ReopenProjectAction(props: DocumentActionProps) {
  const { patch, publish } = useDocumentOperation(props.id, props.type);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const doc = props.draft || props.published;

  // Only show for completed projects
  if (props.type !== "project" || doc?.projectStatus !== "completed")
    return null;

  return {
    label: "Reopen Project",
    tone: "caution" as const,
    onHandle: () => setDialogOpen(true),
    dialog: isDialogOpen
      ? {
          type: "confirm" as const,
          onCancel: () => setDialogOpen(false),
          onConfirm: () => {
            patch.execute([
              {
                set: {
                  projectStatus: "reopened",
                },
                unset: ["completedAt"],
              },
            ]);
            publish.execute();
            setDialogOpen(false);
            props.onComplete();
          },
          message: (
            <div>
              <p>
                This will reopen the project, making it visible to clients
                again and re-enabling warranty submissions.
              </p>
            </div>
          ),
        }
      : undefined,
  };
}
