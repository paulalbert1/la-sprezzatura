import { useState } from "react";

interface FormState {
  status: "idle" | "submitting" | "error";
  errorMessage?: string;
  emailError?: string;
  passwordError?: string;
}

export default function AdminLoginForm() {
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return "Please enter a valid email address";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Please enter a valid email address";
    return undefined;
  }

  function validatePassword(value: string): string | undefined {
    if (!value) return "Please enter your password";
    return undefined;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setState((prev) => ({
        ...prev,
        emailError: emailErr,
        passwordError: passwordErr,
      }));
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (response.ok) {
        window.location.href = "/admin/dashboard";
        return;
      }

      let message: string;
      if (response.status === 401) {
        message = "Invalid email or password. Please try again.";
      } else if (response.status === 429) {
        message =
          "Too many login attempts. Please wait a few minutes and try again.";
      } else {
        message = "Something went wrong. Please try again.";
      }

      setState({ status: "error", errorMessage: message });
    } catch {
      setState({
        status: "error",
        errorMessage: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm mx-auto">
      {/* Error banner */}
      {state.status === "error" && state.errorMessage && (
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body mb-6 rounded-lg"
          role="alert"
        >
          {state.errorMessage}
        </div>
      )}

      {/* Email field */}
      <div className="mb-6">
        <label
          htmlFor="admin-email"
          className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
        >
          Email Address
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.emailError)
              setState((prev) => ({ ...prev, emailError: undefined }));
          }}
          onBlur={() => {
            if (email) {
              const err = validateEmail(email);
              if (err) setState((prev) => ({ ...prev, emailError: err }));
            }
          }}
          className={`w-full bg-cream-dark text-charcoal border px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-0 rounded ${
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

      {/* Password field */}
      <div className="mb-6">
        <label
          htmlFor="admin-password"
          className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
        >
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (state.passwordError)
              setState((prev) => ({ ...prev, passwordError: undefined }));
          }}
          className={`w-full bg-cream-dark text-charcoal border px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-0 rounded ${
            state.passwordError
              ? "border-terracotta"
              : "border-stone-light focus:border-terracotta"
          }`}
        />
        {state.passwordError && (
          <p className="mt-1 text-xs text-terracotta font-body" role="alert">
            {state.passwordError}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="mb-6">
        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="bg-terracotta text-white text-xs uppercase tracking-widest font-body px-10 py-4 w-full hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-lg"
        >
          {state.status === "submitting" ? "Signing in\u2026" : "Sign In"}
        </button>
      </div>
    </form>
  );
}
