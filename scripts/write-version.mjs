/**
 * Writes NUXT_PUBLIC_APP_VERSION and NUXT_PUBLIC_GIT_HASH into ui/.env
 * so they are available to both `nuxt dev` and `nuxt build`.
 *
 * Runs automatically via the predev / prebuild npm lifecycle hooks.
 * You can also run it manually: node scripts/write-version.mjs
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const envFile = resolve(root, '.env')

const require = createRequire(import.meta.url)
const { version } = require('../package.json')

// Respect pre-set env vars first (e.g. Docker build args, CI injection).
// Only fall back to git / package.json when running locally.
const appVersion = process.env.NUXT_PUBLIC_APP_VERSION || version

const gitHash =
  process.env.NUXT_PUBLIC_GIT_HASH ||
  (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf-8', cwd: root }).trim()
    } catch {
      return 'unknown'
    }
  })()

/** Upsert a single KEY=VALUE line in an .env file */
function upsertEnvVar(key, value, file) {
  const line = `${key}=${value}`
  if (!existsSync(file)) {
    writeFileSync(file, `${line}\n`, 'utf-8')
    return
  }
  const content = readFileSync(file, 'utf-8')
  const regex = new RegExp(`^${key}=.*$`, 'm')
  const updated = regex.test(content) ? content.replace(regex, line) : content.endsWith('\n') ? content + `${line}\n` : `${content}\n${line}\n`
  writeFileSync(file, updated, 'utf-8')
}

upsertEnvVar('NUXT_PUBLIC_APP_VERSION', appVersion, envFile)
upsertEnvVar('NUXT_PUBLIC_GIT_HASH', gitHash, envFile)

console.log(`[write-version] v${appVersion} #${gitHash} → ${envFile}`)
