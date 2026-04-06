import { type ObjectItemProps, PatchEvent, set } from 'sanity'
import { Badge, Box, Button, Card, Flex, Menu, MenuButton, MenuItem, Text } from '@sanity/ui'
import { EllipsisVerticalIcon, EditIcon, TrashIcon } from '@sanity/icons'
import { useCallback } from 'react'
import {
  PROCUREMENT_STAGES,
  PROCUREMENT_STAGE_META,
  getProcurementTone,
  type ProcurementStageKey,
} from '../../lib/procurementStages'

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
 * Determines whether a procurement item is overdue.
 *
 * Overdue = expectedDeliveryDate is in the past AND status is not
 * "delivered" or "installed" (D-09, LIST-02).
 *
 * Exported for unit testing.
 */
export function isOverdue(
  expectedDeliveryDate: string | undefined,
  status: string | undefined,
): boolean {
  if (!expectedDeliveryDate) return false
  if (status === 'delivered' || status === 'installed') return false
  return new Date(expectedDeliveryDate) < new Date()
}

/**
 * Custom array item component for procurement items (D-14, LIST-06).
 *
 * Renders a rich row with:
 * - Item name (bold) + manufacturer (gray, below name)
 * - Status badge dropdown for inline status changes (LIST-01, D-01–D-03)
 * - Expected delivery date, red if overdue (LIST-02, D-09–D-10)
 * - Tracking number as gray monospace, clickable link if trackingUrl set (LIST-05, D-05, D-11)
 * - Three-dot overflow menu: Edit + Remove (LIST-04, D-12)
 * - renderDefault rendered hidden to preserve DnD + dialog context (LIST-03)
 */
export function ProcurementListItem(props: ObjectItemProps) {
  const { inputProps } = props
  // Cast to typed interface — ObjectItem is intentionally untyped; all fields are unknown
  const value = props.value as ProcurementItemValue

  // Inline status patch — scoped to this array item (Pitfall 5: must wrap in PatchEvent.from)
  const handleStatusChange = useCallback(
    (newStatus: string) => {
      inputProps.onChange(PatchEvent.from(set(newStatus, ['status'])))
    },
    [inputProps],
  )

  // Date display: append T00:00:00 to prevent UTC offset shifting the displayed day
  const dateDisplay = value?.expectedDeliveryDate
    ? new Date(value.expectedDeliveryDate + 'T00:00:00').toLocaleDateString()
    : null

  const overdue = isOverdue(value?.expectedDeliveryDate, value?.status)

  // Validate trackingUrl to prevent javascript: protocol (security: threat model D-05)
  const rawUrl = value?.trackingUrl
  const validTrackingUrl =
    rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
      ? rawUrl
      : undefined

  return (
    <div style={{ display: 'contents' }}>
      {/*
       * Hidden renderDefault preserves Sanity's DnD context (@dnd-kit/sortable
       * SortableItemIdContext) and dialog management — without this the drag
       * handle and open/close lifecycle would be lost (LIST-03, RESEARCH Pitfall).
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

      {/* Visible custom row */}
      <Card padding={3} radius={2} border>
        <Flex align="center" gap={3}>
          {/* Left: item name + manufacturer (D-07, D-08) */}
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

          {/* Center-right: badge + date + tracking */}
          <Flex direction="column" gap={1} align="flex-end">
            {/* Status badge dropdown (LIST-01, D-01–D-03, Pitfall 4: stopPropagation) */}
            <div onClick={(e) => e.stopPropagation()}>
              <MenuButton
                id={`status-${value?._key}`}
                button={
                  <Badge
                    tone={getProcurementTone(value?.status ?? '')}
                    style={{ cursor: 'pointer' }}
                  >
                    {PROCUREMENT_STAGE_META[value?.status as ProcurementStageKey]?.title ??
                      value?.status ??
                      'No status'}
                  </Badge>
                }
                menu={
                  <Menu>
                    {PROCUREMENT_STAGES.map((stage) => (
                      <MenuItem
                        key={stage.value}
                        text={stage.title}
                        tone={stage.tone}
                        pressed={value?.status === stage.value}
                        onClick={() => handleStatusChange(stage.value)}
                      />
                    ))}
                  </Menu>
                }
              />
            </div>

            {/* Delivery date — omitted if not set (D-10); red if overdue (LIST-02, D-09) */}
            {dateDisplay && (
              <div>
                {overdue ? (
                  <Text size={1} style={{ color: '#DC2626' }}>
                    {dateDisplay}
                  </Text>
                ) : (
                  <Text size={1} muted>
                    {dateDisplay}
                  </Text>
                )}
              </div>
            )}

            {/* Tracking number — omitted if not set (D-11); clickable if trackingUrl valid (LIST-05, D-05) */}
            {value?.trackingNumber && (
              <div onClick={(e) => e.stopPropagation()}>
                {validTrackingUrl ? (
                  <a
                    href={validTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      color: '#64748B',
                      fontSize: '13px',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.color = '#475569'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLAnchorElement).style.color = '#64748B'
                    }}
                  >
                    {value.trackingNumber}
                  </a>
                ) : (
                  <Text
                    size={1}
                    style={{
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      color: '#64748B',
                    }}
                  >
                    {value.trackingNumber}
                  </Text>
                )}
              </div>
            )}
          </Flex>

          {/* Far right: overflow menu (LIST-04, D-12, Pitfall 4: stopPropagation) */}
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
        </Flex>
      </Card>
    </div>
  )
}
