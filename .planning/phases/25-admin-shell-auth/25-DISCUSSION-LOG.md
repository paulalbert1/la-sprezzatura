# Phase 25: Admin Shell + Auth - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 25-admin-shell-auth
**Areas discussed:** Session strategy, Dashboard landing, Sidebar navigation, Login page styling

---

## Session Strategy

### Cookie approach
| Option | Description | Selected |
|--------|-------------|----------|
| Same cookie (Recommended) | Add 'admin' to existing role union. One cookie, one Redis lookup. Can't be client AND admin simultaneously. | ✓ |
| Separate cookie | Second cookie (admin_session) for independent sessions. More complex. | |

**User's choice:** Same cookie
**Notes:** None — straightforward single-cookie approach.

### Admin identity check
| Option | Description | Selected |
|--------|-------------|----------|
| ADMIN_EMAIL env var (Recommended) | Hardcode Liz's email in env var. Simple, single-user. | ✓ |
| Admin whitelist in Sanity | Sanity document listing admin emails. More flexible. | |

**User's choice:** ADMIN_EMAIL env var
**Notes:** None.

### Verify endpoint
| Option | Description | Selected |
|--------|-------------|----------|
| Shared verify (Recommended) | /portal/verify reads role from token, redirects accordingly. | ✓ |
| Separate /admin/verify | Dedicated admin verify page. Cleaner separation but duplicates logic. | |

**User's choice:** Shared verify
**Notes:** None.

---

## Dashboard Landing

### Dashboard content
| Option | Description | Selected |
|--------|-------------|----------|
| Summary cards (Recommended) | Stat cards (projects, orders, overdue) + quick links. Pulse check at a glance. | ✓ |
| Empty shell with nav only | Just sidebar + welcome. Minimal Phase 25. | |
| Quick links grid | Large clickable cards for each section. No stats. | |

**User's choice:** Summary cards
**Notes:** None.

### Greeting
| Option | Description | Selected |
|--------|-------------|----------|
| Name from ADMIN_EMAIL lookup | "Welcome back, Liz" — personalized. | ✓ |
| Generic greeting | "Studio Dashboard" — no personalization. | |

**User's choice:** Name from ADMIN_EMAIL lookup
**Notes:** None.

### Stats data source
| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder cards (Recommended) | Styled cards with "--" values. Real data wired in Phases 26-29. | ✓ |
| Live counts now | GROQ queries for real counts. Adds scope to shell phase. | |

**User's choice:** Placeholder cards
**Notes:** None.

---

## Sidebar Navigation

### Sidebar behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Fixed width (Recommended) | Always visible ~240px. Desktop-first. | ✓ |
| Collapsible to icons | Toggle between full and icon-only rail. | |

**User's choice:** Fixed width
**Notes:** None.

### Icons
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with icons (Recommended) | Lucide icons alongside text labels. | ✓ |
| Text only | Clean text labels without icons. | |

**User's choice:** Yes, with icons
**Notes:** None.

### Top bar
| Option | Description | Selected |
|--------|-------------|----------|
| Page title only (Recommended) | Current section name + logout. Breadcrumbs deferred to Phase 26+. | ✓ |
| Title + breadcrumbs now | Full breadcrumb trail from the start. | |

**User's choice:** Page title only
**Notes:** None.

---

## Login Page Styling

### Visual style
| Option | Description | Selected |
|--------|-------------|----------|
| Same portal style (Recommended) | Reuse warm-neutral branded look. Change heading text only. | ✓ |
| Distinct admin styling | Darker tones, utilitarian feel. More design work. | |
| You decide | Claude picks approach matching portal aesthetic. | |

**User's choice:** Same portal style
**Notes:** None.

### Heading text
| Option | Description | Selected |
|--------|-------------|----------|
| "Studio Admin" | Clear, professional. | |
| "La Sprezzatura Admin" | Full brand name, formal. | |
| "Welcome back" | Friendly, personal. Subtitle: "Sign in to your studio dashboard" | ✓ |

**User's choice:** "Welcome back"
**Notes:** None.

---

## Claude's Discretion

- Exact Tailwind classes for all components
- Lucide icon choices per nav section
- LoginForm reuse vs new component
- ADMIN_NAME implementation detail
- Spacing, shadows, hover states
- ADMIN_EMAIL-not-set error handling

## Deferred Ideas

None — discussion stayed within phase scope.
