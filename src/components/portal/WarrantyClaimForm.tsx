import { actions } from "astro:actions";
import { useState } from "react";

interface Props {
  projectId: string;
  contactEmail?: string;
}

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  errorMessage?: string;
}

export default function WarrantyClaimForm({
  projectId,
  contactEmail = "office@lasprezz.com",
}: Props) {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (description.length < 10) return;

    setState({ status: "submitting" });

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("description", description);
    if (photo) {
      formData.set("photo", photo);
    }

    const { error } = await actions.submitWarrantyClaim(formData);

    if (error) {
      const message =
        error.code === "TOO_MANY_REQUESTS"
          ? "Too many requests. Please wait a few minutes and try again."
          : `Something went wrong. Please try again or contact ${contactEmail}.`;
      setState({ status: "error", errorMessage: message });
    } else {
      setState({ status: "success" });
    }
  }

  return (
    <section className="py-12 border-t border-stone-light/20">
      <h2 className="font-heading text-xl font-light text-charcoal mb-4">
        Warranty Request
      </h2>
      <p className="text-sm text-stone font-body mb-6">
        Describe the issue and upload a photo if helpful. Liz will review and follow up.
      </p>

      {state.status === "success" ? (
        <p className="text-sm text-stone font-body">
          Warranty request submitted. Liz will be in touch.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          {state.status === "error" && state.errorMessage && (
            <div
              className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-4"
              role="alert"
            >
              {state.errorMessage}
            </div>
          )}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            rows={4}
            className="w-full bg-cream-dark text-charcoal border border-stone-light px-4 py-3 font-body text-sm placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-terracotta mb-4 resize-none"
          />

          {/* Optional photo upload per user decision */}
          <div className="mb-4">
            <label className="block text-xs text-stone font-body uppercase tracking-wider mb-2">
              Photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="block w-full text-sm text-stone font-body file:mr-4 file:py-2 file:px-4 file:border file:border-stone-light file:text-xs file:font-body file:uppercase file:tracking-wider file:bg-cream-dark file:text-charcoal hover:file:bg-stone-light/20 file:cursor-pointer file:transition-colors"
            />
            {photo && (
              <p className="text-xs text-stone font-body mt-1">{photo.name}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={state.status === "submitting" || description.length < 10}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-8 py-3 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {state.status === "submitting" ? "Submitting..." : "Submit Warranty Request"}
          </button>
        </form>
      )}
    </section>
  );
}
