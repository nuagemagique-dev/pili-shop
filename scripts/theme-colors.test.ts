import { describe, expect, it } from 'vite-plus/test'
import {
  contrastRatio,
  hslToHex,
  oklchToHex,
  parseThemeColors,
  readCssVars,
  resolveColor,
} from './theme-colors.mjs'

describe('parseThemeColors', () => {
  it('reads the colours of every @theme flavour and ignores comments, other tokens and nested blocks', () => {
    const css = `
      @import 'tailwindcss';
      /* --color-commented: #000000; */
      @theme {
        --color-tsb-one: #f6f5f2;
        --font-sans: Montserrat, sans-serif;
        --animate-shake: shake 0.4s;
        @keyframes shake {
          0% { --color-in-keyframes: #111111; }
        }
        --color-ring: hsl(var(--ring));
      }
      @theme static inline {
        --color-primary-500: var(--color-red-500);
      }
      .not-theme { --color-outside: #222222; }
    `
    expect([...parseThemeColors(css)]).toEqual([
      ['tsb-one', '#f6f5f2'],
      ['ring', 'hsl(var(--ring))'],
      ['primary-500', 'var(--color-red-500)'],
    ])
  })

  it('is empty without an @theme block', () => {
    expect(parseThemeColors('.a { color: red }').size).toBe(0)
  })
})

describe('readCssVars', () => {
  it('keeps the last declaration across stylesheets and skips comments', () => {
    expect(
      readCssVars([
        ':root { --ring: 0 0% 0%; /* --gone: 1 */ --radius: 0.5rem; }',
        ':root { --ring: 1 2% 3%; }',
      ]),
    ).toEqual({ ring: '1 2% 3%', radius: '0.5rem' })
  })
})

describe('colour conversion', () => {
  it('converts oklch to sRGB (Tailwind red-600, white, black, an out-of-gamut chroma is clamped)', () => {
    expect(oklchToHex(0.577, 0.245, 27.325)).toBe('#E7000B')
    expect(oklchToHex(1, 0, 0)).toBe('#FFFFFF')
    expect(oklchToHex(0, 0, 0)).toBe('#000000')
    expect(oklchToHex(0.9, 0.4, 150)).toMatch(/^#[\dA-F]{6}$/u)
  })

  it('converts hsl to sRGB', () => {
    expect(hslToHex(0, 72.2, 50.6)).toBe('#DC2626')
    expect(hslToHex(0, 0, 100)).toBe('#FFFFFF')
  })

  it('computes the WCAG contrast ratio, order independent', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#777777', '#777777')).toBe(1)
  })
})

describe('resolveColor', () => {
  const colors = new Map([
    ['red-600', 'oklch(57.7% 0.245 27.325)'],
    ['primary-600', 'var(--color-red-600)'],
    ['loop', 'var(--color-loop)'],
    ['brand', '#ABC'],
    ['full', '#a1b2c3'],
    ['ring', 'hsl(var(--ring))'],
    ['alpha', 'rgba(242, 123, 32, 0.12)'],
  ])
  const vars = { ring: '0 72.2% 50.6%' }

  it('follows var() references, hsl triples, hex and oklch values', () => {
    expect(resolveColor('var(--color-primary-600)', colors, vars)).toBe('#E7000B')
    expect(resolveColor(colors.get('ring'), colors, vars)).toBe('#DC2626')
    expect(resolveColor('hsl(10 20% 30%)', colors, vars)).toBe(hslToHex(10, 20, 30))
    expect(resolveColor(colors.get('brand'), colors, vars)).toBe('#AABBCC')
    expect(resolveColor(colors.get('full'), colors, vars)).toBe('#A1B2C3')
    expect(resolveColor('oklch(0.5 0.1 200)', colors, vars)).toBe(oklchToHex(0.5, 0.1, 200))
  })

  it('gives null for what is not a plain opaque colour', () => {
    expect(resolveColor(undefined, colors, vars)).toBeNull()
    expect(resolveColor(colors.get('alpha'), colors, vars)).toBeNull()
    expect(resolveColor('var(--color-missing)', colors, vars)).toBeNull()
    expect(resolveColor('hsl(var(--nope))', colors, vars)).toBeNull()
    expect(resolveColor(colors.get('loop'), colors, vars)).toBeNull()
  })
})
