import { describe, it, expect } from 'vitest'
import { isOverdue } from '../ProcurementListItem'

describe('isOverdue', () => {
  const pastDate = '2020-01-01'
  const futureDate = '2099-12-31'

  it('returns true when date is in the past and status is not delivered or installed', () => {
    expect(isOverdue(pastDate, 'ordered')).toBe(true)
    expect(isOverdue(pastDate, 'in-transit')).toBe(true)
    expect(isOverdue(pastDate, 'warehouse')).toBe(true)
    expect(isOverdue(pastDate, 'not-yet-ordered')).toBe(true)
  })

  it('returns false when date is in the future', () => {
    expect(isOverdue(futureDate, 'ordered')).toBe(false)
    expect(isOverdue(futureDate, 'in-transit')).toBe(false)
  })

  it('returns false when status is delivered', () => {
    expect(isOverdue(pastDate, 'delivered')).toBe(false)
  })

  it('returns false when status is installed', () => {
    expect(isOverdue(pastDate, 'installed')).toBe(false)
  })

  it('returns false when expectedDeliveryDate is undefined', () => {
    expect(isOverdue(undefined, 'ordered')).toBe(false)
  })

  it('returns false when expectedDeliveryDate is empty string', () => {
    expect(isOverdue('', 'ordered')).toBe(false)
  })

  it('returns true when status is undefined and date is past (no status yet)', () => {
    expect(isOverdue(pastDate, undefined)).toBe(true)
  })
})
