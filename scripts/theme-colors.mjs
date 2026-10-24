// Colour maths of check-token-contrast.mjs, kept free of file access so scripts/theme-colors.test.ts can run it.
// A brand's palette lives in the `@theme` blocks of its assets/css/tailwind.css (Tailwind 4: `--color-<name>: value`),
// on top of Tailwind's own theme (tailwindcss/theme.css, oklch values), and the brand accent triples (`--ring: H S% L%`)
// sit in :root rules.

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//gu, '')

/**
 * The `--color-*` declarations of every `@theme` block (default, static, inline...) of a stylesheet, name without prefix.
 * Declarations nested in a block of their own (`@keyframes`) are not colours.
 * @param {string} css
 * @returns {Map<string, string>}
 */
export function parseThemeColors(css) {
  const source = stripComments(css)
  const colors = new Map()
  for (const start of source.matchAll(/@theme\b[^{;]*\{/gu)) {
    let depth = 1
    let at = start.index + start[0].length
    const begin = at
    while (depth > 0 && at < source.length) {
      if (source[at] === '{') depth++
      else if (source[at] === '}') depth--
      at++
    }
    // Keep the top level of the block only: blank out nested blocks.
    let flat = ''
    depth = 0
    for (const ch of source.slice(begin, at - 1)) {
      if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (depth === 0) flat += ch
    }
    for (const m of flat.matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/gu))
      colors.set(m[1], m[2].trim())
  }
  return colors
}

const toHex = (channels) =>
  `#${channels
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`

/** sRGB hex of an oklch colour (CSS Color 4: lightness 0-1 or %, chroma, hue in degrees); out-of-gamut values are clamped. */
export function oklchToHex(lightness, chroma, hue) {
  const a = chroma * Math.cos((hue * Math.PI) / 180)
  const b = chroma * Math.sin((hue * Math.PI) / 180)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return toHex(
    linear.map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.max(v, 0) ** (1 / 2.4) - 0.055)),
  )
}

/** sRGB hex of an hsl colour (hue in degrees, saturation and lightness in %). */
export function hslToHex(h, s, l) {
  const sat = s / 100
  const light = l / 100
  const k = (n) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return toHex([f(0), f(8), f(4)])
}

/**
 * The sRGB hex (#RRGGBB) of a theme colour value, or null when it is not a plain opaque colour. Follows `var(--color-x)`
 * through `colors` and `hsl(var(--x))` through `vars` (the `H S% L%` triples of :root).
 * @param {string | undefined} value
 * @param {Map<string, string>} colors theme colours by name (no `--color-` prefix)
 * @param {Record<string, string>} vars custom properties of :root
 * @param {number} [depth]
 * @returns {string | null}
 */
export function resolveColor(value, colors, vars, depth = 0) {
  if (typeof value !== 'string' || depth > 8) return null
  const v = value.trim()
  const colorVar = /^var\(--color-([\w-]+)\)$/u.exec(v)
  if (colorVar) return resolveColor(colors.get(colorVar[1]), colors, vars, depth + 1)
  const hslVar = /^hsl\(var\(--([\w-]+)\)\)$/u.exec(v)
  if (hslVar) return resolveColor(`hsl(${vars[hslVar[1]] ?? ''})`, colors, vars, depth + 1)
  const hsl = /^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/u.exec(v)
  if (hsl) return hslToHex(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]))
  const oklch = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/u.exec(v)
  if (oklch) {
    const lightness = Number(oklch[1]) / (oklch[2] === '%' ? 100 : 1)
    return oklchToHex(lightness, Number(oklch[3]), Number(oklch[4]))
  }
  if (/^#[\da-f]{3}$/iu.test(v))
    return `#${[...v.slice(1)].map((c) => c + c).join('')}`.toUpperCase()
  return /^#[\da-f]{6}$/iu.test(v) ? v.toUpperCase() : null
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio of two #RRGGBB colours. */
export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * The custom properties (`--name: value;`) declared in stylesheets, later declarations winning.
 * @param {string[]} stylesheets in cascade order
 * @returns {Record<string, string>}
 */
export function readCssVars(stylesheets) {
  const vars = {}
  for (const css of stylesheets)
    for (const m of stripComments(css).matchAll(/--([\w-]+):\s*([^;]+);/gu))
      vars[m[1]] = m[2].trim()
  return vars
}
