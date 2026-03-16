import { actions } from "astro:actions";
import { useState } from "react";

interface Props {
  projectId: string;
  targetKey: string;
  targetType: "milestone" | "artifact";
}

type Status = "collapsed" | "editing" | "submitting" | "success" | "error";

export default function ClientNoteForm({
  projectId,
  targetKey,
  targetType,
}: Props) {
  const [status, setStatus] = useState<Status>("collapsed");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    setStatus("submitting");
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("text", text);

    let error: unknown;

    if (targetType === "milestone") {
      formData.set("milestoneKey", targetKey);
      const result = await actions.submitMilestoneNote(formData);
      error = result.error;
    } else {
      formData.set("artifactKey", targetKey);
      const result = await actions.submitArtifactNote(formData);
      error = result.error;
    }

    if (error) {
      setErrorMessage(
        "Something went wrong. Please try again or contact liz@lasprezz.com.",
      );
      setStatus("error");
    } else {
      setStatus("success");
      setText("");
      setTimeout(() => setStatus("collapsed"), 3000);
    }
  }

  if (status === "collapsed") {
    return (
      <button
        type="button"
        onClick={() => setStatus("editing")}
        className="text-xs text-terracotta hover:text-terracotta-light transition-colors font-body"
      >
        Add a note
      </button>
    );
  }

  if (status === "success") {
    return (
      <p className="text-sm text-stone font-body py-2">Note submitted</p>
    );
  }

  if (status === "error") {
    return (
      <div className="py-2">
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-3"
          role="alert"
        >
          {errorMessage}
        </div>
        <button
          type="button"
          onClick={() => setStatus("editing")}
          className="text-xs text-terracotta hover:text-terracotta-light transition-colors font-body"
        >
          Try again
        </button>
      </div>
    );
  }

  // Editing or submitting state
  const remaining = 500 - text.length;
  const isSubmitting = status === "submitting";

  return (
    <div className="py-2 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 500))}
        rows={3}
        maxLength={500}
        disabled={isSubmitting}
        className="w-full bg-cream-dark text-charcoal border border-stone-light px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-0 focus:border-terracotta disabled:opacity-60"
        placeholder="Write a note..."
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Note"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("collapsed");
              setText("");
            }}
            disabled={isSubmitting}
            className="text-xs text-stone hover:text-terracotta transition-colors font-body underline underline-offset-2 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
        <span className="text-xs text-stone-light font-body">
          {remaining} / 500
        </span>
      </div>
    </div>
  );
}
