/**
 * One-off: rename orchestrator* i18n keys to aiApp* / aiApps.
 * Run: node scripts/rename-i18n-ai-apps.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(__dirname, '../i18n/locales')

function renameKey(obj, from, to) {
  if (Object.prototype.hasOwnProperty.call(obj, from)) {
    obj[to] = obj[from]
    delete obj[from]
  }
}

/** Recursively replace "orchestrator" wording in string values for product copy (English-centric; other locales get key renames only). */
function patchStrings(value, locale) {
  if (typeof value === 'string') {
    if (locale === 'en-us') {
      return value
        .replace(/\bOrchestrators\b/g, 'AI Apps')
        .replace(/\borchestrators\b/g, 'AI Apps')
        .replace(/\bOrchestrator\b/g, 'AI App')
        .replace(/\borchestrator\b/g, 'AI App')
        .replace(/\bAI App counts\b/gi, 'AI App counts')
    }
    return value
  }
  if (Array.isArray(value)) {
    return value.map((v) => patchStrings(v, locale))
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = patchStrings(v, locale)
    }
    return out
  }
  return value
}

function transform(obj, locale) {
  renameKey(obj, 'orchestratorApi', 'aiAppApi')
  renameKey(obj, 'orchestratorPlugin', 'aiAppPlugin')
  renameKey(obj, 'orchestratorGraph', 'aiAppGraph')

  if (obj.nav) {
    renameKey(obj.nav, 'orchestrators', 'aiApps')
    obj.nav.aiAppsBadge = 'ORCHESTRATOR'
  }

  if (obj.dashboard) {
    renameKey(obj.dashboard, 'orchestrators', 'aiApps')
    renameKey(obj.dashboard, 'totalOrchestrators', 'totalAiApps')
    renameKey(obj.dashboard, 'noOrchestrators', 'noAiApps')
    renameKey(obj.dashboard, 'viewOrchestrators', 'viewAiApps')
    renameKey(obj.dashboard, 'orchestratorByTier', 'aiAppsByTier')
  }

  renameKey(obj, 'orchestrators', 'aiApps')

  if (obj.aiApps && typeof obj.aiApps === 'object') {
    obj.aiApps.legacyBadge = 'ORCHESTRATOR'
  }

  if (obj.chat) {
    renameKey(obj.chat, 'selectOrchestrator', 'selectAiApp')
    renameKey(obj.chat, 'selectOrchestratorFirst', 'selectAiAppFirst')
  }

  if (obj.settings && typeof obj.settings === 'object') {
    renameKey(obj.settings, 'orchestratorSettings', 'aiAppSettings')
    renameKey(obj.settings, 'orchestratorSettingsDescription', 'aiAppSettingsDescription')
    renameKey(obj.settings, 'saveOrchestratorDefaultsTitle', 'saveAiAppDefaultsTitle')
    renameKey(obj.settings, 'saveOrchestratorDefaultsMessage', 'saveAiAppDefaultsMessage')
  }

  if (obj.admin) {
    renameKey(obj.admin, 'maxOrchestrators', 'maxAiApps')
    renameKey(obj.admin, 'maxOrchestratorsHint', 'maxAiAppsHint')
    renameKey(obj.admin, 'orchestratorInstanceHealth', 'aiAppInstanceHealth')
  }

  if (obj.info) {
    if (obj.info.pages) {
      renameKey(obj.info.pages, 'orchestrators', 'aiApps')
    }
    if (obj.info.settings) {
      renameKey(obj.info.settings, 'orchestrators', 'aiApps')
    }
    if (obj.info.fields) {
      renameKey(obj.info.fields, 'orchestrator', 'aiApp')
    }
    renameKey(obj.info, 'orchestratorSections', 'aiAppSections')
  }

  if (obj.centralPoints) {
    renameKey(obj.centralPoints, 'orchestrator', 'aiApp')
    renameKey(obj.centralPoints, 'orchestratorRequired', 'aiAppRequired')
    renameKey(obj.centralPoints, 'selectOrchestrator', 'selectAiApp')
  }

  return patchStrings(obj, locale)
}

for (const file of fs.readdirSync(localesDir)) {
  if (!file.endsWith('.json')) continue
  const locale = file.replace('.json', '')
  const full = path.join(localesDir, file)
  const raw = fs.readFileSync(full, 'utf8')
  const data = JSON.parse(raw)
  const out = transform(structuredClone(data), locale)
  fs.writeFileSync(full, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log('updated', file)
}
