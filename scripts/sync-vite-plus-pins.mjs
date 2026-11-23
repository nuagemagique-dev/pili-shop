// Moves the vite-plus pins of package.json and pnpm-workspace.yaml (see vite-plus-pins.mjs). Run by
// .github/workflows/dependabot-vite-plus.yml; prints `changed` or `unchanged`.
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { syncedPins } from './vite-plus-pins.mjs'

const pkgPath = new URL('../package.json', import.meta.url)
const workspacePath = new URL('../pnpm-workspace.yaml', import.meta.url)
const pkgText = readFileSync(pkgPath, 'utf8')
const workspaceText = readFileSync(workspacePath, 'utf8')
const declared = JSON.parse(pkgText).devDependencies?.['vite-plus']
// The vite-plus-core release that vite-plus depends on, as published (its version differs since vite-plus 1.7.0).
const coreSpec = execFileSync('npm', ['view', `vite-plus@${declared}`, 'dependencies.vite'], {
  encoding: 'utf8',
}).trim()
const synced = syncedPins(
  pkgText,
  workspaceText,
  readFileSync(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8'),
  coreSpec,
)
if (synced.pkg === pkgText && synced.workspace === workspaceText) {
  console.log('unchanged')
} else {
  writeFileSync(pkgPath, synced.pkg)
  writeFileSync(workspacePath, synced.workspace)
  console.log('changed')
}
