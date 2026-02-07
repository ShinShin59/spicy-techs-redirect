#!/usr/bin/env node
/**
 * Verify development tech attributes against the Dune: Spice Wars Wiki.
 *
 * Fetches wiki pages via MediaWiki API, parses faction/attribute tables,
 * and diffs expected vs actual attributes from developments.json.
 *
 * Run: node scripts/verify-developments-wiki.mjs
 */

import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, "..")
const WIKI_API = "https://dunespicewars.fandom.com/api.php"

const WIKI_FACTION_ORDER = ["atreides", "harkonnen", "fremen", "smuggler", "corrino", "ecaz", "vernius"]

/** Load optional overrides: { "devId": "Wiki_Page_Slug" } */
async function loadSlugOverrides() {
  try {
    const raw = await readFile(
      path.join(PROJECT_ROOT, "scripts/wiki-slug-overrides.json"),
      "utf-8"
    )
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** Load optional ignore list: { "devId": true } to skip reporting diffs */
async function loadVerifyIgnores() {
  try {
    const raw = await readFile(
      path.join(PROJECT_ROOT, "scripts/verify-ignores.json"),
      "utf-8"
    )
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** Derive wiki slug from dev name: "Advanced Engineering" -> "Advanced_Engineering" */
function nameToSlug(name) {
  return name.replace(/\s+/g, "_")
}

/** Fetch wikitext content for a page */
async function fetchWikiContent(slug) {
  const url = `${WIKI_API}?action=query&titles=${encodeURIComponent(slug)}&prop=revisions&rvprop=content&rvslots=main&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Wiki fetch failed: ${res.status}`)
  const json = await res.json()
  const pages = json?.query?.pages
  if (!pages) return null
  const page = Object.values(pages)[0]
  if (!page || page.missing !== undefined) return null
  const content = page.revisions?.[0]?.slots?.main?.["*"]
  return content ?? null
}

/**
 * Parse wikitext table into rows of { attribute, factions }.
 * Table format: rows after |-\n with first cell = attribute, next 7 = faction columns (X or empty).
 */
function parseWikiTable(wikitext) {
  const tableMatch = wikitext.match(/\{\|\s*class="fandom-table"[^]*?\|\}/s)
  if (!tableMatch) return null

  const table = tableMatch[0]
  const rows = table.split(/\|\-\s*\n/).slice(1)
  const result = []

  for (const row of rows) {
    const cells = row.split(/\n\|/).map((c) => c.trim().replace(/^\|/, ""))
    if (cells.length < 8) continue
    const attribute = cells[0].trim()
    const factionCols = cells.slice(1, 8)
    const factions = []
    for (let i = 0; i < 7; i++) {
      if (/X/i.test(factionCols[i] || "")) {
        factions.push(WIKI_FACTION_ORDER[i])
      }
    }
    if (attribute) result.push({ attribute, factions })
  }
  return result
}

/** Term equivalents for fuzzy matching */
const TERM_EQUIVS = {
  unlock: ["unlocks", "unlock"],
  unlocks: ["unlocks", "unlock"],
  maintenance: ["maintenance"],
  center: ["center"],
  command: ["command"],
  post: ["post"],
  district: ["district"],
  building: ["building", "district"],
  crew: ["crew", "harvesters"],
  maximum: ["max"],
  max: ["maximum", "max"],
  harvester: ["harvesters"],
  fuel: ["fuel"],
  cell: ["cells", "cell"],
  factory: ["factories", "factory"],
  produce: ["produces", "product", "production"],
  solari: ["solari"],
  water: ["water"],
  spice: ["spice"],
  village: ["village", "outpost"],
  outpost: ["outpost", "village"],
  resources: ["resources", "prod", "production"],
  constructed: ["building"],
  militia: ["militia"],
  health: ["health", "life"],
  life: ["life", "health"],
  missile: ["missile"],
  battery: ["battery"],
  power: ["power"],
  mechanics: ["mechanical"],
  mechanical: ["mechanical", "mechanics"],
  regeneration: ["regen"],
  embassy: ["landsraad", "quarters"],
  landsraad: ["landsraad"],
  quarters: ["quarters"],
  political: ["political"],
  agreement: ["agreement"],
  treaty: ["treaty"],
  interrogation: ["interrogation"],
  support: ["support"],
  drone: ["drone"],
  fusion: ["fusion"],
  plant: ["plant"],
  stealth: ["stealth"],
  gear: ["gear"],
  detect: ["detection", "detect"],
  mission: ["mission"],
  enemy: ["enemies"],
  choam: ["choam"],
  share: ["share"],
  sell: ["selling"],
  agent: ["agents"],
  recruit: ["recruitment"],
  impact: ["penalty"],
  shuttle: ["shuttles", "shuttle"],
  shuttles: ["shuttle", "shuttles"],
  move: ["speed", "faster"],
  speed: ["speed", "faster"],
  faster: ["speed", "faster"],
  manpower: ["manpower"],
  harpy: ["harpy"],
  sanctuary: ["sanctuary"],
  provides: ["provides"],
  pillage: ["pillage", "pillaging"],
  scavenging: ["scavenging"],
  annex: ["annex"],
  authority: ["authority"],
  sietch: ["sietch"],
  sietches: ["sietch"],
  relation: ["relation"],
  camouflag: ["camouflage"],
  camouflage: ["camouflage"],
  infiltration: ["infiltration"],
  cell: ["cells"],
}

/** Normalize attribute for fuzzy comparison */
function normalizeAttr(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\b(the|a|an|in|to|of|per|from)\b/g, "")
    .replace(/\bin base building\b/g, "")
    .replace(/\bvillage building\b/g, "")
    .replace(/\bbuilding in your main base\b/g, "")
    .replace(/\bdistrict building\b/g, "")
    .replace(/\bdistrict\b/g, "")
    .replace(/\bunit\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Expand term to equivalents for matching */
function expandTerm(t) {
  const low = t.toLowerCase()
  return TERM_EQUIVS[low] ? [low, ...TERM_EQUIVS[low]] : [low]
}

/** Extract key terms; also include numeric patterns like +2% for matching */
function keyTerms(s) {
  const n = normalizeAttr(s)
  const terms = n
    .split(/\s+/)
    .filter((t) => t.length > 1 && !/^\d+$/.test(t))
  const numTerms = (s.match(/[+-]?\d+%?/g) || []).map((t) => t.toLowerCase())
  return [...terms, ...numTerms]
}

/** Check if two attributes are semantically similar */
function attrMatches(wikiAttr, jsonAttr) {
  const w = normalizeAttr(wikiAttr)
  const j = normalizeAttr(jsonAttr)
  if (w === j) return true
  if (w.includes(j) || j.includes(w)) return true
  const wTerms = new Set()
  for (const t of keyTerms(wikiAttr)) {
    expandTerm(t).forEach((e) => wTerms.add(e))
  }
  const jTerms = keyTerms(jsonAttr)
  let overlap = 0
  for (const jt of jTerms) {
    if (wTerms.has(jt)) overlap++
    else if (expandTerm(jt).some((e) => wTerms.has(e))) overlap++
  }
  return jTerms.length > 0 && overlap >= Math.min(2, Math.max(1, jTerms.length))
}

async function main() {
  const developmentsPath = path.join(
    PROJECT_ROOT,
    "src/components/Developments/developments.json"
  )
  const developments = JSON.parse(await readFile(developmentsPath, "utf-8"))
  const overrides = await loadSlugOverrides()
  const ignores = await loadVerifyIgnores()

  const idToDev = new Map(developments.map((d) => [d.id, d]))

  /** Factions that use the base tech (no replacement) */
  function getFactionsForBaseTech(baseId) {
    const replacements = developments.filter((d) => d.replaces === baseId && d.faction)
    const replacedFactions = new Set(replacements.map((r) => r.faction))
    return WIKI_FACTION_ORDER.filter((f) => !replacedFactions.has(f))
  }

  const wikiCache = new Map()

  async function getWikiData(dev) {
    const baseId = dev.replaces ?? dev.id
    const baseDev = idToDev.get(baseId)
    if (!baseDev) return null
    const slug = overrides[baseId] ?? overrides[baseDev.id] ?? nameToSlug(baseDev.name)
    if (!wikiCache.has(slug)) {
      const content = await fetchWikiContent(slug)
      wikiCache.set(slug, content ? parseWikiTable(content) : null)
    }
    return wikiCache.get(slug)
  }

  const diffs = []
  let checked = 0
  let skipped = 0

  for (const dev of developments) {
    const baseId = dev.replaces ?? dev.id
    const baseDev = idToDev.get(baseId)
    const wikiSlug = overrides[baseId] ?? overrides[baseDev?.id] ?? nameToSlug(baseDev?.name ?? "")

    const wikiRows = await getWikiData(dev)
    if (!wikiRows || wikiRows.length === 0) {
      skipped++
      continue
    }

    let expectedAttrs
    if (dev.faction) {
      expectedAttrs = wikiRows
        .filter((r) => r.factions.includes(dev.faction))
        .map((r) => r.attribute)
    } else {
      const baseFactions = getFactionsForBaseTech(dev.id)
      if (baseFactions.length === 0) continue
      const attrSets = baseFactions.map((f) =>
        new Set(wikiRows.filter((r) => r.factions.includes(f)).map((r) => r.attribute))
      )
      const intersection = attrSets[0]
        ? [...attrSets[0]].filter((a) => attrSets.every((s) => s.has(a)))
        : []
      expectedAttrs = intersection
    }

    const actualAttrs = (dev.attributes || []).filter((a) => typeof a === "string")
    const expectedNormalized = expectedAttrs.map(normalizeAttr)
    const actualNormalized = actualAttrs.map(normalizeAttr)

    const missing = expectedAttrs.filter(
      (e, i) => !actualNormalized.some((a) => attrMatches(e, a))
    )
    const extra = actualAttrs.filter(
      (a, i) => !expectedNormalized.some((e) => attrMatches(e, a))
    )

    if ((missing.length > 0 || extra.length > 0) && !ignores[dev.id]) {
      diffs.push({
        id: dev.id,
        name: dev.name,
        faction: dev.faction ?? "base",
        wikiSlug,
        missing,
        extra,
        expected: expectedAttrs,
        actual: actualAttrs,
      })
    }
    checked++
  }

  console.log("=== Development Wiki Verification Report ===\n")
  console.log(`Checked: ${checked} | Skipped (no wiki): ${skipped} | Diffs: ${diffs.length}\n`)

  for (const d of diffs) {
    console.log(`--- ${d.name} (${d.id}) [${d.faction}] ---`)
    console.log(`Wiki page: https://dunespicewars.fandom.com/wiki/${d.wikiSlug.replace(/ /g, "_")}`)
    if (d.missing.length > 0) {
      console.log("  MISSING (in wiki, not in JSON):")
      d.missing.forEach((m) => console.log(`    - ${m}`))
    }
    if (d.extra.length > 0) {
      console.log("  EXTRA (in JSON, not in wiki):")
      d.extra.forEach((e) => console.log(`    - ${e}`))
    }
    console.log("")
  }

  if (diffs.length > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
