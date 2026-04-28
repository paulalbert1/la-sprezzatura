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

---

## Acceptance criteria that grep test names couple structure to text

**Problem.** Acceptance criteria of the form `grep -q "it('renders vendor-only sub-line"` couple the executor's `describe`/`it` nesting choices to the criterion phrasing. The criterion intends to verify a specific test exists; what it actually verifies is "a top-level `it()` block with this exact phrasing exists." If the executor nests inside a `describe()` for organizational reasons, or if the test name reads more naturally with different word ordering, the criterion fails on a structural choice that's not load-bearing for behavior.

**Where this has bitten Phase 46-04:**
- Task 5 (1 occurrence): The executor needed three sub-line tests to match plan grep patterns (`"vendor.*spec when both present"`, `"falls back to vendor-only"`, `"OMITTED when both vendor and spec are empty"`). Solved by nesting in `describe("Procurement sub-line composition (D-14)")` so the bare `it()` names stayed terse enough to satisfy the patterns. Defensible workaround, but it surfaces the same coupling problem as the identity-token-grep lesson — the structural shape was forced by the criterion, not chosen for clarity.

**Same family as the identity-token-grep lesson** but specifically about test-name greps. Listed separately because the resolution pattern is different.

**Why it recurs.** A plan author who wants to verify "test X exists" reaches for `grep -q "<exact test name>"` because it's the literal answer to the question. The cost — coupling structure to text — only shows up when the executor wants to organize tests differently than the plan implicitly assumed.

**Default to ship.** Match content, not structure. Pick from these patterns:

```bash
# 1. Relax the regex to match key concept words, not exact phrasing
grep -qE "vendor.only.sub.line" file.test.ts          # matches "vendor-only sub-line", "vendor only sub-line", "vendor (only) sub-line", etc.

# 2. Match the BODY of the test (assertions), not the name
grep -B2 'expect(.*)\.toContain.*"vendor-only-marker"' file.test.ts | grep -q 'it\|test'

# 3. Match a meaningful regex over the assertion content rather than the it() title
grep -qE 'expect\(.*\)\.not\.toContain.*"sub-line"' file.test.ts    # asserts a "no empty sub-line" test exists by what it tests, not how it's named

# 4. Use AST-aware tools for exhaustive structural verification (ast-grep, ts-morph)
```

**Exceptions.** Sometimes the test NAME itself is load-bearing — e.g., it's part of a documented contract or surfaces in a CI report that downstream automation parses. In those cases, lock the name explicitly in the plan body ("test name MUST be `'renders vendor-only sub-line'` for downstream CI matching") and the criterion can be exact. Without that explicit lock, prefer concept-matching regex.

**Surfaced by:** Phase 46 Plan 04 Task 5 (2026-04-28). Logged here at the first occurrence because it shares mechanics with the identity-token-grep lesson and the unified pattern (criteria couple to text/structure) generalizes both — easier to reach for the right tool when the family of failure modes is named.
