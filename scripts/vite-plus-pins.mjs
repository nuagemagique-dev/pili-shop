// Dependabot bumps vite-plus and @voidzero-dev/* as one group, but two pins stay behind: the `catalog.vite` alias of
// pnpm-workspace.yaml (vite-plus-core of the same release) and @vitest/coverage-v8 (peer-pinned to the vitest vite-plus
// bundles). .github/workflows/dependabot-vite-plus.yml moves them on the Dependabot PR with sync-vite-plus-pins.mjs.

/**
 * @typedef {object} Manifest
 * @property {Record<string, string>} [dependencies]
 * @property {Record<string, string>} [devDependencies]
 */

/**
 * @param {string} text JSON text
 * @returns {Record<string, unknown>}
 */
function parseObject(text) {
  /** @type {unknown} */
  const value = JSON.parse(text)
  return typeof value === 'object' && value !== null ? { ...value } : {}
}

/**
 * Replaces the one `"name": "from"` entry of a package.json text, keeping the rest of the file byte for byte.
 * @param {string} text package.json
 * @param {string} name entry name
 * @param {{ from: string, to: string }} change current and new value
 * @returns {string}
 */
function replaceEntry(text, name, { from, to }) {
  const entry = `${JSON.stringify(name)}: ${JSON.stringify(from)}`
  if (text.split(entry).length !== 2) {
    throw new Error(`expected one ${entry} in package.json`)
  }
  return text.replace(entry, `${JSON.stringify(name)}: ${JSON.stringify(to)}`)
}

const catalogLine = /^( {2}vite: )(npm:@voidzero-dev\/vite-plus-core@\S+)$/gm

/**
 * The vitest release the locked vite-plus depends on: the `vitest:` entry of the vite-plus snapshot of pnpm-lock.yaml
 * (the key carries the peer suffix, e.g. `vite-plus@1.4.0(@types/node@24.19.2)(...):`).
 * @param {string} lockText pnpm-lock.yaml
 * @returns {string | undefined}
 */
function lockedVitest(lockText) {
  const lines = lockText.split('\n')
  const start = lines.findIndex((line) => /^ {2}vite-plus@[^(\s]+\(.*\):$/.test(line))
  if (start === -1) {
    return undefined
  }
  for (const line of lines.slice(start + 1)) {
    if (/^ {2}\S/.test(line)) {
      return undefined
    }
    const match = /^ {6}vitest: ([^(\s]+)/.exec(line)
    if (match) {
      return match[1]
    }
  }
  return undefined
}

/**
 * package.json and pnpm-workspace.yaml texts with `catalog.vite` and @vitest/coverage-v8 moved to the vite-plus
 * release package.json declares. A text comes back unchanged when its pin already holds.
 * @param {string} pkgText package.json
 * @param {string} workspaceText pnpm-workspace.yaml
 * @param {string} lockText pnpm-lock.yaml, as Dependabot left it
 * @returns {{ pkg: string, workspace: string }}
 */
export function syncedPins(pkgText, workspaceText, lockText) {
  /** @type {Manifest} */
  const pkg = parseObject(pkgText)
  const declared = pkg.devDependencies?.['vite-plus']
  const catalogPins = [...workspaceText.matchAll(catalogLine)]
  if (declared === undefined || catalogPins.length !== 1) {
    throw new Error(
      'package.json needs devDependencies.vite-plus and pnpm-workspace.yaml one catalog.vite alias',
    )
  }

  const core = `npm:@voidzero-dev/vite-plus-core@${declared}`
  const workspace = workspaceText.replace(catalogLine, `$1${core}`)

  let text = pkgText
  const coverage = pkg.devDependencies?.['@vitest/coverage-v8']
  if (coverage !== undefined) {
    const vitest = lockedVitest(lockText)
    if (vitest === undefined) {
      throw new Error('pnpm-lock.yaml has no vitest dependency for vite-plus')
    }
    if (coverage !== vitest) {
      text = replaceEntry(text, '@vitest/coverage-v8', { from: coverage, to: vitest })
    }
  }
  return { pkg: text, workspace }
}
