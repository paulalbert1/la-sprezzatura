# Phase 23: Custom List UI - Research

**Researched:** 2026-04-06
**Domain:** Sanity Studio custom array item components, @sanity/ui primitives, inline patching
**Confidence:** HIGH

## Summary

Phase 23 builds a custom interactive list component for procurement items in Sanity Studio. The component replaces the default array item preview with a rich row showing status badges, overdue dates, manufacturer names, tracking links, and an overflow menu. It also fixes the dialog backdrop overlay.

The technical challenge centers on Sanity's `components: { item: ... }` API for `defineArrayMember`. The `ObjectItemProps` interface provides everything needed: `value` for reading item data, `inputProps.onChange` for scoped patching (no need for `useDocumentPane`), `renderDefault` for delegating default behavior (DnD, dialog), and `onOpen`/`onClose`/`onRemove` for item lifecycle. All UI elements use `@sanity/ui` primitives (Badge, MenuButton, Menu, MenuItem, Card, Text, Flex, Box) and `@sanity/icons`.

**Primary recommendation:** Wrap `renderDefault(props)` in a custom layout, adding interactive elements (status badge dropdown, overdue dates, tracking links, overflow menu) alongside the default item rendering. Use `props.inputProps.onChange(set(newValue, ['status']))` for inline status patching -- this is scoped to the array item and avoids the internal `useDocumentPane` API entirely.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Inline status badge dropdown shows all 6 pipeline stages: Not Yet Ordered, Ordered, In-transit, Warehouse, Delivered, Installed. "Not Yet Ordered" included so Liz can reset items.
- **D-02:** Selecting a stage updates the status field inline via Sanity patch and persists immediately. Edit dialog does NOT open.
- **D-03:** Badge colors use Sanity tones from `procurementStages.ts` (PROCUREMENT_STAGE_META). Badge is the interactive trigger.
- **D-04:** New `trackingUrl` field (type: string, optional) added to `procurementItem` schema after `trackingNumber`.
- **D-05:** Tracking number displays as gray monospace text. If `trackingUrl` set, rendered as clickable `<a>` link (new tab). Hover darkens text.
- **D-06:** `trackingUrl` field in edit pane is plain string input with placeholder "https://www.fedex.com/..."
- **D-07:** Collapsed row layout (left to right): drag handle, item name (bold), manufacturer (gray, below name), colored status badge (right of name), expected delivery date (right side, red if overdue), tracking number (gray monospace below delivery date), three-dot overflow menu (far right).
- **D-08:** Prices, quantity, orderDate, installDate, files, notes are edit-pane-only.
- **D-09:** Overdue = `expectedDeliveryDate` in past AND status not "delivered" or "installed".
- **D-10:** No `expectedDeliveryDate` set = no date in row.
- **D-11:** No `trackingNumber` set = tracking line omitted.
- **D-12:** Overflow menu: exactly Edit + Remove. No additional actions.
- **D-13:** Edit pane dialog must have visible gray semi-transparent overlay (CSS fix in studio.css).
- **D-14:** Implemented via `components: { item: ProcurementListItem }` on `procurementItem` defineArrayMember.
- **D-15:** No new npm dependencies. All capabilities use @sanity/ui primitives, Sanity patch API, and native DOM/React.

### Claude's Discretion
- Exact CSS selector for dialog backdrop overlay fix
- Internal state management for dropdown open/close within ProcurementListItem
- Animation/transition details on the dropdown
- Exact pixel spacing and typography weights in the list row
- How the drag handle integrates with Sanity's native DnD

### Deferred Ideas (OUT OF SCOPE)
- Carrier API integration for auto-fetching estimated arrival from tracking number
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIST-01 | Colored status badge with inline dropdown for status changes | `ObjectItemProps.inputProps.onChange(set(newStatus, ['status']))` for scoped patching; `@sanity/ui` Badge + MenuButton + Menu + MenuItem for UI; `PROCUREMENT_STAGE_META` for tone colors |
| LIST-02 | Overdue dates displayed in red | Compare `expectedDeliveryDate` against current date; check `status` is not "delivered"/"installed"; style with inline `color: red` or @sanity/ui `tone="critical"` |
| LIST-03 | Drag handles for reordering | `renderDefault(props)` includes Sanity's native DnD (via @dnd-kit/sortable) and drag handle automatically |
| LIST-04 | Three-dot overflow menu with Edit + Remove | `@sanity/ui` MenuButton + Menu + MenuItem with EllipsisVerticalIcon; `props.onOpen()` for Edit, `props.onRemove()` for Remove |
| LIST-05 | Tracking numbers as gray monospace text, clickable if trackingUrl set | Conditional `<a>` element with `target="_blank"` when `trackingUrl` exists; inline style `fontFamily: monospace, color: gray` |
| LIST-06 | Custom list row layout with name, manufacturer, badge, dates, tracking | Flex/Box layout wrapping `renderDefault(props)` output with custom elements positioned per D-07 |
| EDIT-01 | Gray background overlay behind edit dialog | CSS rule in `studio.css` targeting `[data-ui="Dialog"]` to set `background: rgba(0,0,0,0.4)` |
| EDIT-02 | Edit pane shows all fields correctly | New `trackingUrl` field added to schema; `renderDefault` handles the edit pane natively |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sanity | 5.16.0 | CMS framework, ObjectItemProps API, patch system | Already installed, provides item component architecture |
| @sanity/ui | 3.1.13 | Badge, MenuButton, Menu, MenuItem, Card, Text, Flex, Box | Already installed, native Studio UI primitives |
| @sanity/icons | 3.7.4 | DragHandleIcon, EllipsisVerticalIcon, EditIcon, TrashIcon | Already installed, consistent icon set |
| react | (bundled) | Component framework, hooks (useState, useCallback) | Bundled with Sanity |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/sortable | 7.0.2 | Drag-and-drop (Sanity dependency) | NOT used directly -- DnD comes free via renderDefault(props) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `inputProps.onChange` | `useDocumentPane().onChange` | `useDocumentPane` requires absolute paths and is internal API (import from `sanity/structure`); `inputProps.onChange` is public, scoped to the item, and simpler |
| Fully custom component | `renderDefault` wrapper | Full custom loses DnD, menu defaults; wrapping preserves all native behavior |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/sanity/
├── components/
│   ├── ProcurementListItem.tsx   # NEW: custom array item component
│   ├── NetPriceDisplay.tsx       # existing custom input component
│   └── BlobFileInput.tsx         # existing custom input component
├── schemas/
│   ├── project.ts                # MODIFIED: add trackingUrl field, add components.item
│   └── project.test.ts           # MODIFIED: add tests for trackingUrl, components.item
├── studio.css                    # MODIFIED: add dialog backdrop overlay fix
└── ...
```

### Pattern 1: Custom Array Item with renderDefault Wrapper
**What:** A custom item component that wraps `renderDefault(props)` and adds interactive elements alongside.
**When to use:** When you need custom interactivity on array items but want to preserve DnD, native menu, and dialog behavior.
**Example:**
```typescript
// Source: Sanity official guide + verified ObjectItemProps type definitions
import { type ObjectItemProps, PatchEvent, set } from 'sanity'
import { Badge, Box, Flex, Menu, MenuButton, MenuItem, Button } from '@sanity/ui'
import { EllipsisVerticalIcon, EditIcon, TrashIcon } from '@sanity/icons'
import { useCallback, useState } from 'react'
import { PROCUREMENT_STAGES, getProcurementTone } from '../../lib/procurementStages'

export function ProcurementListItem(props: ObjectItemProps) {
  const { value, renderDefault, inputProps, onOpen, onRemove } = props

  // Inline status update -- scoped to this array item
  const handleStatusChange = useCallback((newStatus: string) => {
    inputProps.onChange(PatchEvent.from(set(newStatus, ['status'])))
  }, [inputProps])

  return (
    <Flex gap={3} align="center">
      {/* renderDefault provides drag handle + native behavior */}
      <Box flex={1}>{renderDefault(props)}</Box>
      {/* Custom interactive elements */}
      <Badge tone={getProcurementTone(value?.status)}>
        {value?.status}
      </Badge>
    </Flex>
  )
}
```

### Pattern 2: Scoped Inline Patching via inputProps.onChange
**What:** Patch a field within an array item without needing document-level context.
**When to use:** When the custom item component needs to update a field value inline.
**Example:**
```typescript
// Source: Verified from Sanity source -- ArrayOfObjectsItem.handleChange
// inputProps.onChange is scoped: paths are relative to the array item
// set(value, ['fieldName']) patches 'fieldName' on THIS item
inputProps.onChange(PatchEvent.from(set('ordered', ['status'])))

// Under the hood, Sanity prefixes with {_key: item._key} automatically
// No need for useDocumentPane() or absolute paths
```

### Pattern 3: Dialog Backdrop CSS Fix
**What:** A targeted CSS rule to restore the gray semi-transparent overlay behind edit dialogs.
**When to use:** When the studio.css global `!important` overrides break dialog backdrop transparency.
**Example:**
```css
/* Source: Sanity UI Dialog renders with data-ui="Dialog" */
/* The dialogStyle function sets background: color.backdrop */
/* Global --card-bg-color override breaks this */
[data-ui="Dialog"] {
  background: rgba(0, 0, 0, 0.4) !important;
}
```

### Anti-Patterns to Avoid
- **Fully custom item without renderDefault:** Loses Sanity's native DnD (@dnd-kit/sortable integration relies on internal `SortableItemIdContext`), native menu, and dialog management. Always call `renderDefault(props)`.
- **Using useDocumentPane for item-level patches:** Requires absolute paths including `{_key: itemKey}`, is imported from `sanity/structure` (internal), and breaks if Sanity changes the API. Use `inputProps.onChange` instead.
- **Hardcoding stage values or colors:** Always consume from `procurementStages.ts` (PROCUREMENT_STAGES, PROCUREMENT_STAGE_META, getProcurementTone). This is the single source of truth established in Phase 22.
- **Custom drag handle without @dnd-kit context:** The internal `DragHandle` component uses `useSortable` with a `SortableItemIdContext` provided by the parent. Rendering a custom drag icon without this context won't enable actual dragging.
- **Patching with set() without PatchEvent.from():** Always wrap in `PatchEvent.from()` for the scoped `inputProps.onChange` -- bare `set()` returns a `FormSetPatch`, not a `PatchEvent`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status badge with tone colors | Custom colored div | `@sanity/ui` Badge with `tone` prop | Tones inherit from Sanity theme; custom colors will break with theme changes |
| Dropdown menu | Custom popover/select | `@sanity/ui` MenuButton + Menu + MenuItem | Handles positioning, keyboard nav, focus management, click-outside |
| Drag-and-drop | Custom DnD implementation | `renderDefault(props)` | Sanity's DnD uses @dnd-kit with internal contexts; reimplementing is fragile |
| Array item patching | Direct Sanity client mutation | `inputProps.onChange(PatchEvent.from(set(...)))` | Scoped to item, integrates with form state, handles optimistic updates |
| Date comparison | Custom date parsing | `new Date(dateString)` comparison | Sanity stores dates as ISO strings; native Date comparison works directly |

**Key insight:** Sanity's item component API is designed for wrapping, not replacing. The `renderDefault` + custom elements pattern preserves all framework behavior while adding interactivity.

## Common Pitfalls

### Pitfall 1: useDocumentPane Import Path
**What goes wrong:** Importing `useDocumentPane` from the wrong path or relying on it when unnecessary.
**Why it happens:** The Sanity guide shows `import { useDocumentPane } from 'sanity/desk'` (deprecated) but current path is `sanity/structure`. Both are internal API.
**How to avoid:** Use `props.inputProps.onChange` instead -- it's public API, scoped to the item, and doesn't require document-level context.
**Warning signs:** Import errors mentioning "sanity/desk" or "sanity/structure"; needing to construct full document paths with `{_key: ...}`.

### Pitfall 2: Studio.css !important Cascade Breaking Badge Tones
**What goes wrong:** The global `--card-bg-color` and `--card-fg-color` overrides in studio.css break Badge tone colors.
**Why it happens:** Studio.css uses `!important` on broad selectors (`[data-ui]`, `[data-scheme]`) which override Sanity's tone-specific CSS variables.
**How to avoid:** Phase 22 already fixed the Badge selector issue (D-10 from Phase 22). Verify the fix is in place before implementing Badge-based status dropdowns. The dialog backdrop fix uses a similar targeted override pattern.
**Warning signs:** All badges appearing the same color regardless of `tone` prop.

### Pitfall 3: Overdue Logic Edge Cases
**What goes wrong:** Items show as overdue when they shouldn't (delivered items, items without dates).
**Why it happens:** Not checking all three conditions: date is in the past AND status is not "delivered" AND status is not "installed".
**How to avoid:** Extract overdue logic into a pure function with clear conditions; test all edge cases.
**Warning signs:** Delivered items showing red dates; items without expectedDeliveryDate showing "overdue".

### Pitfall 4: MenuButton Click Event Propagation
**What goes wrong:** Clicking the status badge dropdown or overflow menu opens the edit dialog instead of (or in addition to) the dropdown.
**Why it happens:** The default item row has a click handler that calls `onOpen()`. If clicks on the badge/menu bubble up, they trigger the edit dialog.
**How to avoid:** Call `event.stopPropagation()` on badge/menu click handlers to prevent the click from reaching the row's default click handler.
**Warning signs:** Edit dialog opening when clicking on the status badge or overflow menu.

### Pitfall 5: PatchEvent vs FormPatch
**What goes wrong:** Calling `inputProps.onChange(set(value, path))` directly without wrapping in `PatchEvent.from()`.
**Why it happens:** The `onChange` type accepts `FormPatch | FormPatch[] | PatchEvent`, so bare `set()` may seem to work, but the internal `handleChange` in `ArrayOfObjectsItem` expects to call `.prepend()` and `.prefixAll()` which are PatchEvent methods.
**How to avoid:** Always use `PatchEvent.from(set(value, path))`.
**Warning signs:** Patches not being applied; errors about `.prepend` or `.prefixAll` being undefined.

### Pitfall 6: Dialog Backdrop CSS Selector Specificity
**What goes wrong:** The dialog backdrop fix doesn't take effect because studio.css global overrides have higher specificity.
**Why it happens:** The global `[data-ui]` selector with `!important` overrides theme-computed backdrop colors.
**How to avoid:** Use a more specific selector like `[data-ui="Dialog"]` with `!important` to override the global rule. Test visually after adding the rule.
**Warning signs:** Dialog overlay still transparent after adding CSS rule.

## Code Examples

Verified patterns from Sanity source code and type definitions:

### ObjectItemProps Interface (from sanity v5.16.0 types)
```typescript
// Source: node_modules/sanity/lib/_chunks-dts/ActiveWorkspaceMatcherContext.d.ts:10491
interface ObjectItemProps<Item extends ObjectItem = ObjectItem> {
  value: Item;                    // The current item data
  path: Path;                     // Array path to this item
  index: number;                  // Position in the array
  schemaType: ObjectSchemaType;   // Schema definition
  parentSchemaType: ArraySchemaType;

  // Lifecycle
  open: boolean;                  // Whether edit dialog is open
  onOpen: () => void;             // Open edit dialog
  onClose: () => void;            // Close edit dialog
  onRemove: () => void;           // Remove item from array

  // Collapse (for inline editing)
  collapsed: boolean | undefined;
  collapsible: boolean | undefined;
  onCollapse: () => void;
  onExpand: () => void;

  // Form
  inputProps: Omit<ObjectInputProps, 'renderDefault'>; // Includes onChange
  children: ReactNode;            // Rendered form inputs

  // Rendering
  renderDefault: (props: ItemProps) => JSX.Element;

  // Read-only
  readOnly?: boolean;
  changed: boolean;
}
```

### Inline Status Patching
```typescript
// Source: Verified from Sanity source (ArrayOfObjectsItem.handleChange, line 19051)
// inputProps.onChange auto-prefixes paths with {_key: item._key}
import { PatchEvent, set, type ObjectItemProps } from 'sanity'

const handleStatusChange = useCallback((newStatus: string) => {
  // Patches only the 'status' field on THIS array item
  props.inputProps.onChange(PatchEvent.from(set(newStatus, ['status'])))
}, [props.inputProps])
```

### Overdue Date Logic
```typescript
// Pure function for testability
import type { ProcurementStageKey } from '../../lib/procurementStages'

export function isOverdue(
  expectedDeliveryDate: string | undefined,
  status: ProcurementStageKey | string | undefined,
): boolean {
  if (!expectedDeliveryDate) return false
  if (status === 'delivered' || status === 'installed') return false
  return new Date(expectedDeliveryDate) < new Date()
}
```

### Status Badge Dropdown (using @sanity/ui)
```typescript
// Source: @sanity/ui v3.1.13 types (MenuButton, Menu, MenuItem, Badge)
import { Badge, Menu, MenuButton, MenuItem } from '@sanity/ui'
import { PROCUREMENT_STAGES, getProcurementTone } from '../../lib/procurementStages'

// MenuButton props: { button: JSX.Element, menu: JSX.Element, id: string }
// MenuItem props: { text: ReactNode, tone?: SelectableTone, onClick?: () => void }
<MenuButton
  id={`status-${value._key}`}
  button={
    <Badge
      tone={getProcurementTone(value.status)}
      style={{ cursor: 'pointer' }}
    >
      {PROCUREMENT_STAGE_META[value.status]?.title ?? value.status}
    </Badge>
  }
  menu={
    <Menu>
      {PROCUREMENT_STAGES.map((stage) => (
        <MenuItem
          key={stage.value}
          text={stage.title}
          tone={stage.tone}
          pressed={value.status === stage.value}
          onClick={() => handleStatusChange(stage.value)}
        />
      ))}
    </Menu>
  }
/>
```

### Dialog Backdrop CSS Fix
```css
/* Source: Sanity UI Dialog renders with data-ui="Dialog" (index.mjs:900)
   The dialogStyle function (line 659) sets background: color.backdrop
   but studio.css global !important overrides break this */

/* Fix: target Dialog specifically */
[data-ui="Dialog"] {
  background: rgba(0, 0, 0, 0.4) !important;
}
```

### Schema Addition: trackingUrl Field
```typescript
// Source: project.ts pattern for existing fields
// Position: immediately after trackingNumber (field #11)
defineField({
  name: 'trackingUrl',
  title: 'Tracking URL',
  type: 'string',
  description: 'Full tracking URL (e.g., https://www.fedex.com/...)',
}),
```

### Schema: Registering Custom Item Component
```typescript
// Source: CONTEXT.md D-14 + Sanity defineArrayMember types
import { ProcurementListItem } from '../components/ProcurementListItem'

defineArrayMember({
  type: 'object',
  name: 'procurementItem',
  components: {
    item: ProcurementListItem,
  },
  fields: [
    // ... existing fields ...
  ],
  // preview config can be simplified or removed since
  // the custom item component controls the display
})
```

### Available Icons
```typescript
// Source: @sanity/icons v3.7.4 type exports
import {
  DragHandleIcon,        // For drag handle (if custom)
  EllipsisVerticalIcon,  // For three-dot overflow menu
  EditIcon,              // For "Edit" menu item
  TrashIcon,             // For "Remove" menu item
  LaunchIcon,            // For external link indicator (optional)
} from '@sanity/icons'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import { useDocumentPane } from 'sanity/desk'` | `import { useDocumentPane } from 'sanity/structure'` | Sanity v3.x | Desk module deprecated in favor of structure |
| `useDocumentPane().onChange` for item patches | `inputProps.onChange` (public API) | Always available | Avoids internal API dependency; paths are scoped |
| `components: { preview: ... }` for custom preview | `components: { item: ... }` for full item control | Sanity v3.x | Item component gets full lifecycle props (open, onOpen, etc.) |

**Deprecated/outdated:**
- `sanity/desk` module: Deprecated, use `sanity/structure` for `useDocumentPane` (but prefer `inputProps.onChange` instead)
- `focusFirst` prop on Menu: Deprecated, use `shouldFocus="first"` instead

## Open Questions

1. **renderDefault layout wrapping**
   - What we know: `renderDefault(props)` renders the full default item including drag handle, preview, and menu. We wrap it in a Flex and add custom elements.
   - What's unclear: Whether the custom elements (badge dropdown, dates, tracking) should be positioned INSIDE the default row or OUTSIDE it. Both approaches work visually.
   - Recommendation: Start with elements positioned OUTSIDE (alongside `renderDefault`), then adjust via CSS if the layout doesn't match D-07's specification. The overflow menu and badge dropdown need `stopPropagation` to prevent triggering `onOpen`.

2. **Event propagation on interactive elements**
   - What we know: The default item row click opens the edit dialog. Custom interactive elements (badge dropdown, overflow menu) must not trigger this.
   - What's unclear: The exact mechanism the default row uses for click-to-open (is it on the Card or a specific button?).
   - Recommendation: Add `onClick={(e) => e.stopPropagation()}` wrappers on all interactive elements. Test click behavior after implementation.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIST-01 | Status badge dropdown changes status inline | manual-only | N/A (requires Sanity Studio runtime) | N/A |
| LIST-02 | Overdue dates shown in red | unit | `npx vitest run src/sanity/components/ProcurementListItem.test.ts -t "isOverdue" -x` | Wave 0 |
| LIST-03 | Drag handles for reordering | manual-only | N/A (DnD requires browser runtime) | N/A |
| LIST-04 | Overflow menu with Edit + Remove | manual-only | N/A (requires Sanity Studio runtime) | N/A |
| LIST-05 | Tracking number display (monospace, clickable) | unit | `npx vitest run src/sanity/components/ProcurementListItem.test.ts -t "tracking" -x` | Wave 0 |
| LIST-06 | Custom row layout | manual-only | N/A (visual verification) | N/A |
| EDIT-01 | Gray dialog backdrop overlay | manual-only | N/A (CSS visual verification) | N/A |
| EDIT-02 | trackingUrl schema field | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "trackingUrl" -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/sanity/components/ProcurementListItem.test.ts` -- covers LIST-02 (isOverdue logic), LIST-05 (tracking display logic)
- [ ] `src/sanity/schemas/project.test.ts` -- existing file, add tests for trackingUrl field (EDIT-02) and components.item registration

## Sources

### Primary (HIGH confidence)
- Sanity v5.16.0 type definitions (`node_modules/sanity/lib/_chunks-dts/ActiveWorkspaceMatcherContext.d.ts`) -- ObjectItemProps, BaseItemProps, ObjectInputProps, PatchEvent, set/unset APIs
- @sanity/ui v3.1.13 type definitions (`node_modules/@sanity/ui/dist/index.d.ts`) -- Badge, MenuButton, Menu, MenuItem, MenuProps, BadgeTone, ThemeColorStateToneKey
- @sanity/icons v3.7.4 type exports -- DragHandleIcon, EllipsisVerticalIcon, EditIcon, TrashIcon
- Sanity v5.16.0 source (`node_modules/sanity/lib/index.js`) -- ArrayOfObjectsItem.handleChange (line 19051), RowLayout (line 25150), DragHandle (line 24359), dialogStyle (line 659)
- @sanity/ui v3.1.13 source (`node_modules/@sanity/ui/dist/index.mjs`) -- Dialog backdrop rendering (line 676)
- Existing project code: `src/lib/procurementStages.ts`, `src/sanity/components/NetPriceDisplay.tsx`, `src/sanity/studio.css`, `src/sanity/schemas/project.ts`

### Secondary (MEDIUM confidence)
- [Sanity official guide: Create interactive array items](https://www.sanity.io/docs/developer-guides/create-interactive-array-items-for-featured-elements) -- Pattern for wrapping renderDefault with custom elements, useDocumentPane + PatchEvent pattern
- [Sanity Form Components docs](https://www.sanity.io/docs/studio/form-components) -- Item component role in array rendering
- [Sanity UI Dialog component](https://www.sanity.io/ui/docs/component/dialog) -- Dialog data-ui attribute, backdrop theming via `--card-backdrop-color`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are already installed and type definitions verified locally
- Architecture: HIGH - ObjectItemProps type verified, inputProps.onChange scoping verified from source code, renderDefault pattern verified from official guide
- Pitfalls: HIGH - Verified from source code analysis (event propagation, PatchEvent wrapping, CSS specificity)

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (stable -- Sanity v5.x API is mature)
