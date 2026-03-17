import { actions } from "astro:actions";
import { useState } from "react";

interface Props {
  projectId: string;
  assignmentKey: string;
}

type Status = "collapsed" | "editing" | "submitting" | "success" | "error";

export default function ContractorNoteForm({
  projectId,
  assignmentKey,
}: Props) {
  const [status, setStatus] = useState<Status>("collapsed");
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setStatus("submitting");
    try {
      const result = await actions.submitContractorNote({
        projectId,
        assignmentKey,
        text: text.trim(),
      });
      if (result.error) throw new Error(result.error.message);
      setText("");
      setStatus("success");
      setTimeout(() => setStatus("collapsed"), 3000);
    } catch {
      setStatus("error");
    }
  };

  if (status === "collapsed") {
    return (
      <button
        type="button"
        onClick={() => setStatus("editing")}
        className="text-xs text-terracotta hover:text-terracotta-light transition-colors font-body"
      >
        Leave a note for Liz
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
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-4"
          role="alert"
        >
          Something went wrong. Please try again or contact liz@lasprezz.com.
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
  const isSubmitting = status === "submitting";

  return (
    <div className="py-2 space-y-2">
      <textarea
        rows={3}
        maxLength={500}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSubmitting}
        className="w-full bg-cream-dark text-charcoal border border-stone-light px-4 py-3 font-body text-sm focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none resize-none disabled:opacity-60"
        placeholder="Write a note for Liz..."
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={!text.trim() || isSubmitting}
            onClick={handleSubmit}
            className="bg-terracotta text-white text-xs uppercase tracking-widest px-6 py-3 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Note"}
          </button>
          <button
            type="button"
            onClick={() => {
              setText("");
              setStatus("collapsed");
            }}
            disabled={isSubmitting}
            className="text-xs text-stone hover:text-terracotta underline underline-offset-2 transition-colors disabled:opacity-60"
          >
            Discard Note
          </button>
        </div>
        <span className="text-xs text-stone-light">
          {500 - text.length} / 500
        </span>
      </div>
    </div>
  );
}
