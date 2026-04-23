# Phase 42: Trades Entity — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 42-trades-entity-routes-schema-and-display
**Areas discussed:** Sanity _type rename, Null relationship fallback, Route rename approach, 1099 scope in Phase 42, Relationship required field, Meta line missing segments

---

## Sanity _type Rename

| Option | Description | Selected |
|--------|-------------|----------|
| Keep `contractor` | Phase 40 decision stands — _type is plumbing, not UI | ✓ |
| Rename to `trade` | Aligns type name with entity concept; requires full migration | |

**User's choice:** Keep `contractor` as the Sanity document type.
**Notes:** "The rename would touch every GROQ query, API route, and middleware reference for zero functional benefit — `_type` is plumbing, not UI. The `relationship` field handles the semantics. Add a comment at the top of the schema file noting the UI-facing name is 'Trades' so future devs don't get confused."

---

## Null Relationship Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Default to 'Contractor' | Null = contractor everywhere in UI | ✓ |
| Show 'Contractor / Vendor' | Preserve Phase 40 label for unset records | |

**User's choice:** Default to 'Contractor'
**Notes:** Consistent with milestone decision. Clean ternary: `relationship === "vendor" ? "Vendor" : "Contractor"`.

---

## Route Rename Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Hard rename + redirect | Move files + add Astro/Vercel redirect rule | |
| Hard rename only | Move files, update all internal refs, old path 404s | ✓ |

**User's choice:** Hard rename only
**Notes:** Internal admin tool. No external links known. Redirect adds complexity for no benefit.

---

## 1099 Scope in Phase 42

| Option | Description | Selected |
|--------|-------------|----------|
| Schema-only: add checklistItems field | Foundation for Phase 43 checklist UI | ✓ |
| Schema + remove standalone display | Also audit/strip any 1099-specific rendering from Phase 40 | |

**User's choice:** Schema-only
**Notes:** Phase 40's docType: "1099" is already in place. Phase 42 adds the checklistItems data structure. Phase 43 renders the UI.

---

## Relationship Field: Required?

| Option | Description | Selected |
|--------|-------------|----------|
| Required on new records | Must select contractor or vendor before saving | ✓ |
| Optional | Nullable on new records too | |

**User's choice:** Required
**Notes:** Existing records stay nullable; UI fallback handles them. New records must explicitly choose.

---

## Meta Line: Missing Segments

| Option | Description | Selected |
|--------|-------------|----------|
| Skip the segment | Omit missing fields; separators adjust dynamically | ✓ |
| Show a placeholder | Always show '—' or 'No trade' for empty slots | |

**User's choice:** Skip the segment
**Notes:** Same pattern as Phase 41 address rendering — filter(Boolean) before joining with separator.

---

## Claude's Discretion

- Exact shape of checklistItems schema addition
- Whether relationship renders as radio group or dropdown
- Sanity validation message for required relationship field

## Deferred Ideas

- Redirect from /admin/contractors to /admin/trades (not needed for internal tool)
- Completeness indicator → Phase 43
- Document checklist UI → Phase 43
- Settings config for checklist item types → Phase 43
