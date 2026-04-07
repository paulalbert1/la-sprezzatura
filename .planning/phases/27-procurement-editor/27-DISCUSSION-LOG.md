# Phase 27: Procurement Editor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the discussion.

**Date:** 2026-04-06
**Phase:** 27-procurement-editor
**Mode:** discuss
**Areas discussed:** Inline status editing, Table vs list layout, Add/remove items flow, File uploads in admin

---

## Decisions Made

### Inline status editing
| Question | Answer |
|----------|--------|
| How should status changes work? | Inline dropdown + instant save |
| Detail | Clicking status badge opens dropdown with all 6 stages. Selecting a new stage immediately patches Sanity via API route. No form submission needed. Matches Phase 23 D-02 intent. |

### Table vs list layout
| Question | Answer |
|----------|--------|
| What layout for the procurement page? | Table with inline editing |
| User modification | User requested carrier icon links instead of raw tracking numbers. Carrier detected from trackingUrl domain. Live tracking status deferred to Phase 27.1. |

### Tracking scope decision
| Question | Answer |
|----------|--------|
| Include live carrier tracking API in Phase 27? | Phase 27.1 fast-follow |
| Detail | User initially wanted live tracking status on page load. After reviewing scope (API keys, carrier detection, caching, error handling), agreed to defer to Phase 27.1. Phase 27 ships with carrier icon links parsed from trackingUrl domain. |

### Add/remove items flow
| Question | Answer |
|----------|--------|
| How should adding items work? | Slide-out panel from right |
| How should removing items work? | Confirm dialog on three-dot menu |
| Detail | Slide-out panel reused for both add and edit. Full form with all procurement fields. Table stays visible for context. Remove via confirmation dialog. |

### File uploads
| Question | Answer |
|----------|--------|
| How should file uploads work? | Inline in slide-out panel |
| Detail | Drag-and-drop zone or file picker inside the edit/add panel. Uploads to Vercel Blob via API route. Thumbnails for images, filename+size for documents. Each file gets a label field. |

## Deferred Ideas

- **Phase 27.1: Live Carrier Tracking** — Server-side fetch from carrier APIs. User explicitly asked for this but agreed to fast-follow approach.
- **Drag-to-reorder** — Phase 23 included drag handles (D-07). Not prioritized for admin table layout.
