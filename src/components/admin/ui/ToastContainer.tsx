import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AdminToast, {
  type AdminToastProps,
  type AdminToastVariant,
  type AdminToastAction,
} from "./AdminToast";

// Phase 34 Plan 02 — ToastContainer
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § AdminToast primitive contract
//
// Shared toast stack provider. Mounted once at the top of AdminLayout.astro so
// every admin page gets a single live toast area at `fixed bottom-6 right-6`.
// Consumers call `useToast().show({ ... })` / `useToast().dismiss(id)`.
//
// Stack semantics: up to 3 concurrent toasts, bottom-up, 8px gap. Adding a
// fourth drops the oldest (matches user expectation that new notifications
// supersede stale ones).

export interface ShowToastOptions {
  variant?: AdminToastVariant;
  title: string;
  body?: AdminToastProps["body"];
  action?: AdminToastAction;
  duration?: number;
}

interface ToastEntry extends ShowToastOptions {
  id: string;
}

interface ToastContextValue {
  show: (opts: ShowToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_TOASTS = 3;

let toastIdCounter = 0;
function generateToastId(): string {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast must be used inside a <ToastContainer> provider. Mount ToastContainer once in AdminLayout.astro.",
    );
  }
  return ctx;
}

export default function ToastContainer({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((opts: ShowToastOptions) => {
    const id = generateToastId();
    const entry: ToastEntry = { ...opts, id };
    setToasts((prev) => {
      const next = [...prev, entry];
      // Drop the oldest if we exceeded the concurrent cap.
      while (next.length > MAX_TOASTS) next.shift();
      return next;
    });
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-admin-toast-container
        className="pointer-events-none fixed bottom-6 right-6 flex flex-col items-end gap-2"
        style={{
          zIndex: 60,
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <AdminToast
              variant={toast.variant}
              title={toast.title}
              body={toast.body}
              action={toast.action}
              duration={toast.duration}
              onDismiss={() => dismiss(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
