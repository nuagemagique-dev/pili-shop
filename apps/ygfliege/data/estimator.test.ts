import {
  BROTH_FREE_FROM_G,
  ESTIMATOR_PRESETS_G,
  ESTIMATOR_RANGE_G,
  brothFeeApplies,
  estimateCents,
  estimatorBowlScale,
} from './estimator'
import { describe, expect, it } from 'vite-plus/test'

describe('estimator', () => {
  it('prices a bowl at 3,49 € per 100 g, rounded to the cent, within the slider range', () => {
    expect(estimateCents(450)).toBe(1571)
    expect(estimateCents(400)).toBe(1396)
    expect(estimateCents(100)).toBe(estimateCents(ESTIMATOR_RANGE_G.min))
    expect(estimateCents(5000)).toBe(estimateCents(ESTIMATOR_RANGE_G.max))
  })

  it('adds the 2,50 € broth below 400 g, and offers it from 400 g', () => {
    expect(estimateCents(300)).toBe(1047 + 250)
    expect(estimateCents(390)).toBe(1361 + 250)
    expect(estimateCents(400)).toBe(1396)
    expect(brothFeeApplies(399)).toBe(true)
    expect(brothFeeApplies(BROTH_FREE_FROM_G)).toBe(false)
  })

  it('draws the bowl from 0.8 to 1.15', () => {
    expect(estimatorBowlScale(ESTIMATOR_RANGE_G.min)).toBe(0.8)
    expect(estimatorBowlScale(ESTIMATOR_RANGE_G.max)).toBe(1.15)
    expect(estimatorBowlScale(500)).toBe(0.975)
  })

  it('offers presets inside the range', () => {
    for (const grams of ESTIMATOR_PRESETS_G) {
      expect(grams).toBeGreaterThanOrEqual(ESTIMATOR_RANGE_G.min)
      expect(grams).toBeLessThanOrEqual(ESTIMATOR_RANGE_G.max)
    }
  })
})
