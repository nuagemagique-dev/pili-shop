/*
 * The price estimator of the home and menu pages (audit 1a/1b): the counter's rule, price by weight, turned into a
 * meal price. It is the IN-STORE rule only; online orders are priced base + ingredients (the composer).
 */

/** The counter's price, in cents per 100 g (the "3,49 € / 100 g" of the showcase copy). */
export const COUNTER_PRICE_PER_100G_CENTS = 349

/**
 * Portion presets of the estimator, in grams: small, regular, hearty.
 * PLACEHOLDERS from the audit, to confirm with the store (and any minimum weight).
 */
export const ESTIMATOR_PRESETS_G = [300, 450, 600] as const

/** The slider's range, in grams. */
export const ESTIMATOR_RANGE_G = { min: 200, max: 800, step: 10 } as const

const clampWeight = (grams: number): number =>
  Math.min(Math.max(grams, ESTIMATOR_RANGE_G.min), ESTIMATOR_RANGE_G.max)

/** The broth is free from this weight on (the printed menu: "dès 400 g bouillon offert"). */
export const BROTH_FREE_FROM_G = 400

/** The broth's price below that weight, in cents ("moins de 400 g bouillon 2,50 €"). */
export const BROTH_FEE_CENTS = 250

/** Whether a bowl of `grams` pays for its broth. */
export const brothFeeApplies = (grams: number): boolean => clampWeight(grams) < BROTH_FREE_FROM_G

/** The counter price of a bowl of `grams`, in cents: the weight (rounded to the cent, as the scale does), plus the broth below 400 g. */
export const estimateCents = (grams: number): number =>
  Math.round((clampWeight(grams) * COUNTER_PRICE_PER_100G_CENTS) / 100) +
  (brothFeeApplies(grams) ? BROTH_FEE_CENTS : 0)

/** How big the estimator's bowl is drawn: 0.8 at the lightest weight, 1.15 at the heaviest. */
export const estimatorBowlScale = (grams: number): number =>
  Number(
    (
      0.8 +
      ((clampWeight(grams) - ESTIMATOR_RANGE_G.min) /
        (ESTIMATOR_RANGE_G.max - ESTIMATOR_RANGE_G.min)) *
        0.35
    ).toFixed(3),
  )
