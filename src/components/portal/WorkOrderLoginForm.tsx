import { actions } from "astro:actions";
import { useState } from "react";

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  errorMessage?: string;
  submittedEmail?: string;
  emailError?: string;
}

export default function WorkOrderLoginForm({
  initialError,
  contactEmail = "office@lasprezz.com",
}: {
  initialError?: string;
  contactEmail?: string;
}) {
  const [state, setState] = useState<FormState>({
    status: "idle",
    errorMessage: initialError,
  });
  const [email, setEmail] = useState("");

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return "Please enter a valid email address";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email address";
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailErr = validateEmail(email);
    if (emailErr) {
      setState((prev) => ({ ...prev, emailError: emailErr }));
      return;
    }

    setState({ status: "submitting" });

    const formData = new FormData();
    formData.set("email", email.trim().toLowerCase());

    const { error } = await actions.requestContractorMagicLink(formData);

    if (error) {
      const message =
        error.code === "TOO_MANY_REQUESTS"
          ? "Too many requests. Please wait a few minutes and try again."
          : `Something went wrong. Please try again or contact ${contactEmail}.`;
      setState({ status: "error", errorMessage: message });
    } else {
      setState({ status: "success", submittedEmail: email.trim() });
    }
  }

  // Success state: replace form with confirmation
  if (state.status === "success") {
    return (
      <div className="text-center">
        <h2 className="font-heading text-4xl md:text-5xl font-light text-charcoal mb-4">
          Check Your Email
        </h2>
        <p className="text-stone font-body leading-relaxed mb-6">
          We've sent a secure access link to{" "}
          <span className="text-charcoal font-medium">{state.submittedEmail}</span>.
          Click the link in your email to sign in. The link expires in 15 minutes.
        </p>
        <p className="text-sm text-stone font-body">
          Didn't receive an email? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setState({ status: "idle" })}
            className="text-terracotta hover:text-terracotta-light transition-colors underline underline-offset-2"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  // Form state (idle, submitting, error)
  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm mx-auto">
      {/* Error banner */}
      {state.status === "error" && state.errorMessage && (
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-6"
          role="alert"
        >
          {state.errorMessage}
        </div>
      )}

      {/* Expired link error from query param */}
      {state.status === "idle" && state.errorMessage && (
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-6"
          role="alert"
        >
          {state.errorMessage}
        </div>
      )}

      {/* Email field */}
      <div className="mb-6">
        <label
          htmlFor="workorder-login-email"
          className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
        >
          Email Address
        </label>
        <input
          id="workorder-login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.emailError) setState((prev) => ({ ...prev, emailError: undefined }));
          }}
          onBlur={() => {
            if (email) {
              const err = validateEmail(email);
              if (err) setState((prev) => ({ ...prev, emailError: err }));
            }
          }}
          className={`w-full bg-cream-dark text-charcoal border px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-0 ${
            state.emailError
              ? "border-terracotta"
              : "border-stone-light focus:border-terracotta"
          }`}
          placeholder="you@example.com"
        />
        {state.emailError && (
          <p className="mt-1 text-xs text-terracotta font-body" role="alert">
            {state.emailError}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={state.status === "submitting"}
        className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-10 py-4 w-full hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state.status === "submitting" ? "Sending\u2026" : "Send Access Link"}
      </button>

      {/* Help text */}
      <p className="text-sm text-stone text-center mt-6 font-body">
        We'll send a secure access link to your email
      </p>
    </form>
  );
}
