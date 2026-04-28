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

---

## Plan-listed test counts are floors, not ceilings

**Problem.** Plan task bodies typically list a target test count ("~17 tests covering X, Y, Z scenarios"). Executors interpret this as the maximum and stop there, OR they exceed it for uniformity and surface the divergence as a deviation requiring justification. Both readings are noisy: under-coverage if "~17" is treated as a ceiling, deviation-paperwork if it's exceeded for legitimate reasons.

**Where this has bitten Phase 46-04 (three consecutive occurrences):**
- Task 2: 21 tests vs plan's "~17" — executor added 2 user-mandated double-blank-line tests + 1 `ftp:` rejection for uniform "all common non-https schemes" coverage
- Task 3: deviations included one test addition for symmetry across status pill rendering
- Task 4: 10 tests vs plan's "~9" — case-insensitive assertion split

Each individual case is defensible. The recurring "executor adds 1–3 tests beyond plan list, surfaces as deviation" pattern signals the plan-vs-execution interface is mis-shaped, not the executions.

**Why it recurs.** A plan author writing "~17 tests" intends to communicate scope, not to forbid additions. An executor reading the same number reasonably treats it as an acceptance-criteria target. The number reads as more authoritative than the prose around it.

**Default to ship.** Frame test counts in plan bodies as floors with explicit "executor may add for uniformity" language. Concretely:

```markdown
**Behavioral tests (target: at minimum 17, list non-exhaustive):**
1. ...
17. ...

**Executor discretion:** Add tests where uniform coverage of a category beats arbitrary partial coverage. Example: if 4 of 5 sibling cases are tested explicitly, round to all 5. Document additions in the SUMMARY without flagging them as deviations.
```

This shifts the contract: the plan's listed tests are mandatory (acceptance criteria assert their presence), additions are encouraged when they improve coverage symmetry, and the executor doesn't have to choose between under-covering or paperwork.

**Exceptions.** When the test count IS a ceiling for a real reason (e.g., performance constraints, snapshot reviewability caps, intentional minimal-surface-area for a leaf utility), the plan body must state it explicitly: *"Maximum 5 fixtures — adding more degrades reviewability per CONTEXT D-22."* Without that explicit statement, "~N tests" defaults to floor semantics.

**Surfaced by:** Phase 46 Plan 04 Tasks 2, 3, 4 (2026-04-28). Threshold for institutional capture: three consecutive occurrences across distinct tasks.
