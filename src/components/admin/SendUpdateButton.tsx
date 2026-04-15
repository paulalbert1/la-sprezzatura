import { useState } from "react";
import { Mail } from "lucide-react";
import ToastContainer from "./ui/ToastContainer";
import SendUpdateModal, {
  type SendUpdateModalProject,
} from "./SendUpdateModal";

// Phase 34 Plan 04 Task 3 — SendUpdateButton
// Source of truth:
//   - .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 3
//   - .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Send Update modal trigger
//
// Astro-friendly React island: owns modal open state, renders the
// .luxury-secondary-btn trigger, and hydrates its own ToastContainer so the
// success/error toasts from the modal have a live useToast() provider
// inside THIS island's React tree. (The global ToastContainer in
// AdminLayout.astro is a sibling island; contexts don't cross island
// boundaries, so a local provider is required.)

export interface SendUpdateButtonProps {
  project: SendUpdateModalProject;
  senderSettings: {
    defaultFromEmail: string;
    defaultCcEmail: string;
  };
}

export default function SendUpdateButton({
  project,
  senderSettings,
}: SendUpdateButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <ToastContainer>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="luxury-secondary-btn"
        data-testid="send-update-trigger"
      >
        <Mail className="w-4 h-4" />
        Send Update
      </button>
      <SendUpdateModal
        open={open}
        onClose={() => setOpen(false)}
        project={project}
        senderSettings={senderSettings}
      />
    </ToastContainer>
  );
}
