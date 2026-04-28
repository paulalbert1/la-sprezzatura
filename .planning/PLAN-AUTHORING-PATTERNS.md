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

---

## Carry-over content presence checks for structural-rewrite audits

**Problem.** When a phase audits a structural rewrite (legacy template → new template, old API → new API, schema migration) using byte-count deltas + visual review + numbered-decision enumeration, the audit can pass while silently dropping carry-over content. A milestone label, action item, or procurement name that appears in the legacy render but not the new one is exactly the failure mode summary-level audits structurally cannot catch — the byte-count differential is small relative to the section's total, and visual review can miss a single missing row in a multi-row table.

**Where this surfaced.** Phase 46 Plan 03 Checkpoint 1 (the cutover gate). The audit document enumerated expected deltas (D-1 flex→table, D-2 round→square, 46-04 D-2 section reorder, etc.) and mapped each to a numbered decision. That structure is right but insufficient: enumeration verifies "the new template has what was added," not "the new template still has what was carried over." Adding a carry-over presence grep across all fixture content strings (milestone labels, action item labels, procurement names, CTA href, footer location, greeting first-name) caught nothing — but the grep returning 67/67 strings present in both renders converted "audit probably right" into "audit verifiably right." A future cutover with a regression in the rewire would trip the grep where the byte-count and visual review would both miss it.

**Why it recurs.** Plan authors writing audit acceptance criteria reach for byte-count tables (cheap, quantitative) and visual spot-checks (cheap, intuitive). Presence-checking every carry-over content string requires mechanically extracting strings from fixtures and grepping both renders — slightly more setup than either alternative, and the value only shows up when something fails. So it's typically skipped. The asymmetry is wrong: the cost is low, the failure mode it catches is one neither alternative does.

**Default to ship.** When a plan involves a structural-rewrite audit comparing rendered legacy output to rendered new output, add an acceptance criterion of the shape:

```bash
# For every carry-over content string in each fixture (NOT new-only redesign deltas),
# verify presence in BOTH legacy and new rendered output.
for fixture in fixture1 fixture2 ...; do
  for string in "<milestone label>" "<action item>" "<procurement name>" "<cta>" "<location>"; do
    legacy_n=$(grep -o -F -- "$string" "${fixture}-legacy.html" | wc -l)
    new_n=$(grep -o -F -- "$string" "${fixture}-new.html" | wc -l)
    [ "$legacy_n" -gt 0 ] && [ "$new_n" -gt 0 ] || echo "FAIL: $fixture : '$string'"
  done
done
# Acceptance: zero FAIL output across all fixture × string pairs.
```

The criterion's strength is that it's *concrete* about what counts as a regression: "this string appears on both sides." Not "no unexpected diff" (vague), not "structure preserved" (interpretive) — a literal presence test on every carry-over string the fixtures define.

**What goes in the string list.** Every fixture-defined content surface that the rewrite is supposed to preserve verbatim:
- All milestone / event / row labels
- All action item / task / line-item descriptions
- All procurement / inventory / catalog item names (NOT vendor / spec / other new-only fields)
- All CTA labels and `href` prefixes
- All footer / signature / location strings that map across both designs
- Greeting first-name token and project / parent-record title

**What stays OUT of the list.** Anything new-only by design — fields the legacy template didn't render and the new template adds (preheader, reply line, vendor sub-lines if vendor is a new field, state pills if state is new, formal vs casual signoff if the signature register changed). Those are checked by the *expected-deltas* enumeration, not the carry-over presence grep.

**Exceptions.** When the fixtures themselves are entirely new-shape and have no carry-over content (e.g., a green-field component with no legacy counterpart), this check doesn't apply. In that case the byte-count + numbered-decision enumeration is the whole audit.

**Surfaced by:** Phase 46 Plan 03 Checkpoint 1 (2026-04-28). Logged at first occurrence because the failure mode it catches is structurally inaccessible to the alternatives, and the cost asymmetry argues for making it default rather than waiting for three occurrences.

---

## Cheap verifications on load-bearing audit assumptions

**Problem.** Audits and plan acceptance criteria often rest on a small number of load-bearing assumptions — usually about a type's value space, a function's contract, or a config's defaults. The audit can be probably-right when those assumptions hold and quietly-wrong when they don't, and the audit document itself is the wrong place to discover the assumption was wrong (by then the audit is shipping). A 30-second verification of the load-bearing assumption upgrades probably-right to definitely-right at near-zero cost.

**Where this surfaced.** Phase 46 Plan 03 Checkpoint 1. The migration-diff harness's `adaptSendUpdateLegacy()` shim collapses the new `state: "completed" | "upcoming"` field onto the legacy `completed: boolean` via `m.state === "completed"`. The audit's milestone-row claims (strikethrough behavior, indicator shape, row count) all rest on this collapse being lossless — i.e., on `MilestoneState` being a 2-valued type. If the type were 3+ valued (`completed | upcoming | in-progress | delayed`), every non-completed state would render identically in legacy, and the audit's "milestone rows are carry-over content" claim would silently be partly false. A 30-second `grep -n "MilestoneState" src/emails/sendUpdate/Milestones.tsx` resolved the question (2-valued, lossless) and made the audit's milestone claims definitely-right rather than probably-right.

**Why it recurs.** Audit authors compress to make the audit readable. Compression hides the load-bearing assumptions inside narrative ("the adapter's collapse is bijective") or footnotes ("acknowledged trade-off"). The reviewer reading the audit then has to either trust the compression or surface the assumption and check it independently — the second option is rare because the audit reads as authoritative. Authors don't routinely list "things this audit assumes" because they don't think of them as assumptions, they think of them as facts.

**Default to ship.** For any audit that includes adapters, shims, mapping functions, or "we treat X as if it were Y" reductions, add an acceptance criterion of the shape:

```bash
# Each load-bearing assumption gets a one-line check in the audit document.
# Format: ASSUMPTION → VERIFICATION → RESULT.
#
# Examples:
#   "MilestoneState is 2-valued"  →  grep -E '^export type MilestoneState' src/emails/sendUpdate/Milestones.tsx
#   "ProcurementStatus enum is closed at 4 values"  →  grep -E '^export const PROCUREMENT_STATUSES' src/lib/procurement/statusPills.ts
#   "tenant.signoffNameFormal exists on every tenant"  →  rg 'signoffNameFormal' src/sanity/schemas/tenant.ts
#
# Run all checks BEFORE the audit document closes. Each check passes or fails;
# failures block the audit from shipping until the assumption is resolved.
```

The discipline is identifying the load-bearing assumptions, not running the checks — the checks are 30 seconds each. The audit author's job is to enumerate the assumptions explicitly so they CAN be checked. "List the assumptions you're making" is the prompt; the verifications follow mechanically.

**Where to put the assumption list.** Inside the audit document, in a section titled "Load-Bearing Assumptions" between the introduction and the per-fixture spot checks. Each entry: assumption (English), verification (shell command or file:line reference), result (pass / fail). When all entries are pass, the audit is definitely-right on the things it depends on. When any entry is fail, the audit doesn't ship — the failed assumption gets resolved (either by the audit acknowledging the multi-value case explicitly, or by the shim being revised) before approval.

**Exceptions.** Audits with no adapters / shims / reductions — pure side-by-side comparisons of the same input through two pipelines — have no load-bearing assumptions beyond the fixtures themselves. In that case this section is empty by construction.

**Surfaced by:** Phase 46 Plan 03 Checkpoint 1 (2026-04-28). Logged at first occurrence because the cost (30 seconds per assumption) is so low and the failure mode it catches (audit ships on a partly-false assumption) is so consequential that the threshold for institutional capture should be lower than the usual three-occurrences rule.
