#!/usr/bin/env node
/**
 * Build developments.json from data.cdb.
 * Run: node scripts/build-developments.js
 *
 * Icons use sprite sheets (techIcons2.png) - gfx gives { file, size, x, y } for
 * background-position: -(x*size)px -(y*size)px at runtime.
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

/** CDB domain -> app DevelopmentsSummary key */
const DOMAIN_TO_KEY = {
  Economy: "economic",
  Military: "military",
  Statecraft: "statecraft",
  Expansion: "green",
}

/** CDB faction name -> app FactionLabel */
const FACTION_TO_LABEL = {
  Harkonnen: "harkonnen",
  Atreides: "atreides",
  Ecaz: "ecaz",
  Smugglers: "smuggler",
  Vernius: "vernius",
  Fremen: "fremen",
  Corrino: "corrino",
}

function main() {
  const cdbPath = join(ROOT, "res/assets/data.cdb")
  const outJson = join(ROOT, "src/components/Developments/developments.json")

  const cdb = JSON.parse(readFileSync(cdbPath, "utf-8"))
  const devSheet = (cdb.sheets || []).find((s) => s.name === "development")
  if (!devSheet) throw new Error("Missing development sheet in CDB")

  const entries = []

  for (const d of devSheet.lines || []) {
    const id = d.id
    if (!id) continue

    const name = d.name ?? d.texts?.name ?? id
    const desc = d.desc ?? d.texts?.desc ?? ""
    const domain = d.domain ?? "Economy"
    const tier = d.tier ?? 0
    const gridX = d.gridX ?? 0
    const gridY = d.gridY ?? 0
    const requires = d.requires ?? null
    const replaces = d.replaces ?? null
    const faction = d.faction ? FACTION_TO_LABEL[d.faction] ?? d.faction : null

    const gfx = d.gfx
      ? {
        file: d.gfx.file,
        size: d.gfx.size,
        x: d.gfx.x,
        y: d.gfx.y,
      }
      : undefined

    const attributes = (d.attributes || [])
      .map((a) => a.desc)
      .filter(Boolean)

    entries.push({
      id,
      name,
      desc,
      domain: DOMAIN_TO_KEY[domain] ?? domain.toLowerCase(),
      tier,
      gridX,
      gridY,
      requires,
      replaces,
      faction: faction ?? undefined,
      gfx,
      attributes: attributes.length ? attributes : undefined,
    })
  }

  writeFileSync(outJson, JSON.stringify(entries, null, 2), "utf-8")
  console.log(`Written ${entries.length} developments to ${outJson}`)
}

main()
