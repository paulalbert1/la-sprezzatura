import { actions } from "astro:actions";
import { useState } from "react";

interface Props {
  projectId: string;
  artifactKey: string;
  versionKey: string;
}

type Status =
  | "idle"
  | "approve-dialog"
  | "changes-dialog"
  | "submitting"
  | "success"
  | "error";

export default function ArtifactApprovalForm({
  projectId,
  artifactKey,
  versionKey,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleApprove() {
    setStatus("submitting");
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("artifactKey", artifactKey);
    formData.set("versionKey", versionKey);
    formData.set("confirmed", "true");
    const { error } = await actions.approveArtifact(formData);

    if (error) {
      setErrorMessage(
        "Something went wrong. Please try again or contact liz@lasprezz.com.",
      );
      setStatus("error");
    } else {
      setSuccessMessage("Approval recorded");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  async function handleRequestChanges() {
    setStatus("submitting");
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("artifactKey", artifactKey);
    formData.set("versionKey", versionKey);
    formData.set("feedback", feedback);
    const { error } = await actions.requestArtifactChanges(formData);

    if (error) {
      setErrorMessage(
        "Something went wrong. Please try again or contact liz@lasprezz.com.",
      );
      setStatus("error");
    } else {
      setSuccessMessage("Feedback submitted");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  if (status === "success") {
    return (
      <div className="py-3">
        <p className="text-sm text-stone font-body">{successMessage}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-3">
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-3"
          role="alert"
        >
          {errorMessage}
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setErrorMessage("");
          }}
          className="text-xs text-terracotta hover:text-terracotta-light transition-colors font-body"
        >
          Try again
        </button>
      </div>
    );
  }

  if (status === "approve-dialog") {
    return (
      <div className="py-3 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 accent-terracotta"
          />
          <span className="text-xs text-charcoal font-body leading-relaxed">
            I confirm this approval on behalf of all parties associated with
            this project.
          </span>
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!confirmed || status === "submitting"}
            onClick={handleApprove}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Confirm Approval
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setConfirmed(false);
            }}
            className="text-xs text-stone hover:text-terracotta transition-colors font-body underline underline-offset-2"
          >
            Keep Reviewing
          </button>
        </div>
      </div>
    );
  }

  if (status === "changes-dialog") {
    return (
      <div className="py-3 space-y-3">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-stone mb-2 block font-body">
            What changes would you like?
          </span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full bg-cream-dark text-charcoal border border-stone-light px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-0 focus:border-terracotta"
            placeholder="Describe the changes you'd like..."
          />
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!feedback.trim() || status === "submitting"}
            onClick={handleRequestChanges}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Submit Feedback
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setFeedback("");
            }}
            className="text-xs text-stone hover:text-terracotta transition-colors font-body underline underline-offset-2"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (status === "submitting") {
    return (
      <div className="py-3">
        <button
          type="button"
          disabled
          className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 opacity-60 cursor-not-allowed"
        >
          Submitting...
        </button>
      </div>
    );
  }

  // Idle state: show both action buttons
  return (
    <div className="py-3 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setStatus("approve-dialog")}
        className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 hover:bg-terracotta-light transition-colors"
      >
        Approve Version
      </button>
      <button
        type="button"
        onClick={() => setStatus("changes-dialog")}
        className="border border-stone-light text-stone text-xs uppercase tracking-widest font-body px-6 py-3 hover:border-terracotta/40 hover:text-terracotta transition-colors"
      >
        Request Changes
      </button>
    </div>
  );
}
