# Plan-Authoring Patterns

Cross-phase lessons surfaced during plan execution that should inform future plan authoring. Not a style guide — a registry of patterns where the plan-author and the executor have repeatedly disagreed in the same way, with the resolution that worked.

**Format per pattern:** problem, why it recurs, default to ship in future plans, exceptions.

**Discipline:** when authoring a new plan, scan this file for relevant patterns. When executing a plan and discovering a recurring issue (third or more occurrence), append it here rather than re-disclosing per-task.

---

## Identity-token grep checks are over-broad by default

**Problem.** Acceptance criteria of the form `! grep -q 'TOKEN' <file>` flag legitimate prose that references the concept. Comments, header docstrings, JSDoc, and intentional documentation strings can all contain tokens that the grep was intended to catch in code.

**Where this has bitten Phase 46-04 (three consecutive occurrences):**
- Task 1: `! grep -q 'DESIGN-SYSTEM' src/lib/procurement/statusPills.test.ts` tripped on the executor's first-pass header comment that legitimately referenced the design-system file in prose
- Task 3: `! grep "○" src/emails/sendUpdate/...` tripped on a Milestones header comment that referenced the forbidden glyph in explanatory prose, not in rendered output
- Task 3: a single-line regex meant to match a Procurement import statement failed against a multi-line `import { ... }` block

**Why it recurs.** `grep -q` is the simplest pattern for plan authors to write, and the negation form (`!`) reads as "this thing is not present" — which is the natural intent. But `grep` matches anywhere, including comments, prose, and multi-line constructs.

**Default to ship.** Scope grep checks tightly. Pick from these patterns:

```bash
# 1. Assertion lines only -- best for "this token doesn't appear in test expectations"
grep -E 'expect\(' file.test.ts | grep -q 'TOKEN'

# 2. Exclude comments -- best for "this token doesn't appear in CODE"
grep -vE '^\s*(//|\*|#)' file.ts | grep -q 'TOKEN'

# 3. Specific regex -- best for "this token doesn't appear in a SPECIFIC role"
! grep -qE 'readFile.*TOKEN|fetch.*TOKEN|fs\.read.*TOKEN' file.ts

# 4. Single-line semantic check via grep -P (Perl) -- handles multi-line constructs
grep -Pq '(?s)import\s*\{[^}]*TOKEN[^}]*\}' file.ts

# 5. Use AST-aware tools when grep keeps lying -- ripgrep with --multiline, ts-morph, ast-grep
```

**Exceptions.** A literal-token check is fine when the token is genuinely unique and could never legitimately appear in prose:
- Long generated identifiers, hashes, UUIDs
- Cryptographic constants
- Tokens that don't form English words and have no documentation use

When in doubt, accompany the check with a comment explaining what it's trying to prevent:
```bash
# Verify ProcurementEditor no longer DECLARES the inline palette (extraction is real, not nominal).
# Token can legitimately appear in comments, imports, and JSDoc — those are fine. We only forbid
# a top-level `const STATUS_PILL_STYLES = ...` declaration.
! grep -E "^const STATUS_PILL_STYLES" src/components/admin/ProcurementEditor.tsx
```

The comment lets a future executor distinguish "real violation" from "prose collision" without spelunking the plan.

**Surfaced by:** Phase 46 Plan 04 Tasks 1, 3 (2026-04-28). Threshold for institutional capture: three consecutive occurrences across two tasks.
