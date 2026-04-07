import { describe, it, expect } from 'vitest'
import { getCarrierFromUrl } from './carrierFromUrl'

describe('getCarrierFromUrl', () => {
  it('detects FedEx from tracking URL', () => {
    expect(getCarrierFromUrl('https://www.fedex.com/fedextrack/?trknbr=123')).toEqual({
      carrier: 'fedex',
      label: 'FedEx',
    })
  })

  it('detects UPS from tracking URL', () => {
    expect(getCarrierFromUrl('https://www.ups.com/track?tracknum=1Z999')).toEqual({
      carrier: 'ups',
      label: 'UPS',
    })
  })

  it('detects USPS from tracking URL', () => {
    expect(
      getCarrierFromUrl('https://tools.usps.com/go/TrackConfirmAction?tLabels=123'),
    ).toEqual({
      carrier: 'usps',
      label: 'USPS',
    })
  })

  it('detects DHL from tracking URL', () => {
    expect(getCarrierFromUrl('https://www.dhl.com/us-en/track.html?123')).toEqual({
      carrier: 'dhl',
      label: 'DHL',
    })
  })

  it('returns unknown carrier for unrecognized domains', () => {
    expect(getCarrierFromUrl('https://www.amazon.com/tracking/123')).toEqual({
      carrier: 'unknown',
      label: 'Track',
    })
  })

  it('returns null for invalid URLs', () => {
    expect(getCarrierFromUrl('not-a-url')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getCarrierFromUrl('')).toBeNull()
  })
})
