import { actions } from "astro:actions";
import { useState, useRef } from "react";

type FormErrors = Partial<Record<string, string>>;

interface FormState {
  status: "idle" | "submitting" | "success" | "error";
  errors: FormErrors;
  errorMessage?: string;
  submittedName?: string;
}

const PROJECT_TYPES = [
  "Full Home Renovation",
  "Kitchen Remodel",
  "Bathroom Remodel",
  "Living Space Redesign",
  "Office / Study",
  "Outdoor Living",
  "Carpet Curation",
  "Refresh & Styling",
  "Other",
];

const BUDGET_RANGES = [
  "Under $25,000",
  "$25,000 \u2013 $50,000",
  "$50,000 \u2013 $100,000",
  "$100,000 \u2013 $250,000",
  "$250,000+",
  "Not sure yet",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-terracotta font-body" role="alert">
      {message}
    </p>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
}

function Field({ label, name, error, required, ...props }: InputProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
      >
        {label}
        {required && <span className="text-terracotta ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        className={`w-full bg-cream-dark text-charcoal border px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-0 ${
          error ? "border-terracotta" : "border-stone-light focus:border-terracotta"
        }`}
        {...props}
      />
      <FieldError message={error} />
    </div>
  );
}

export default function ContactForm({ bookingLink = "https://fantastical.app/design-b1eD/meet-with-elizabeth-olivier" }: { bookingLink?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>({
    status: "idle",
    errors: {},
  });

  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case "name":
        return value.trim() ? undefined : "Name is required";
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? undefined
          : "Valid email required";
      case "projectType":
        return value ? undefined : "Please select a project type";
      case "description":
        return value.trim().length >= 10
          ? undefined
          : "Please describe your project briefly (at least 10 characters)";
      default:
        return undefined;
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setState((prev) => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    // Full validation
    const data = new FormData(form);
    const fields = ["name", "email", "projectType", "description"] as const;
    const errors: FormErrors = {};
    let hasErrors = false;

    for (const field of fields) {
      const value = (data.get(field) as string) || "";
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setState((prev) => ({ ...prev, errors }));
      return;
    }

    setState({ status: "submitting", errors: {} });

    const { error } = await actions.submitContact(data);

    if (error) {
      setState({
        status: "error",
        errors: {},
        errorMessage:
          error.message ||
          "Something went wrong. Please try again or email us directly.",
      });
    } else {
      const name = (data.get("name") as string) || "";
      setState({ status: "success", errors: {}, submittedName: name });
    }
  }

  if (state.status === "success") {
    return (
      <div className="py-16 px-8 text-center" data-animate="fade-up">
        <div className="inline-block mb-6">
          <div className="w-12 h-0.5 bg-terracotta mx-auto mb-6" />
          <p className="text-xs uppercase tracking-widest text-stone font-body mb-4">
            Message Received
          </p>
        </div>
        <h3 className="font-heading text-3xl md:text-4xl font-light text-charcoal mb-6">
          Thank you, {state.submittedName}.
        </h3>
        <p className="text-stone-dark font-body text-lg mb-8 max-w-md mx-auto leading-relaxed">
          We&apos;ve received your inquiry and will be in touch within 24 business hours. We can&apos;t wait to hear more about your space.
        </p>
        <a
          href={bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-terracotta text-cream text-xs uppercase tracking-widest font-body px-8 py-4 hover:bg-terracotta-light transition-colors"
        >
          Book a Consultation
        </a>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6"
    >
      {state.status === "error" && state.errorMessage && (
        <div
          className="border border-terracotta/30 bg-terracotta/5 px-5 py-4 text-sm text-charcoal font-body"
          role="alert"
        >
          {state.errorMessage}
        </div>
      )}

      {/* Name / Email / Phone row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field
          label="Name"
          name="name"
          type="text"
          placeholder="Your full name"
          required
          error={state.errors.name}
          onBlur={handleBlur}
          autoComplete="name"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          error={state.errors.email}
          onBlur={handleBlur}
          autoComplete="email"
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          placeholder="(Optional)"
          error={state.errors.phone}
          onBlur={handleBlur}
          autoComplete="tel"
        />
      </div>

      {/* Project Type */}
      <div>
        <label
          htmlFor="projectType"
          className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
        >
          Project Type<span className="text-terracotta ml-0.5">*</span>
        </label>
        <select
          id="projectType"
          name="projectType"
          className={`w-full bg-cream-dark text-charcoal border px-4 py-3 font-body text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta appearance-none cursor-pointer ${
            state.errors.projectType
              ? "border-terracotta"
              : "border-stone-light focus:border-terracotta"
          }`}
          onBlur={handleBlur}
          defaultValue=""
        >
          <option value="" disabled>
            Select a project type
          </option>
          {PROJECT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <FieldError message={state.errors.projectType} />
      </div>

      {/* Location / Budget / Timeline row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field
          label="Location"
          name="location"
          type="text"
          placeholder="e.g., North Shore, Long Island"
          error={state.errors.location}
          onBlur={handleBlur}
        />
        <div>
          <label
            htmlFor="budgetRange"
            className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
          >
            Budget Range
          </label>
          <select
            id="budgetRange"
            name="budgetRange"
            className="w-full bg-cream-dark text-charcoal border border-stone-light px-4 py-3 font-body text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-terracotta appearance-none cursor-pointer"
          >
            <option value="">Not sure yet</option>
            {BUDGET_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Timeline"
          name="timeline"
          type="text"
          placeholder="e.g., Starting this spring"
          error={state.errors.timeline}
          onBlur={handleBlur}
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-xs uppercase tracking-widest text-stone mb-2 font-body"
        >
          Tell Us About Your Project<span className="text-terracotta ml-0.5">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          placeholder="Tell us about your project, your vision, what you love and what you'd like to change..."
          className={`w-full bg-cream-dark text-charcoal border px-4 py-3 font-body text-sm transition-colors placeholder:text-stone-light focus:outline-none focus:ring-2 focus:ring-terracotta resize-y ${
            state.errors.description
              ? "border-terracotta"
              : "border-stone-light focus:border-terracotta"
          }`}
          onBlur={handleBlur}
        />
        <FieldError message={state.errors.description} />
      </div>

      <div>
        <button
          type="submit"
          disabled={state.status === "submitting"}
          className="bg-terracotta text-cream text-xs uppercase tracking-widest font-body px-10 py-4 hover:bg-terracotta-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state.status === "submitting" ? "Sending\u2026" : "Send Inquiry"}
        </button>
      </div>
    </form>
  );
}
