#!/usr/bin/env node
/*
 * Contrast gate for the theme contract the engine layer is written against
 * (primary-*, neutral-*, tsb-* surfaces, the brand `--ring` variable, and the few
 * status hues red / amber / green / emerald). Each brand maps those names in the
 * `@theme` blocks of its assets/css/tailwind.css (plus brand.css for the HSL variables),
 * on top of Tailwind's own oklch palette, so the same engine markup can pass in one
 * brand and fail in the other. This reads the real stylesheets (colour maths in
 * theme-colors.mjs) and checks, per brand:
 *
 *  - every text colour the engine may use for body, secondary, accent and status text
 *    reaches 4.5:1 (WCAG 1.4.3) on the surfaces it sits on;
 *  - white on a CTA fill (bg-primary-600 / -700) reaches 4.5:1;
 *  - the focus ring (`ring-ring`) reaches 3:1 (WCAG 1.4.11) on every surface.
 *
 * `neutral-300/400/500` and `primary-300/400/500` are deliberately absent: Tokyo Sushi's
 * gray-500 is 4.08:1 on its darkest surface and its red-500 3.81:1 on white. They are
 * decorative steps (separators, empty-state glyphs, hairlines) and must not carry text, so
 * the source scan below also fails on `text-neutral-300|400|500` outside icons/decoration
 * (`<svg`, `aria-hidden`, or a `contrast-ok` comment on the line). Use neutral-600 for
 * secondary text.
 * `node scripts/check-token-contrast.mjs --table` prints every pair.
 */

import { dirname, join, resolve } from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { contrastRatio, parseThemeColors, readCssVars, resolveColor } from './theme-colors.mjs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Tailwind's own palette (oklch): the status hues and every scale a brand maps onto (primary-* and neutral-* point at it).
const defaultColors = parseThemeColors(
  await readFile(createRequire(import.meta.url).resolve('tailwindcss/theme.css'), 'utf8'),
)

/** CSS custom properties (`--name: H S% L%`) declared in a brand's stylesheets, last declaration wins. */
const readBrandVars = async (appDir) => {
  const dir = join(appDir, 'assets/css')
  // Cascade order: Tailwind's neutral shadcn defaults (tailwind.css) first, the brand's own file last.
  const order = (f) => (f === 'tailwind.css' ? 0 : f === 'brand.css' ? 2 : 1)
  const files = (await readdir(dir))
    .filter((f) => f.endsWith('.css'))
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
  return readCssVars(await Promise.all(files.map((f) => readFile(join(dir, f), 'utf8'))))
}

const SURFACES = ['white', 'tsb-one', 'tsb-two', 'tsb-four']
// text colour class -> [which colour key it reads from]; all must reach 4.5:1 on SURFACES.
const TEXT = [
  'neutral-600',
  'neutral-700',
  'neutral-800',
  'neutral-900',
  'primary-700',
  'primary-800',
  'red-700',
  'amber-800',
  'green-800',
  'emerald-700',
]
const FILLS = ['primary-600', 'primary-700']

const apps = (await readdir(join(repoRoot, 'apps'), { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
const rows = []
const failures = []
for (const app of apps) {
  const appDir = join(repoRoot, 'apps', app)
  let brandCss
  try {
    brandCss = await readFile(join(appDir, 'assets/css/tailwind.css'), 'utf8')
  } catch {
    continue
  }
  const colors = new Map([...defaultColors, ...parseThemeColors(brandCss)])
  const vars = await readBrandVars(appDir)
  const color = (name) => resolveColor(colors.get(name), colors, vars)
  const test = (name, fg, bg, min) => {
    if (!fg || !bg) {
      failures.push(`${app}: cannot resolve ${name}`)
      return
    }
    const r = contrastRatio(fg, bg)
    rows.push({ app, name, fg, bg, r, min })
    if (r < min)
      failures.push(`${app}: ${name} (${fg} on ${bg}) is ${r.toFixed(2)}:1, needs ${min}:1`)
  }
  for (const t of TEXT) {
    for (const s of SURFACES) test(`text-${t} on ${s}`, color(t), color(s), 4.5)
  }
  for (const f of FILLS) test(`white on bg-${f}`, '#FFFFFF', color(f), 4.5)
  const ring = resolveColor('hsl(var(--ring))', colors, vars)
  for (const s of SURFACES) test(`ring-ring on ${s}`, ring, color(s), 3)
}

// Source scan: pale secondary text in engine and app templates.
const paleText = /(?<![\w-])(?:[a-z-]+:)*text-neutral-[345]00(?![\w-])/u
async function* walk(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    if (['node_modules', '.nuxt', '.output', '.data', 'e2e'].includes(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (p.endsWith('.vue')) yield p
  }
}
let scanned = 0
for (const root of [join(repoRoot, 'layers/engine'), join(repoRoot, 'apps')]) {
  for await (const file of walk(root)) {
    scanned++
    const rel = file.slice(repoRoot.length + 1)
    const source = await readFile(file, 'utf8')
    const lineStarts = [0]
    for (let i = 0; i < source.length; i++) if (source[i] === '\n') lineStarts.push(i + 1)
    const paleAll = new RegExp(paleText.source, 'gu')
    for (const m of source.matchAll(paleAll)) {
      // The exemption markers may sit on another line of the same (formatter-wrapped) tag.
      const from = source.lastIndexOf('<', m.index)
      const to = source.indexOf('>', m.index)
      const tag = source.slice(from < 0 ? 0 : from, to < 0 ? source.length : to + 1)
      const line = lineStarts.findLastIndex((start) => start <= m.index) + 1
      const lineText = source.slice(lineStarts[line - 1], lineStarts[line] ?? source.length)
      if (/<svg|aria-hidden|contrast-ok|stroke=/u.test(`${tag}\n${lineText}`)) continue
      failures.push(
        `${rel}:${line}  ${m[0]} (secondary text must be neutral-600; neutral-300/400/500 fail on Tokyo Sushi's surfaces)`,
      )
    }
  }
}

if (process.argv.includes('--table')) {
  for (const row of rows)
    console.log(
      `${row.app.padEnd(11)} ${row.name.padEnd(34)} ${row.fg} on ${row.bg}  ${row.r.toFixed(2)}:1  (>= ${row.min})`,
    )
}
if (failures.length) {
  console.error(`token-contrast: ${failures.length} problem(s):\n`)
  for (const f of failures) console.error(`  ${f}`)
  process.exit(1)
}
console.log(
  `token-contrast: ${rows.length} pairs across ${apps.length} brands pass, ${scanned} templates free of pale text ✓`,
)
