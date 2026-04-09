---
phase: 31-client-contractor-and-portfolio-management
plan: 03
subsystem: admin-portfolio
tags: [portfolio-grid, portfolio-edit, drag-and-drop, dnd-kit, public-portfolio]
dependency_graph:
  requires: [portfolio-api, admin-groq-queries, project-schema-portfolio-fields]
  provides: [portfolio-grid-page, portfolio-edit-form, portfolio-arrange-page, public-portfolio-query]
  affects: [public-portfolio-page, project-schema]
tech_stack:
  added: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
  patterns: [drag-and-drop-reorder, portfolio-toggle, image-upload-with-preview, room-tags]
key_files:
  created:
    - src/components/admin/PortfolioGrid.tsx
    - src/components/admin/PortfolioEditForm.tsx
    - src/components/admin/PortfolioArrange.tsx
    - src/pages/admin/portfolio/index.astro
    - src/pages/admin/portfolio/[projectId]/edit.astro
    - src/pages/admin/portfolio/arrange.astro
  modified:
    - src/sanity/queries.ts
    - package.json
    - package-lock.json
decisions:
  - "Used @dnd-kit for drag-and-drop reorder rather than HTML5 drag API for better accessibility and mobile support"
metrics:
  duration: 9min
  completed: "2026-04-09T19:55:00Z"
---

## Summary

Built the portfolio management section with grid view, edit form, drag-and-drop arrange, and updated public portfolio query.

## What Was Built

### React Components (810 LOC total)
- **PortfolioGrid** (279 LOC): Grid view of completed projects with show/hide toggles, thumbnail previews, portfolio status badges, and links to edit and arrange pages
- **PortfolioEditForm** (315 LOC): Edit form for portfolio fields (title override, description, featured image upload, room tags, display order)
- **PortfolioArrange** (216 LOC): Drag-and-drop reorder interface using @dnd-kit — saves new order to API via transaction batch

### Astro Pages (3 routes)
- `/admin/portfolio` — Portfolio grid overview
- `/admin/portfolio/[projectId]/edit` — Portfolio detail edit form
- `/admin/portfolio/arrange` — Drag-and-drop arrangement page

### Query Updates
- Updated `getPublicPortfolio` in queries.ts to filter by `showInPortfolio == true` and sort by `portfolioOrder`

### Dependencies Added
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` for drag-and-drop reorder

## Commits

1. `e40976f` feat(31-03): add PortfolioGrid and PortfolioEditForm components with @dnd-kit
2. `2815b0d` feat(31-03): add PortfolioArrange component and portfolio admin pages
3. `6ac3763` feat(31-03): update public portfolio query to filter by showInPortfolio

## Deviations

None.

## Self-Check: PASSED

- [x] All 3 tasks executed
- [x] Each task committed individually
- [x] All 6 new files created, 3 files modified
- [x] @dnd-kit dependencies installed
- [x] Public portfolio query updated
