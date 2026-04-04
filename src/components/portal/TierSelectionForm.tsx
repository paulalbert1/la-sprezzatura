import { actions } from "astro:actions";
import { useState } from "react";

type FormState = "idle" | "selecting" | "submitting" | "success" | "error";

interface Props {
  tiers: Array<{ _key: string; name: string }>;
  projectId: string;
  artifactKey: string;
  columns?: number;
}

const EAGERNESS_LABELS = [
  "Just exploring",
  "Considering options",
  "Leaning toward it",
  "Almost there",
  "Ready to start immediately",
];

export default function TierSelectionForm({
  tiers,
  projectId,
  artifactKey,
  columns = 2,
}: Props) {
  const [state, setState] = useState<FormState>("idle");
  const [selectedTierKey, setSelectedTierKey] = useState("");
  const [eagerness, setEagerness] = useState(0);
  const [reservations, setReservations] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedTierName =
    tiers.find((t) => t._key === selectedTierKey)?.name || "";

  async function handleSubmit() {
    setState("submitting");
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("artifactKey", artifactKey);
    formData.append("tierKey", selectedTierKey);
    formData.append("eagerness", eagerness.toString());
    if (reservations) formData.append("reservations", reservations);
    formData.append("confirmed", "true");

    const { error } = await actions.selectTier(formData);

    if (error) {
      setErrorMessage(
        "Something went wrong. Please try again or contact liz@lasprezz.com.",
      );
      setState("error");
    } else {
      setState("success");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  if (state === "success") {
    return (
      <div className="mt-4 pt-4 border-t border-stone-light/20">
        <p className="text-xs text-stone font-body">Selection recorded</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-4 pt-4 border-t border-stone-light/20">
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-xs text-charcoal font-body"
          role="alert"
        >
          {errorMessage}
        </div>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setErrorMessage("");
            setSelectedTierKey("");
            setEagerness(0);
            setReservations("");
            setConfirmed(false);
          }}
          className="text-xs text-terracotta hover:text-terracotta-light transition-colors font-body mt-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (state === "selecting" || state === "submitting") {
    const isSubmitting = state === "submitting";

    return (
      <div className="mt-4 pt-4 border-t border-stone-light/20 space-y-4">
        <p className="text-xs text-charcoal font-body">
          Selected: <span className="font-medium">{selectedTierName}</span>
        </p>

        {/* Eagerness Rating */}
        <div>
          <label className="text-xs uppercase tracking-widest text-stone mb-3 block font-body">
            How eager are you to get started?
          </label>
          <div className="flex items-center gap-3">
            <div
              role="radiogroup"
              aria-label="Eagerness rating"
              className="flex items-center gap-2"
            >
              {EAGERNESS_LABELS.map((label, i) => {
                const value = i + 1;
                const isActive = eagerness >= value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={eagerness === value}
                    aria-label={`${value} - ${label}`}
                    onClick={() => setEagerness(value)}
                    disabled={isSubmitting}
                    className={`w-8 h-8 rounded-full border transition-colors p-0 ${
                      isActive
                        ? "bg-terracotta border-terracotta"
                        : "border-stone-light bg-transparent hover:border-terracotta/40"
                    } disabled:opacity-60`}
                    style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <span className="sr-only">{value}</span>
                  </button>
                );
              })}
            </div>
            {eagerness > 0 && (
              <span className="text-xs text-stone font-body">
                {EAGERNESS_LABELS[eagerness - 1]}
              </span>
            )}
          </div>
        </div>

        {/* Reservations */}
        <div>
          <label className="text-xs uppercase tracking-widest text-stone mb-2 block font-body">
            Any reservations?
          </label>
          <textarea
            value={reservations}
            onChange={(e) => setReservations(e.target.value)}
            rows={3}
            disabled={isSubmitting}
            className="bg-white text-charcoal border border-stone-light px-4 py-3 font-body text-base w-full focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-terracotta disabled:opacity-60"
            placeholder="Share any thoughts or concerns... (optional)"
          />
        </div>

        {/* Confirmation */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isSubmitting}
            className="mt-0.5 accent-terracotta"
          />
          <span className="text-xs text-charcoal font-body leading-relaxed">
            I confirm this selection on behalf of all parties associated with
            this project.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={eagerness === 0 || !confirmed || isSubmitting}
            onClick={handleSubmit}
            className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-6 py-3 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Confirm Selection"}
          </button>
          {!isSubmitting && (
            <button
              type="button"
              onClick={() => {
                setState("idle");
                setSelectedTierKey("");
                setEagerness(0);
                setReservations("");
                setConfirmed(false);
              }}
              className="text-xs text-stone hover:text-terracotta transition-colors font-body underline underline-offset-2"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // Idle state: show select buttons matching the tier card grid
  const gridClass =
    columns === 3
      ? "grid gap-5 grid-cols-1 md:grid-cols-3"
      : "grid gap-5 grid-cols-1 md:grid-cols-2";

  return (
    <div className={`mt-5 ${gridClass}`}>
      {tiers.map((tier) => (
        <button
          key={tier._key}
          type="button"
          onClick={() => {
            setSelectedTierKey(tier._key);
            setState("selecting");
          }}
          className="border border-stone-light/40 text-charcoal text-xs uppercase tracking-widest font-body px-4 py-3 w-full hover:border-terracotta hover:text-terracotta transition-colors bg-transparent cursor-pointer"
        >
          Select {tier.name}
        </button>
      ))}
    </div>
  );
}
