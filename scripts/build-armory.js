#!/usr/bin/env node
/**
 * One-time script: Build armory.json and units.json from data.cdb.
 * Run: node scripts/build-armory.js
 */

import { readFileSync, readdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

// Image filename -> Equipment ID exceptions (typos, naming differences)
const IMAGE_TO_EQUIPMENT = {
  "last_stand_protocls.png": "LastStandProtocols",
  "anti-personal_shrapnels.png": "AntiPersonalShrapnels",
  "stinging_gaz.png": "StingingGaz",
  "sardaukar_cleaver.png": "SardaukarCleaver",
  "recursive_lense.png": "RecursiveLense",
  "sismic_ammo.png": "SismicAmmo",
  "fix-up_kit.png": "FixupKit",
  "running_sandshoes.png": "RunningSandshoes",
  "optmized_bed_arrangement.png": "OptmizedBedArrangement",
  "maker's_effigy.png": "MakersEffigy",
  "pre-loaded_weapons.png": "PreLoadedWeapons",
  "preloaded_veapon.png": "PreLoadedWeapons",
  "material_pre-processor.png": "MaterialPreProcessor",
  "additional_cannons.png": "AdditionalCannons_Altar",
  "listening_devices.png": "ListeningDevices_Altar",
  "heavy_armor_altar.png": "HeavyArmor_Altar",
  "symbol_of_freedom.png": "WindTraps_Altar",
  "storm_sails.png": "AdditionalSails_Altar",
  "recon_stations.png": "ReconStations_Altar",
  "sand_cover.png": "SandCover",
  "red_fluid.png": "RedFluid",
  "dual_gun.png": "DualGuns",
  "long_rifles.png": "LongRifles",
  "improved_medicine.png": "ImprovedMedicine",
  "medkits.png": "Medkit",
  "sharpen_tools.png": "SharpenTools",
  "sharpened_blade.png": "SharpenBlades",
  "skirmish_gear.png": "CrysKnives",
  "improved_alloy.png": "ImprovedAlloy",
  "analysis_visor.png": "AnalysisVisors",
  "better_ammunitions.png": "BetterAmmunition",
  "experimental_combustible.png": "ExperimentalCombustibles",
  "experimental_weapon.png": "ExperimentalWeapons",
  "shrapnel_ammunition.png": "ShrapnelAmmunitions",
}

// Excluded images (generic/placeholder)
const EXCLUDED_IMAGES = [
  "gear.png",
  "gear_2.png",
  "output_1.png",
  "output_29.png",
  "offensive_mindset____.png",
]
const EXCLUDED_PATTERNS = [/^output_\d+\.png$/]

function imageToEquipmentId(filename) {
  if (IMAGE_TO_EQUIPMENT[filename]) return IMAGE_TO_EQUIPMENT[filename]
  if (EXCLUDED_IMAGES.includes(filename)) return null
  if (EXCLUDED_PATTERNS.some((p) => p.test(filename))) return null

  const base = filename.replace(/\.png$/i, "")
  const pascal = base
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toUpperCase())
  return pascal || null
}

function snakeToPascal(str) {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toUpperCase())
}

function main() {
  const cdbPath = join(ROOT, "res/assets/data.cdb")
  const gearDir = join(ROOT, "public/images/gear")
  const outJson = join(ROOT, "src/components/Armory/armory.json")
  const outNotes = join(ROOT, "src/components/Armory/armory-mapping-notes.md")
  const outUnits = join(ROOT, "src/components/Units/units.json")

  const cdb = JSON.parse(readFileSync(cdbPath, "utf-8"))
  const sheets = cdb.sheets || []

  const equipmentSheet = sheets.find((s) => s.name === "equipment")
  const traitSheet = sheets.find((s) => s.name === "trait")
  const unitSheet = sheets.find((s) => s.name === "unit")

  if (!equipmentSheet || !traitSheet || !unitSheet) {
    throw new Error("Missing required sheets in CDB")
  }

  const equipments = new Map()
  for (const line of equipmentSheet.lines || []) {
    equipments.set(line.id, {
      id: line.id,
      name: line.name || line.id,
      traits: (line.traits || []).map((t) => t.ref).filter(Boolean),
    })
  }

  const traits = new Map()
  for (const line of traitSheet.lines || []) {
    traits.set(line.id, {
      id: line.id,
      attributes: line.attributes || [],
    })
  }

  // Build unit name → faction mapping and equipment → units mapping
  const unitNameToFaction = new Map()
  const equipmentToUnits = new Map()
  const unitsByFaction = {}

  for (const unit of unitSheet.lines || []) {
    const unitId = unit.id || "Unknown"
    const unitName = unit.texts?.name || unit.id || "Unknown"
    const unitDesc = unit.texts?.desc || ""
    const faction = unit.faction || null
    const eqRefs = (unit.equipment || []).map((e) => e.ref).filter(Boolean)
    const flags = unit.flags || 0

    // Map unit name to faction
    if (faction) {
      unitNameToFaction.set(unitName, faction)
    }

    // Map equipment to units
    for (const eqId of eqRefs) {
      if (!equipmentToUnits.has(eqId)) equipmentToUnits.set(eqId, [])
      equipmentToUnits.get(eqId).push(unitName)
    }

    // Group units by faction for units.json (only if faction exists and has equipment)
    if (faction && eqRefs.length > 0) {
      if (!unitsByFaction[faction]) unitsByFaction[faction] = []
      unitsByFaction[faction].push({
        id: unitId,
        name: unitName,
        desc: unitDesc,
        equipment: eqRefs,
        flags: flags,
      })
    }
  }

  function getTargetEffectsList(traitId) {
    const trait = traits.get(traitId)
    if (!trait) return []
    const descs = []
    for (const attr of trait.attributes || []) {
      if (attr.desc) descs.push(attr.desc)
    }
    return descs
  }

  function buildAttributesForEquipment(equipment) {
    const result = []
    for (const traitRef of equipment.traits || []) {
      const trait = traits.get(traitRef)
      if (!trait) continue
      for (const attr of trait.attributes || []) {
        if (!attr.desc) continue
        if (attr.desc.includes("::target_effects_list::")) {
          const targetTrait = attr.target?.trait
          const list = targetTrait ? getTargetEffectsList(targetTrait) : []
          result.push({ desc: attr.desc, target_effects_list: list })
        } else if (attr.desc.includes("::target_effects_list2::")) {
          const targetTrait = attr.target2?.trait
          const list = targetTrait ? getTargetEffectsList(targetTrait) : []
          result.push({ desc: attr.desc, target_effects_list: list })
        } else {
          result.push(attr.desc)
        }
      }
    }
    return result
  }

  const images = readdirSync(gearDir).filter((f) => f.endsWith(".png"))
  const armoryEntries = []
  const imagesWithoutEquipment = []
  const equipmentIdsWithImages = new Set()

  for (const img of images) {
    const equipmentId = imageToEquipmentId(img)
    if (!equipmentId) {
      imagesWithoutEquipment.push(img)
      continue
    }
    const equipment = equipments.get(equipmentId)
    if (!equipment) {
      imagesWithoutEquipment.push(img)
      continue
    }
    equipmentIdsWithImages.add(equipmentId)
    const units = [...new Set(equipmentToUnits.get(equipmentId) || [])]
    const attributes = buildAttributesForEquipment(equipment)

    // Get factions from units that use this equipment
    const factions = [
      ...new Set(
        units.map((u) => unitNameToFaction.get(u)).filter(Boolean)
      ),
    ]

    armoryEntries.push({
      name: equipment.name,
      unit: units,
      faction: factions,
      attributes,
      image: img,
    })
  }

  const equipmentWithoutImages = [...equipments.keys()].filter(
    (id) => !equipmentIdsWithImages.has(id)
  )

  writeFileSync(outJson, JSON.stringify(armoryEntries, null, 2), "utf-8")

  const notes = `# Armory mapping notes

Generated by \`node scripts/build-armory.js\`

## Images without equipment match

${imagesWithoutEquipment.length > 0 ? imagesWithoutEquipment.map((i) => `- ${i}`).join("\n") : "(none)"}

## Equipment in CDB without matching image

${equipmentWithoutImages.length > 0 ? equipmentWithoutImages.map((i) => `- ${i}`).join("\n") : "(none)"}

## Stats

- Armory entries: ${armoryEntries.length}
- Images without equipment: ${imagesWithoutEquipment.length}
- Equipment without image: ${equipmentWithoutImages.length}
`

  writeFileSync(outNotes, notes, "utf-8")

  // Write units.json grouped by faction
  writeFileSync(outUnits, JSON.stringify(unitsByFaction, null, 2), "utf-8")

  const totalUnits = Object.values(unitsByFaction).reduce(
    (sum, arr) => sum + arr.length,
    0
  )

  console.log(`Written ${armoryEntries.length} entries to armory.json`)
  console.log(`Written armory-mapping-notes.md`)
  console.log(
    `Written units.json with ${totalUnits} units across ${Object.keys(unitsByFaction).length} factions`
  )
}

main()
