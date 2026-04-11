// src/components/admin/ui/AdminModal.test.tsx
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 02 (foundation-primitives). Each pending
// stub becomes an active test when the corresponding component is built.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § AdminModal primitive contract

import { describe, it } from "vitest";

describe("AdminModal (Phase 34 Plan 02)", () => {
  it.todo("renders nothing when open=false (unmounts to free state)");
  it.todo("overlay click calls onClose when disableDismiss is falsy");
  it.todo("overlay click is no-op when disableDismiss is true");
  it.todo("Escape key calls onClose when disableDismiss is falsy");
  it.todo("Escape key is no-op when disableDismiss is true");
  it.todo("X icon click calls onClose when disableDismiss is falsy");
  it.todo("size='sm' applies max-w-[440px], size='md' applies max-w-[540px]");
  it.todo("body scroll is trapped via document.body.style.overflow while open");
  it.todo("focus trap returns focus to trigger on close");
  it.todo("aria-modal='true' and role='dialog' set; aria-labelledby points at header id");
});
