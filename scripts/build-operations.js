#!/usr/bin/env node
/**
 * Build operations.json from data.cdb (mission + ability sheets).
 * Run: node scripts/build-operations.js
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

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
  const outJson = join(ROOT, "src/components/Operations/operations.json")

  const cdb = JSON.parse(readFileSync(cdbPath, "utf-8"))
  const sheets = cdb.sheets || []

  const missionSheet = sheets.find((s) => s.name === "mission")
  const abilitySheet = sheets.find((s) => s.name === "ability")

  if (!missionSheet || !abilitySheet) {
    throw new Error("Missing mission or ability sheet in CDB")
  }

  const abilitiesById = new Map()
  for (const line of abilitySheet.lines || []) {
    const id = line.id
    if (!id) continue
    const name = line.name ?? line.texts?.name ?? id
    const desc = line.desc ?? line.texts?.desc ?? ""
    abilitiesById.set(id, { name, desc })
  }

  const entries = []

  for (const m of missionSheet.lines || []) {
    const id = m.id
    const effects = m.effects
    if (!id || !effects?.ope) continue
    if (id.startsWith("CB_")) continue

    const opeId = effects.ope
    const ability = abilitiesById.get(opeId)
    const name = ability?.name ?? id
    const desc = ability?.desc ?? ""

    const cost = Array.isArray(m.cost)
      ? m.cost.map((c) => ({ res: c.res ?? "Intel", qty: c.qty ?? 0 }))
      : []

    const gfx = m.gfx
      ? {
        file: m.gfx.file ?? "",
        size: m.gfx.size ?? 114,
        x: m.gfx.x ?? 0,
        y: m.gfx.y ?? 0,
      }
      : { file: "", size: 114, x: 0, y: 0 }

    const props = {}
    if (m.props) {
      if (m.props.onlyForFactions && Array.isArray(m.props.onlyForFactions)) {
        const raw = m.props.onlyForFactions.map((f) =>
          typeof f === "object" && f?.faction ? f.faction : f
        )
        props.onlyForFactions = raw
          .map((f) => FACTION_TO_LABEL[f] ?? (typeof f === "string" ? f.toLowerCase() : null))
          .filter(Boolean)
      }
      if (m.props.tip != null) props.tip = m.props.tip
    }

    // Sprite column index gfx.x maps to operation_N.png (N = gfx.x)
    const image = `operation_${gfx.x}.png`

    entries.push({
      id,
      effects: { ope: opeId },
      cost,
      gfx,
      image,
      props: Object.keys(props).length ? props : undefined,
      name,
      desc,
    })
  }

  writeFileSync(outJson, JSON.stringify(entries, null, 2), "utf-8")
  console.log(`Written ${entries.length} operations to ${outJson}`)
}

main()
