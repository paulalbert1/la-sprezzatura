// src/components/admin/ui/TagInput.test.tsx
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 02 (foundation-primitives). Each pending
// stub becomes an active test when the corresponding component is built.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-RESEARCH.md § 8 Validation Architecture

import { describe, it } from "vitest";

describe("TagInput (Phase 34 Plan 02)", () => {
  it.todo("pressing Enter with non-empty input adds the value as a new tag");
  it.todo("pressing Enter with empty input is a no-op");
  it.todo("clicking × on a tag removes it");
  it.todo("duplicate value is silently rejected (no add, no error)");
  it.todo("Backspace on empty input removes the last tag");
  it.todo("validator prop 'email' rejects malformed addresses and shows inline error");
  it.todo("onChange fires with the new tags array after add");
  it.todo("onChange fires with the new tags array after remove");
});
