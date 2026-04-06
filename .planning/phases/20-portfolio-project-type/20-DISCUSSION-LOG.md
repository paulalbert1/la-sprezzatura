# Phase 20: Portfolio Project Type - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 20-portfolio-project-type
**Areas discussed:** Spawn trigger condition, Schema & field design, Image selection UX, Studio navigation & naming

---

## Spawn Trigger Condition

| Option | Description | Selected |
|--------|-------------|----------|
| Project is completed (Recommended) | Show button when projectStatus === 'completed'. Simple, no milestone name matching. | ✓ |
| Pipeline at Closeout stage | Show button when pipelineStage === 'closeout'. | |
| Any milestone named 'Client Sign-off' is checked | Look for a milestone with name matching 'Client Sign-off' and completed === true. | |

**User's choice:** Project is completed
**Notes:** None — straightforward selection.

### Follow-up: Duplicate Prevention

| Option | Description | Selected |
|--------|-------------|----------|
| Hide after first spawn (Recommended) | Query for existing portfolioProject with matching sourceAdminProjectId. One per admin project. | ✓ |
| Always show, allow multiple | Let Liz create multiple portfolio versions from the same admin project. | |

**User's choice:** Hide after first spawn
**Notes:** None.

---

## Schema & Field Design

### Narrative Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Lean — PORT-01 only (Recommended) | title, location, description, tags, images only. | |
| Include narrative fields | Also copy challenge, approach, outcome, testimonial, completionDate. | |
| PORT-01 + selected extras | PORT-01 plus roomType, style, featured, order. No rich text blocks. | |

**User's choice:** Custom — "narrative, description, title, photos, tags"
**Notes:** User wants narrative fields (challenge, approach, outcome, testimonial) included alongside PORT-01 fields.

### Additional Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include all four (Recommended) | roomType, style, featured, order. | |
| Just roomType and style | Filtering tags only. | |
| No, tags field covers it | Freeform tags replace roomType/style. | |

**User's choice:** Include all four except style — "1 - but not style"
**Notes:** roomType, featured, order carry over. Style excluded — tags can cover design style more flexibly.

### Hero Image

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated heroImage field (Recommended) | Separate heroImage + images gallery, auto-copy admin project's heroImage. | ✓ |
| First gallery image is hero | Single images array only. First image treated as hero. | |

**User's choice:** Dedicated heroImage field
**Notes:** None.

### Slug Field

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, auto-generate from title (Recommended) | slug field with source: 'title'. Needed for public site /portfolio/[slug] routing. | ✓ |
| No slug for now | Skip slug. Public site rendering switch is a future concern. | |

**User's choice:** Yes, auto-generate from title
**Notes:** None.

---

## Image Selection UX

### Selection Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Thumbnail grid with checkboxes (Recommended) | Grid of thumbnails with checkboxes, Select All/None, hero image pre-checked and starred. | ✓ |
| Simple list with toggles | Filenames/captions in a list with toggle switches. Less visual. | |
| All or nothing | Binary: copy ALL images or NONE. Simplest approach. | |

**User's choice:** Thumbnail grid with checkboxes
**Notes:** None.

### No Photos Path

| Option | Description | Selected |
|--------|-------------|----------|
| Create with empty gallery (Recommended) | Create portfolio project with text fields but no images. Liz can upload later. | ✓ |
| Block creation without photos | Don't allow creating until project has photos. | |

**User's choice:** Create with empty gallery
**Notes:** None.

---

## Studio Navigation & Naming

### Sidebar Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Rename + add new list (Recommended) | Rename 'Portfolio Projects' to 'Projects'. Add 'Portfolio' list item for portfolioProject. | ✓ |
| Group under one heading | 'Portfolio Projects' parent with 'Admin Projects' and 'Public Portfolio' sub-items. | |
| Keep current name, add Portfolio below | Don't rename. Add 'Portfolio' as new list item. | |

**User's choice:** Rename + add new list
**Notes:** None.

### Navbar Tab

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar only, no navbar tab (Recommended) | portfolioProject is secondary; accessed from sidebar only. | |
| Add navbar tab | Add 'Portfolio' tab to navbar alongside Projects, Clients, etc. | ✓ |

**User's choice:** Add navbar tab
**Notes:** User wants Portfolio as first-class navigation, overriding the recommendation for sidebar-only.

---

## Claude's Discretion

- Dialog layout and styling for the spawn modal
- Exact thumbnail size and grid layout
- Whether to show a success toast/redirect after creation
- Preview configuration for portfolioProject in sidebar
- Whether heroImage hotspot/crop settings are copied

## Deferred Ideas

- Public site rendering from portfolioProject (future phase)
- Ongoing sync between admin project and portfolio version (explicitly out of scope)
