import { type ObjectItemProps, PatchEvent, set } from 'sanity'
import { Box, Button, Flex, Menu, MenuButton, MenuItem, Text } from '@sanity/ui'
import { EllipsisVerticalIcon, EditIcon, TrashIcon } from '@sanity/icons'
import { useCallback } from 'react'
import {
  PROCUREMENT_STAGES,
  PROCUREMENT_STAGE_META,
  type ProcurementStageKey,
} from '../../lib/procurementStages'
import { isOverdue } from '../../lib/isOverdue'

/**
 * Explicit status pill colors — bypasses @sanity/ui theming entirely.
 * The Studio's warm beige theme makes tone-based colors indistinguishable;
 * these hardcoded values guarantee visible, distinct status colors.
 */
const STATUS_PILL: Record<string, { bg: string; fg: string }> = {
  'not-yet-ordered': { bg: '#94A3B8', fg: '#fff' }, // slate   — not started
  'ordered':         { bg: '#3B82F6', fg: '#fff' }, // blue    — in process
  'in-transit':      { bg: '#F59E0B', fg: '#fff' }, // amber   — moving
  'warehouse':       { bg: '#F97316', fg: '#fff' }, // orange  — received/stored
  'delivered':       { bg: '#10B981', fg: '#fff' }, // emerald — at site
  'installed':       { bg: '#16A34A', fg: '#fff' }, // green   — complete
}
const DEFAULT_PILL = { bg: '#CBD5E1', fg: '#1e293b' }

/**
 * Column widths (px) — exported so ProcurementTableInput can use the same values
 * for the header row, ensuring columns align perfectly.
 */
export const PROCUREMENT_COL_WIDTHS = {
  status: 130,
  date: 82,
  tracking: 150,
  menu: 33,
} as const

/** Typed shape of a procurementItem array member's data fields. */
interface ProcurementItemValue {
  _key: string
  _type: string
  name?: string
  manufacturer?: string
  status?: string
  expectedDeliveryDate?: string
  trackingNumber?: string
  trackingUrl?: string
}

/**
 * Custom array item component — renders each procurement item as a table row.
 *
 * Column layout (must match ProcurementTableInput header):
 *   [Item name / manufacturer — flex 1] [Status — 130px] [Expected — 82px] [Tracking — 150px] [⋮ — 33px]
 *
 * Key behaviors:
 * - Status: Button with tone color (fixes Badge-in-MenuButton styling issue) → dropdown to
 *   change status inline without opening edit dialog (LIST-01, D-01–D-03)
 * - Overdue date: red when past due and status not delivered/installed (LIST-02, D-09)
 * - Tracking: gray monospace; clickable link when trackingUrl is valid (LIST-05, D-05)
 * - DnD: renderDefault hidden in zero-height div preserves @dnd-kit/sortable context (LIST-03)
 * - Edit/Remove: overflow menu (LIST-04, D-12)
 */
export function ProcurementListItem(props: ObjectItemProps) {
  const { inputProps } = props
  const value = props.value as ProcurementItemValue

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      inputProps.onChange(PatchEvent.from(set(newStatus, ['status'])))
    },
    [inputProps],
  )

  // Normalize legacy "pending" status (pre-Phase 23 data) → "not-yet-ordered"
  const normalizedStatus = value?.status === 'pending' ? 'not-yet-ordered' : value?.status
  const stageMeta = PROCUREMENT_STAGE_META[normalizedStatus as ProcurementStageKey]
  const pill = STATUS_PILL[normalizedStatus ?? ''] ?? DEFAULT_PILL

  // Append T00:00:00 to prevent UTC offset from shifting the displayed day
  const dateDisplay = value?.expectedDeliveryDate
    ? new Date(value.expectedDeliveryDate + 'T00:00:00').toLocaleDateString()
    : null

  const overdue = isOverdue(value?.expectedDeliveryDate, normalizedStatus)

  // Validate trackingUrl: only http/https allowed (security: prevents javascript: injection)
  const rawUrl = value?.trackingUrl
  const validTrackingUrl =
    rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
      ? rawUrl
      : undefined

  return (
    <div style={{ display: 'contents' }}>
      {/*
       * Hidden renderDefault preserves Sanity's DnD context (@dnd-kit/sortable
       * SortableItemIdContext) and dialog open/close lifecycle. Without this,
       * drag handles and edit dialogs stop working (LIST-03, RESEARCH Pitfall).
       */}
      <div
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          height: 0,
          overflow: 'hidden',
        }}
      >
        {props.renderDefault(props)}
      </div>

      {/* Table row: bottom-border separator only (no full Card border) */}
      <Box
        paddingX={3}
        paddingY={2}
        data-procurement-row
        style={{ borderBottom: '1px solid var(--card-border-color)' }}
      >
        <Flex align="center" gap={3}>
          {/* Item name + manufacturer — fills remaining width */}
          <Box flex={1}>
            <Text size={2} weight="semibold">
              {value?.name || 'Untitled item'}
            </Text>
            {value?.manufacturer && (
              <Box marginTop={1}>
                <Text size={1} muted>
                  {value.manufacturer}
                </Text>
              </Box>
            )}
          </Box>

          {/* Status — 130px. Explicit bg colors bypass @sanity/ui theme variable conflicts. */}
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.status }}>
            <div onClick={(e) => e.stopPropagation()}>
              <MenuButton
                id={`status-${value?._key}`}
                button={
                  <Button
                    mode="bleed"
                    fontSize={0}
                    style={{
                      backgroundColor: pill.bg,
                      color: pill.fg,
                      borderRadius: 3,
                      width: '100%',
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    text={stageMeta?.title ?? normalizedStatus ?? 'No status'}
                  />
                }
                menu={
                  <Menu>
                    {PROCUREMENT_STAGES.map((stage) => (
                      <MenuItem
                        key={stage.value}
                        text={stage.title}
                        tone={stage.tone}
                        pressed={normalizedStatus === stage.value}
                        onClick={() => handleStatusChange(stage.value)}
                      />
                    ))}
                  </Menu>
                }
              />
            </div>
          </Box>

          {/* Expected delivery date — 82px, right-aligned, red when overdue */}
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.date, textAlign: 'right' }}>
            {dateDisplay &&
              (overdue ? (
                <Text size={1} style={{ color: '#DC2626' }}>
                  {dateDisplay}
                </Text>
              ) : (
                <Text size={1} muted>
                  {dateDisplay}
                </Text>
              ))}
          </Box>

          {/* Tracking number — 150px, monospace; clickable link when trackingUrl is valid */}
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.tracking }}>
            {value?.trackingNumber &&
              (validTrackingUrl ? (
                <a
                  href={validTrackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: '#64748B',
                    fontSize: '12px',
                    textDecoration: 'none',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {value.trackingNumber}
                </a>
              ) : (
                <Text
                  size={1}
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    color: '#94A3B8',
                  }}
                >
                  {value.trackingNumber}
                </Text>
              ))}
          </Box>

          {/* Overflow menu — 33px */}
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.menu }}>
            <div onClick={(e) => e.stopPropagation()}>
              <MenuButton
                id={`overflow-${value?._key}`}
                button={<Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} />}
                menu={
                  <Menu>
                    <MenuItem text="Edit" icon={EditIcon} onClick={() => props.onOpen()} />
                    <MenuItem
                      text="Remove"
                      icon={TrashIcon}
                      tone="critical"
                      onClick={() => props.onRemove()}
                    />
                  </Menu>
                }
              />
            </div>
          </Box>
        </Flex>
      </Box>
    </div>
  )
}
