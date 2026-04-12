---
phase: 34
plan: 05
slug: per-client-purl
subsystem: admin-client-purl
tags: [react, sanity-schema, api, admin, modal, toast, d-18, d-22]
requires:
  - Wave 0 test stubs (.todo grid for client.test.ts, clients.test.ts, RegenerateLinkDialog.test.tsx)
  - Wave 1 primitives (AdminModal, AdminToast, ToastContainer, useToast, .luxury-secondary-btn)
  - Plan 04 (send-update-surface) — already reads client.portalToken via lazy-gen setIfMissing
  - src/lib/generateToken.ts generatePortalToken(8)
  - src/lib/tenantClient.ts getTenantClient(tenantId)
  - src/components/admin/ContactCardWrapper.tsx (wrapped unchanged)
provides:
  - client.portalToken schema field (string, readOnly, no initialValue — lazy per D-18)
  - POST /api/admin/clients regenerate-portal-token action (admin-gated, .set overwrite semantics)
  - RegenerateLinkDialog destructive confirm dialog with success toast + copy-link affordance
  - CopyLinkButton exported from RegenerateLinkDialog for the inline "Copy link" UX
  - ClientChipWithRegenerate wrapper island + project detail page integration
affects:
  - src/sanity/schemas/client.ts (+13 lines — new portalToken defineField)
  - src/sanity/schemas/client.test.ts (4 it.todo flipped to real assertions)
  - src/pages/api/admin/clients.ts (+21 lines — new action branch)
  - src/pages/api/admin/clients.test.ts (6 it.todo flipped to real integration tests)
  - src/components/admin/RegenerateLinkDialog.tsx (new — 234 lines)
  - src/components/admin/RegenerateLinkDialog.test.tsx (6 it.todo flipped + 1 Rule 2 defensive test)
  - src/components/admin/ClientChipWithRegenerate.tsx (new — 140 lines)
  - src/pages/admin/projects/[projectId]/index.astro (map body swap + import)
tech_stack:
  added: []
  patterns:
    - "Lazy-gen schema field: defineField with readOnly + NO initialValue so absence-of-token is a first-class state"
    - "Action discriminator pattern: extend existing POST handler with a new 'regenerate-portal-token' branch rather than a new route file"
    - ".set() (NOT setIfMissing) for regeneration — lazy-gen uses setIfMissing, regenerate uses set"
    - "vi.hoisted() for test mocks that need to reference suite-level vars before vi.mock hoist"
    - "Sibling wrapper island (ClientChipWithRegenerate) wraps existing ContactCardWrapper inline — Option A from research § 7.1, keeps ContactCardWrapper's prop surface untouched"
    - "Local ToastContainer inside ClientChipWithRegenerate — React context doesn't cross Astro island boundaries, same pattern as SendUpdateButton from Plan 04"
    - "Destructive-red primary button (#9B3A2A) — one of the few admin-side spots where destructive red is a primary, justified by D-22's irreversible semantics"
    - "CopyLinkButton nested inside RegenerateLinkDialog file so the useToast() body ReactNode can embed it without a separate export surface"
    - "Clipboard testing via Object.defineProperty(navigator, 'clipboard', ...) + vi.useFakeTimers() for the 1.5s label flip"
key_files:
  created:
    - src/components/admin/RegenerateLinkDialog.tsx
    - src/components/admin/ClientChipWithRegenerate.tsx
  modified:
    - src/sanity/schemas/client.ts
    - src/sanity/schemas/client.test.ts
    - src/pages/api/admin/clients.ts
    - src/pages/api/admin/clients.test.ts
    - src/components/admin/RegenerateLinkDialog.test.tsx
    - src/pages/admin/projects/[projectId]/index.astro
decisions:
  - "Schema field has NO initialValue per D-18. The absence of a token is the signal that triggers lazy-gen on first Send Update. Setting an initialValue would eagerly stamp every new client created via /admin/clients with a token, which obscures the lazy migration path and makes it harder to reason about 'has this client ever had a portal link?'"
  - "Regenerate uses .set() not .setIfMissing() because it MUST overwrite. The lazy-gen path (in Plan 04's send-update.ts) uses setIfMissing to respect already-generated tokens. Regenerate deliberately replaces whatever was there before — that's the whole point of D-22. Test 'calls patch(clientId).set({ portalToken: newToken }).commit()' pins this distinction explicitly."
  - "ClientChipWithRegenerate is the outer React island, wrapping ContactCardWrapper as a child (Option A from research § 7.1). The alternative — extending ContactCardWrapper's props with a trailing slot — would touch every ContactCardWrapper call site in the repo. Option A keeps the refactor surgical and localized to the client chip row in the project detail page."
  - "Local ToastContainer inside ClientChipWithRegenerate mirrors SendUpdateButton (Plan 04). React context does not cross Astro island boundaries, so the dialog's useToast() call needs a provider INSIDE its own island's React tree, not in the sibling AdminLayout.astro global ToastContainer. This isn't duplication — each island hydrates independently."
  - "CopyLinkButton lives in the same file as RegenerateLinkDialog (not a separate file) because the only consumer is the success toast body inside this dialog. A 1.5s label flip is the only user feedback; no extra toast or announcement is needed — the inline flip is the confirmation."
  - "Destructive-red primary button (#9B3A2A bg, #FFFEFB text) is intentional per UI-SPEC line 370 and DeleteConfirmDialog:103 pattern. Regeneration is irreversible for existing links, and the red primary signals that clearly. This is the only deviation from the usual luxury-gold primary convention."
  - "Added a 7th test (error path) beyond the 6 Wave 0 stubs because Rule 2 (auto-add missing critical functionality) flagged the lack of coverage for the error branch. The dialog must keep the modal open and surface the 'Could not regenerate. Please try again.' message inline on HTTP error — that's a correctness requirement, and the new test pins the behavior."
  - "No changes to src/pages/api/send-update.ts were needed. The orchestrator's objective mentioned a possible placeholder TODO referencing this plan, but Plan 04's SUMMARY § 'Known Stubs' explicitly documented that no placeholder was needed: the GROQ projection already returned undefined safely, and the setIfMissing + re-fetch path handled the missing-field case correctly. I verified this by reading lines 120-162 of send-update.ts — the code reads client.portalToken directly with no placeholder string — and confirmed the behavior is exactly right for the post-Plan-05 schema. Zero changes to the file."
metrics:
  duration_minutes: 32
  tasks_completed: 3
  files_created: 2
  files_modified: 6
  tests_flipped: 16
  tests_added: 1
  lines_added: ~500
  commits: 3
  completed_date: 2026-04-11
---

# Phase 34 Plan 05: Per-Client PURL Summary

Shipped the per-client portal URL feature end to end: a new `portalToken`
field on the `client` document schema (lazy-gen per D-18), a new
`regenerate-portal-token` action on `POST /api/admin/clients` that overwrites
the existing token, a `RegenerateLinkDialog` React component with an
irreversible-action confirmation UX + success toast with an inline Copy
link button, and a `ClientChipWithRegenerate` wrapper island wired into
the project detail page's Clients chip row. This completes the D-22
contract: Liz can click any client chip's regenerate icon, confirm the
destructive action, and receive the new `/portal/client/{token}` URL via
toast — ready to paste into the next Send Update manually (no auto-email,
per the D-22 spec). All 16 Wave 0 `it.todo` stubs for this plan are
flipped to green tests, plus 1 additional error-path test added under
Rule 2 defensive coverage.

## What Shipped

### Task 1 — portalToken schema field + regenerate API action (commit `5bef20c`)

**`src/sanity/schemas/client.ts`** — added a new `defineField` after
`notes`:

```ts
defineField({
  name: "portalToken",
  title: "Portal Token",
  type: "string",
  readOnly: true,
  description: "Auto-generated on first Send Update or manual regeneration. Identifies the client across all their projects.",
}),
```

No `initialValue`. This is intentional per D-18 — the absence of a token
is a first-class state that triggers lazy generation via `setIfMissing` in
Plan 04's send-update path. Setting an `initialValue` would eagerly stamp
every new client with a token at creation time, obscuring the migration
path.

**`src/pages/api/admin/clients.ts`** — extended the POST handler's action
router with a new `regenerate-portal-token` branch, added just before the
`"Invalid action"` fallback:

```ts
if (action === "regenerate-portal-token") {
  const { clientId } = body as { clientId: string };
  if (!clientId || typeof clientId !== "string") {
    return jsonResponse({ error: "Missing clientId" }, 400);
  }
  const newToken = generatePortalToken(8);
  await client
    .patch(clientId)
    .set({ portalToken: newToken })
    .commit();
  return jsonResponse({ success: true, portalToken: newToken });
}
```

The action is covered by the existing admin session gate at lines 18-25
(`session.role !== "admin" → 401`). Note the use of `.set()` instead of
`.setIfMissing()`: regenerate MUST overwrite, unlike the Send Update
lazy-gen path that respects existing tokens.

**Tests flipped (10 total):**

- `src/sanity/schemas/client.test.ts` — 4 flips: field present, type
  string, readOnly true, absence of initialValue (via
  `Object.prototype.hasOwnProperty.call`).
- `src/pages/api/admin/clients.test.ts` — 6 flips: non-admin 401, missing
  clientId 400, exact `generatePortalToken(8)` call and 8-char return,
  patch().set().commit() chain, 200 response body shape, per-call token
  uniqueness (two successive calls yield two different written tokens).

All mocks wrapped in `vi.hoisted()` to avoid the "Cannot access
mockGetSession before initialization" trap that hits when vitest hoists
`vi.mock` factories above top-level declarations — Plan 02's commit
`55a4cf6` documented the same fix for blob-upload.test.ts.

### Task 2 — RegenerateLinkDialog + CopyLinkButton (commit `d27bfc5`)

**`src/components/admin/RegenerateLinkDialog.tsx`** (234 lines) — the
destructive confirm dialog. Built on the Wave 1 `AdminModal` primitive
with `size="sm"` (max-w-[440px]). Layout:

- **Title:** `Regenerate personal link for {client.name}?`
- **Body:** an `AlertTriangle` 20px `#9B3A2A` icon next to the exact copy
  from UI-SPEC § 3: "This invalidates the current link across ALL this
  client's projects..."
- **Footer:** Cancel button (neutral, `.luxury-secondary-btn`-shaped
  inline) + Regenerate link primary button (destructive red, `#9B3A2A`
  bg, `#FFFEFB` text, matches DeleteConfirmDialog:103 destructive pattern)
- **States:** idle "Regenerate link", loading "Regenerating..." with
  `Loader2` spinner, modal `disableDismiss` during the API call so users
  can't Escape or overlay-click mid-request.

On success:

1. `fetch("/api/admin/clients", { action: "regenerate-portal-token", clientId })`
2. Build `newUrl = ${baseUrl}/portal/client/${portalToken}`
3. `useToast().show({ variant: "success", title: "New link generated for
   {name}", body: <URL + CopyLinkButton />, duration: 8000 })` (8s is
   longer than the 3s default because the URL is useful to have visible)
4. Close the dialog

On error:

1. Set inline error `Could not regenerate. Please try again.`
2. Keep the dialog open
3. Clear the loading state so the user can retry

**CopyLinkButton** is defined in the same file (exported for potential
reuse) and renders inside the success toast body. It calls
`navigator.clipboard.writeText(url)`, flips its label from "Copy link" to
"Copied ✓" for 1.5s, then reverts — no extra confirmation or toast
(inline flip IS the confirmation).

**Tests flipped (6 Wave 0 + 1 defensive):**

| Test | Assertion |
|---|---|
| renders title 'Regenerate personal link for {clientName}?' | `screen.getByText(...)` |
| body contains 'invalidates the current link across ALL...' | substring match on modal card textContent |
| cancel button dismisses dialog without API call | `onClose` called once, fetch NOT called |
| confirm button posts correct payload | fetch called with URL + method + JSON body |
| success response triggers toast with URL + Copy link button | toast title, URL, and copy button in DOM |
| Copy link click flips label to 'Copied ✓' for 1.5s | fake-timer drain, clipboard spy, label revert after 1500ms |
| **[Rule 2]** error response keeps dialog open + inline error | fetch rejects, `[data-regenerate-error]` in DOM, onClose NOT called |

The fake-timer test uses `vi.useFakeTimers()` wrapped in a try/finally so
`vi.useRealTimers()` always runs even if an assertion fails — prevents
leakage between tests.

### Task 3 — ClientChipWithRegenerate + project detail wire-up (commit `d42cf8d`)

**`src/components/admin/ClientChipWithRegenerate.tsx`** (140 lines) —
React island that owns:

1. A `ToastContainer` at the root (so the dialog's `useToast()` has a
   provider inside this island's React tree)
2. An `inline-flex` layout with the existing `ContactCardWrapper` chip
   rendered inline (with the exact same `contactData` prop shape as the
   old inline usage in the project detail page — the chip looks
   identical to before)
3. A trailing 24x24 `RefreshCw` icon button with a 0.5px `#D4C8B8`
   vertical divider on the left, `#9E8E80` default color, `#9A7B4B` on
   hover (via onMouseEnter/Leave handlers that set `style.color`)
4. A `RegenerateLinkDialog` that opens when the icon button is clicked

The button uses `e.stopPropagation()` + `e.preventDefault()` to keep the
click from reaching the underlying `ContactCardWrapper` and accidentally
opening its hover popover. `aria-label` and `title` both read
"Regenerate personal portal link" per UI-SPEC line 358.

**`src/pages/admin/projects/[projectId]/index.astro`** — replaced the
inline map body at lines 218-237:

```astro
// BEFORE
{project.projectClients.map((c: any) => (
  <ContactCardWrapper client:load entityId={...} ...>
    <span style="...">{c.name}</span>
  </ContactCardWrapper>
))}

// AFTER
{project.projectClients.map((c: any) => (
  <ClientChipWithRegenerate
    client:load
    client={{
      _id: c._id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      preferredContact: c.preferredContact || "",
    }}
  />
))}
```

Added the new `import ClientChipWithRegenerate from ".../ClientChipWithRegenerate.tsx"`
at the top of the frontmatter. The existing `ContactCardWrapper` import
stays because the contractors map below still uses it.

## Verification

### Plan 05 test subset

```
npx vitest run \
  src/sanity/schemas/client.test.ts \
  src/pages/api/admin/clients.test.ts \
  src/components/admin/RegenerateLinkDialog.test.tsx

 ✓ src/pages/api/admin/clients.test.ts (6 tests)
 ✓ src/components/admin/RegenerateLinkDialog.test.tsx (7 tests)
 ✓ src/sanity/schemas/client.test.ts (11 tests)

 Test Files  3 passed (3)
      Tests  24 passed (24)
```

All 24 tests in the Plan 05 subset pass. Note: `client.test.ts` has 11
total tests (7 pre-existing from Wave 0 + 4 newly flipped); the plan
flipped exactly 4 there. `clients.test.ts` has 6 flipped tests (all new
to the file). `RegenerateLinkDialog.test.tsx` has 7 tests (6 flipped
Wave 0 stubs + 1 added defensive test).

### Wave 1 + Plan 03 + Plan 04 regression check

```
npx vitest run \
  src/components/admin/ui \
  src/components/admin/SendUpdateModal.test.tsx \
  src/components/admin/RegenerateLinkDialog.test.tsx \
  src/pages/api/admin/clients.test.ts \
  src/pages/api/admin/site-settings.test.ts \
  src/pages/api/send-update.test.ts \
  src/sanity/schemas/client.test.ts

 Test Files  10 passed (10)
      Tests  94 passed (94)
```

Zero regressions. AdminModal, AdminToast, CollapsibleSection, TagInput
(Wave 1 primitives), SendUpdateModal (Plan 04), site-settings (Plan 03),
and send-update (Plan 04) all still green after Plan 05's changes.

### Grep acceptance (plan success criteria)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| `grep -n 'name: "portalToken"' src/sanity/schemas/client.ts` | 1 | 1 | PASS |
| `grep -n "readOnly: true" src/sanity/schemas/client.ts` | ≥1 | 1 | PASS |
| `grep -n "initialValue" src/sanity/schemas/client.ts` | 0 | 0 | PASS |
| `grep -n "regenerate-portal-token" src/pages/api/admin/clients.ts` | ≥1 | 1 | PASS |
| `grep -n "generatePortalToken(8)" src/pages/api/admin/clients.ts` | ≥1 | 1 | PASS |
| `grep -n '\.set({ portalToken' src/pages/api/admin/clients.ts` | ≥1 | 1 | PASS |
| `grep -c "it.todo" src/sanity/schemas/client.test.ts` | 0 | 0 | PASS |
| `grep -c "it.todo" src/pages/api/admin/clients.test.ts` | 0 | 0 | PASS |
| `ls src/components/admin/RegenerateLinkDialog.tsx` | exists | exists | PASS |
| `grep -n "AdminModal" src/components/admin/RegenerateLinkDialog.tsx` | ≥1 | 1 | PASS |
| `grep -n "regenerate-portal-token" src/components/admin/RegenerateLinkDialog.tsx` | ≥1 | 1 | PASS |
| `grep -n "invalidates the current link across ALL" src/components/admin/RegenerateLinkDialog.tsx` | ≥1 | 1 | PASS |
| `grep -n "navigator.clipboard.writeText" src/components/admin/RegenerateLinkDialog.tsx` | ≥1 | 1 | PASS |
| `grep -n "Copied ✓" src/components/admin/RegenerateLinkDialog.tsx` | ≥1 | 1 | PASS |
| `grep -n "#9B3A2A" src/components/admin/RegenerateLinkDialog.tsx` | ≥1 | 4 | PASS |
| `grep -c "it.todo" src/components/admin/RegenerateLinkDialog.test.tsx` | 0 | 0 | PASS |
| `grep -c "@sanity/ui" src/components/admin/RegenerateLinkDialog.tsx` | 0 | 0 | PASS |
| `ls src/components/admin/ClientChipWithRegenerate.tsx` | exists | exists | PASS |
| `grep -n "RegenerateLinkDialog" src/components/admin/ClientChipWithRegenerate.tsx` | ≥1 | 2 | PASS |
| `grep -n "RefreshCw" src/components/admin/ClientChipWithRegenerate.tsx` | ≥1 | 2 | PASS |
| `grep -n "stopPropagation" src/components/admin/ClientChipWithRegenerate.tsx` | ≥1 | 1 | PASS |
| `grep -n "Regenerate personal portal link" src/components/admin/ClientChipWithRegenerate.tsx` | ≥1 | 2 | PASS |
| `grep -n "ClientChipWithRegenerate" 'src/pages/admin/projects/[projectId]/index.astro'` | ≥1 | 2 | PASS |
| `grep -c "@sanity/ui" src/components/admin/ClientChipWithRegenerate.tsx` | 0 | 0 | PASS |

### TypeScript + astro check

- `npx tsc --noEmit` — zero errors in Plan 05 files. Pre-existing errors
  in `src/sanity/studioTheme.ts`, `src/sanity/components/rendering/**`,
  and `src/sanity/schemas/project.ts` are Plan 34-07 territory (Studio
  removal) and out of scope per SCOPE BOUNDARY.
- `npx astro check` — zero errors in Plan 05 files. 160 total errors in
  the 333-file tree are all in Studio-specific paths, matching Plan 04's
  observed baseline (Plan 04 SUMMARY § "TS + astro check").

## Deviations from Plan

### Rule 2 — Added error-path test (not in Wave 0 stub set)

**Found during:** Task 2 test authoring.

**Issue:** The Wave 0 stub set for RegenerateLinkDialog.test.tsx included
6 tests covering success flows (title, body copy, cancel, POST payload,
success toast, copy-link flip) but no test covering the error branch.
The dialog has real error-handling code (`setError`, inline banner,
`disableDismiss` reset) but nothing in the test harness pinning that
behavior. A future refactor could silently regress to "swallow error,
close modal on any response" and no test would catch it.

**Fix:** Added a 7th test, "error response keeps dialog open and shows
inline error", that mocks fetch with a 500 response and asserts:

1. `[data-regenerate-error]` element renders inside the modal
2. Its text matches `/Could not regenerate/`
3. `onClose` is NOT called (modal stays open so the user can retry)

The existing dialog code had all three behaviors already; the test just
pins them. I also added a `data-regenerate-error` attribute to the error
banner in the component so the test has a stable selector.

**Scope justification:** Rule 2 (auto-add missing critical functionality
— error handling is correctness-level, not a nice-to-have). The fix is
additive and doesn't change the success path. Documented here for
transparency.

### Rule 3 — vi.hoisted for clients.test.ts mock bindings

**Found during:** First run of Task 1 tests.

**Issue:** Initial clients.test.ts used top-level `const mockGetSession
= vi.fn(); vi.mock(..., () => ({ getSession: mockGetSession }))`. Vitest
hoists the `vi.mock` call above ALL top-level declarations (including
`const mockGetSession`), so the factory runs before the variable is
initialized → `ReferenceError: Cannot access 'mockGetSession' before
initialization`. Same trap Plan 02 hit in blob-upload.test.ts
(`55a4cf6`).

**Fix:** Wrapped all mock bindings in `vi.hoisted(() => ({ ... }))` so
they're created alongside the hoisted `vi.mock` calls. `clientCache`
variable names changed from `mockGetSession` etc. to destructured
properties on the hoisted return value.

**Scope justification:** Rule 3 (blocking test infrastructure issue).
Fixed inline.

### Plan 04 placeholder TODO — no action needed

**Orchestrator note:** "Plan 04 shipped with a placeholder TODO for the
per-client PURL... you SHOULD update the Plan 04 Send Update email
template path to read `client.portalToken` instead of the placeholder."

**Finding:** Verified against the live source of `src/pages/api/send-update.ts`
(lines 120-162) and Plan 04's own SUMMARY § "Known Stubs":

> "In practice the code doesn't need a placeholder — the GROQ projection
> already safely returns undefined for the missing field, and the
> lazy-gen path handles that case correctly by calling setIfMissing +
> re-fetch. When Plan 05 adds the schema field, all existing client
> documents will continue to return undefined for portalToken until
> their first Send Update, so the lazy-gen path remains the first-write
> path. No TODO needed."

The send-update.ts handler already reads `client.portalToken` directly
(line 126: `let token = client.portalToken;`) with no placeholder string
or TODO comment. The code is already correct for the post-Plan-05
schema — Plan 05 adds the schema field, and the lazy-gen path
immediately starts writing to it on the next Send Update. Zero file
edits to send-update.ts from Plan 05.

The orchestrator's framing assumed a pre-existing placeholder in the
handler; research against the actual file content shows no such
placeholder exists. This is a correct no-op, not a skipped task.

## Authentication Gates

None encountered. Plan 05 is pure schema + API + UI work; no network
auth, no secrets, no OAuth. The existing admin session gate at
`clients.ts:18-25` covers the new `regenerate-portal-token` action
without any changes to session handling.

## Known Stubs

None. Every file in `files_modified` is fully implemented and covered
by tests. The `portalToken` field on client documents is intentionally
empty until a first Send Update or manual regeneration writes to it
(D-18 lazy-gen contract) — that's a runtime state, not a stub.

## Threat Flags

None. The threat model for Plan 05 is empty (`threat_refs: []` in the
plan frontmatter) because T-34-06 (PURL token enumeration via unhashed
storage) and T-34-07 (admin-role bypass on clients route) are mitigated
elsewhere:

- **T-34-06** (token enumeration): Plan 06 (client-dashboard) will add
  `portalTokenHash` to the session cookie so the middleware re-derives
  the hash on each request. Plan 05 writes the plain token to Sanity,
  but the token is never echoed back to un-authenticated callers
  (regenerate response goes only to the admin that triggered it, over
  an authenticated admin session). Hashing-at-rest is not required when
  the token acts purely as a "shared secret bookmark link" — which is
  the current design.
- **T-34-07** (admin-role bypass): mitigated by the existing admin
  session gate at `clients.ts:18-25`, which covers the new
  `regenerate-portal-token` action. Verified by the unit test "POST
  action='regenerate-portal-token' rejects non-admin session with 401".

No net-new network surface introduced. No new routes. The existing
`POST /api/admin/clients` handler gained a new action branch, all
behind the same admin gate as the 4 existing actions.

## Commits

| Hash | Message | Files |
|------|---------|-------|
| `5bef20c` | feat(34-05): add portalToken field + regenerate API action | 4 (client.ts, client.test.ts, clients.ts, clients.test.ts) |
| `d27bfc5` | feat(34-05): RegenerateLinkDialog + CopyLinkButton | 2 (RegenerateLinkDialog.tsx new, RegenerateLinkDialog.test.tsx flipped) |
| `d42cf8d` | feat(34-05): ClientChipWithRegenerate wrapper + project detail wire-up | 2 (ClientChipWithRegenerate.tsx new, projects/[projectId]/index.astro map swap) |

All 3 commits use normal `git commit` (no `--no-verify`; la-sprezzatura
has no pre-commit hooks installed). All land directly on `main` per the
sequential-mode orchestrator directive.

## Self-Check: PASSED

- **Created files (2):** `src/components/admin/RegenerateLinkDialog.tsx`,
  `src/components/admin/ClientChipWithRegenerate.tsx` — both present on
  disk and appear in their commits (`d27bfc5` and `d42cf8d`
  respectively, per `git show --stat`).
- **Modified files (6):** `src/sanity/schemas/client.ts`,
  `src/sanity/schemas/client.test.ts`,
  `src/pages/api/admin/clients.ts`,
  `src/pages/api/admin/clients.test.ts`,
  `src/components/admin/RegenerateLinkDialog.test.tsx`,
  `src/pages/admin/projects/[projectId]/index.astro` — all present in
  their commit diffs.
- **Commit hashes resolve:** `git log --oneline c160027..HEAD` shows
  the 3 Plan 05 commits in order.
- **Plan-subset test gate:** 24/24 passing in `npx vitest run
  src/sanity/schemas/client.test.ts src/pages/api/admin/clients.test.ts
  src/components/admin/RegenerateLinkDialog.test.tsx`.
- **Regression gate:** 94/94 green in the Wave 1+2+3 subset (10 test
  files, no failures).
- **tsc/astro check:** zero new errors in Plan 05 files; pre-existing
  Studio errors out of scope.
- **Working tree:** clean except the pre-existing
  `.planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md`
  modification that the orchestrator instructed me to leave alone.
- **@sanity/ui grep:** zero matches in both new components (Phase 33
  Tailwind + lucide-react contract held).
