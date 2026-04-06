import type { ArrayOfObjectsInputProps } from 'sanity'
import { Box, Flex, Text } from '@sanity/ui'
import { PROCUREMENT_COL_WIDTHS } from './ProcurementListItem'

const HEADER_STYLE = {
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
}

/**
 * Custom input wrapper for the procurementItems array.
 * Renders a column header row above the default Sanity array widget.
 * Column widths are imported from ProcurementListItem to stay in sync.
 */
export function ProcurementTableInput(props: ArrayOfObjectsInputProps) {
  return (
    <div>
      {/* Column headers */}
      <Box
        paddingX={3}
        paddingBottom={2}
        style={{ borderBottom: '1px solid var(--card-border-color)' }}
      >
        <Flex align="center" gap={3}>
          <Box flex={1}>
            <Text size={0} weight="semibold" muted style={HEADER_STYLE}>
              Item
            </Text>
          </Box>
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.status }}>
            <Text size={0} weight="semibold" muted style={HEADER_STYLE}>
              Status
            </Text>
          </Box>
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.date, textAlign: 'right' }}>
            <Text size={0} weight="semibold" muted style={HEADER_STYLE}>
              Expected
            </Text>
          </Box>
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.tracking }}>
            <Text size={0} weight="semibold" muted style={HEADER_STYLE}>
              Tracking
            </Text>
          </Box>
          <Box style={{ width: PROCUREMENT_COL_WIDTHS.menu }} />
        </Flex>
      </Box>

      {/* Default array widget — preserves DnD, Add item, validation */}
      {props.renderDefault(props)}
    </div>
  )
}
