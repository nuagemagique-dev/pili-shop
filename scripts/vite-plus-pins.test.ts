import { describe, expect, it } from 'vite-plus/test'
import { syncedPins } from './vite-plus-pins.mjs'

const core = (version: string) => `npm:@voidzero-dev/vite-plus-core@${version}`
const pkg = (vitePlus: string, coverage?: string) =>
  `${JSON.stringify(
    {
      name: 'app',
      devDependencies: {
        ...(coverage === undefined ? {} : { '@vitest/coverage-v8': coverage }),
        'vite-plus': vitePlus,
      },
    },
    null,
    2,
  )}\n`
const workspace = (override: string) =>
  `packages:\n  - apps/*\n\ncatalog:\n  vite: ${override}\n  other: 1.0.0\n`
// The shape of pnpm-lock.yaml: a bare `vite-plus@x:` packages entry, then the snapshot keyed with its peer suffix.
const lock = (vitest: string) =>
  [
    'packages:',
    '',
    '  vite-plus@1.4.0:',
    '    hasBin: true',
    '',
    'snapshots:',
    '',
    '  vite-plus@1.4.0(@types/node@24.19.2)(typescript@6.0.3):',
    '    dependencies:',
    '      oxfmt: 0.74.0',
    `      vitest: ${vitest}(@types/node@24.19.2)(vite@1.4.0)`,
    '',
    '  vitest@5.0.5:',
    '    dependencies:',
    '      vitest: 9.9.9',
    '',
  ].join('\n')

describe('syncedPins', () => {
  it('moves the override and coverage-v8 to the release a Dependabot bump declared', () => {
    expect(syncedPins(pkg('1.5.0', '5.0.5'), workspace(core('1.4.0')), lock('5.1.0'))).toEqual({
      pkg: pkg('1.5.0', '5.1.0'),
      workspace: workspace(core('1.5.0')),
    })
  })

  it('leaves pins that hold untouched', () => {
    const holding = { pkg: pkg('1.4.0', '5.0.5'), workspace: workspace(core('1.4.0')) }
    expect(syncedPins(holding.pkg, holding.workspace, lock('5.0.5'))).toEqual(holding)
  })

  it('moves only the override when the bundled vitest did not change', () => {
    expect(syncedPins(pkg('1.4.1', '5.0.5'), workspace(core('1.4.0')), lock('5.0.5'))).toEqual({
      pkg: pkg('1.4.1', '5.0.5'),
      workspace: workspace(core('1.4.1')),
    })
  })

  it('needs no lockfile entry without coverage-v8', () => {
    expect(syncedPins(pkg('1.5.0'), workspace(core('1.4.0')), '')).toEqual({
      pkg: pkg('1.5.0'),
      workspace: workspace(core('1.5.0')),
    })
  })

  it('refuses a workspace file without the override', () => {
    expect(() => syncedPins(pkg('1.4.0'), 'packages:\n  - apps/*\n', '')).toThrow(
      'needs devDependencies.vite-plus',
    )
  })

  it('refuses a package.json without vite-plus', () => {
    expect(() => syncedPins('{}', workspace(core('1.4.0')), '')).toThrow(
      'needs devDependencies.vite-plus',
    )
  })

  it('refuses a lockfile without the bundled vitest', () => {
    expect(() => syncedPins(pkg('1.5.0', '5.0.5'), workspace(core('1.4.0')), '')).toThrow(
      'no vitest dependency for vite-plus',
    )
    const cut = [
      'snapshots:',
      '  vite-plus@1.4.0(x):',
      '    dependencies:',
      '  next@1:',
      '      vitest: 5.0.5',
    ]
    expect(() =>
      syncedPins(pkg('1.5.0', '5.0.5'), workspace(core('1.4.0')), cut.join('\n')),
    ).toThrow('no vitest dependency for vite-plus')
  })

  it('refuses an ambiguous coverage-v8 entry rather than guessing', () => {
    const twice = pkg('1.5.0', '5.0.5').replace(
      '"name": "app"',
      '"name": "app", "x": {"@vitest/coverage-v8": "5.0.5"}',
    )
    expect(() => syncedPins(twice, workspace(core('1.4.0')), lock('5.1.0'))).toThrow('expected one')
  })
})
