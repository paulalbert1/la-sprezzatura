# Phase 43: Document Checklists, Settings Config, and Completeness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 43-document-checklists-settings-config-and-completeness
**Areas discussed:** Checklist UI design, docType ↔ checklist matching, Completeness indicator scope, Settings section structure

---

## Checklist UI design

| Option | Description | Selected |
|--------|-------------|----------|
| Checklist replaces the list | The current flat "Documents" section becomes a structured checklist. Each row shows a required item, its status (uploaded / missing), and an upload button per row. | ✓ |
| Checklist above, list below | A separate checklist panel (read-only status) above the existing flat list and upload button. | |
| Inline status badges only | Keep flat list as-is, add status badges in the section header. | |

**User's choice:** Checklist replaces the list  
**Notes:** User confirmed the mockup showing `[x] W-9 / [ ] Trade license` row layout.

---

| Option | Description | Selected |
|--------|-------------|----------|
| One doc per item; extras get an "Other" row | Each checklist item holds one document. Unmatched or overflow docs go to "Other documents." | ✓ |
| Multiple docs per item, all shown | A checklist item can have multiple documents; row expands. | |
| All docs in one unified list | Checklist rows absorb all uploaded docs as best-match; no separate "Other." | |

**User's choice:** One doc per item; extras get an "Other" row  
**Notes:** Confirmed the "Other documents" section mockup.

---

## docType ↔ checklist matching

| Option | Description | Selected |
|--------|-------------|----------|
| Implicit via upload row — store label as docType | docType = checklist item label. No dropdown. Simple, no extra fields. | ✓ |
| Store a stable key separate from the label | Each item has a slug key; document stores the slug. Rename-safe. | |
| Keep existing docType; add a new checklistItemId field | Leave docType untouched; add separate field. | |

**User's choice:** Implicit via upload row — store label as docType  
**Notes:** None.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show in Other Documents — no migration | Existing docs with old types (insurance, contract) fall into "Other documents." No data migration. Consistent with D-18. | ✓ |
| Add a display alias map in code | Static map translates old slugs to new labels at render time. | |
| One-time migration on first load | Background API call re-tags documents on first detail page load. | |

**User's choice:** Show in Other Documents — no migration  
**Notes:** Consistent with established no-migration policy (D-18).

---

## Completeness indicator scope

| Option | Description | Selected |
|--------|-------------|----------|
| Documents only | Amber dot only when checklist items are missing uploaded documents. Fields like phone/trades/address not counted. | ✓ |
| Documents + relationship | Amber if checklist items missing OR relationship unset (already schema-required). | |
| Documents + name/email/trades | Amber if checklist items missing, OR name/email missing, OR no trades assigned. | |

**User's choice:** Documents only  
**Notes:** Keeps the signal focused on document readiness.

---

## Settings section structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two separate collapsibles | "Contractor Checklist" and "Vendor Checklist" as two separate CollapsibleSection entries. Consistent with Trades pattern. | ✓ |
| One collapsible with tabs | Single "Document Checklists" section with Contractor/Vendor tabs inside. | |
| One collapsible with divider | Single "Document Checklists" section with a label+divider between the two types. | |

**User's choice:** Two separate collapsibles  
**Notes:** Follows the established pattern from Phase 40.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Disabled delete button with tooltip | Trash icon grayed out; tooltip: "This type has documents — remove documents from all trades first." | ✓ |
| Error on save | Allow clicking delete; show error at save time. | |
| Inline warning label | Show locked badge or "in use by N records" text; delete button hidden. | |

**User's choice:** Disabled delete button with tooltip  
**Notes:** Clean inline UX, doesn't block the save flow.

---

## Claude's Discretion

- Exact placement of amber indicator in EntityListPage (column vs. inline dot)
- "Other documents" upload interaction (empty docType vs. freeform label prompt)
- Whether in-use type check is done on Settings page load or lazily at delete time

## Deferred Ideas

None.
