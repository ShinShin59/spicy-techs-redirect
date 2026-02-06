#!/usr/bin/env node
/**
 * One-time script: Build armory.json and units.json from data.cdb.
 * Run: node scripts/build-armory.js
 */

import { readFileSync, readdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { buildLookups, resolveAttribute } from "./cdb-resolver.js"

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
  "prana_bindu_initiation.png": "PranaBindu",
  "prana_bindu_initiation.webp": "PranaBindu",
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
  // Try lookup with original filename first, then with .png variant for legacy map entries
  const pngVariant = filename.replace(/\.webp$/i, ".png")
  if (IMAGE_TO_EQUIPMENT[filename]) return IMAGE_TO_EQUIPMENT[filename]
  if (IMAGE_TO_EQUIPMENT[pngVariant]) return IMAGE_TO_EQUIPMENT[pngVariant]
  if (EXCLUDED_IMAGES.includes(filename) || EXCLUDED_IMAGES.includes(pngVariant)) return null
  if (EXCLUDED_PATTERNS.some((p) => p.test(filename) || p.test(pngVariant))) return null

  const base = filename.replace(/\.(png|webp)$/i, "")
  const pascal = base
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toUpperCase())
  return pascal || null
}

function main() {
  const cdbPath = join(ROOT, "res/assets/data.cdb")
  const gearDir = join(ROOT, "public/images/gear")
  const outJson = join(ROOT, "src/components/Armory/armory-new.json")
  const outNotes = join(ROOT, "src/components/Armory/armory-mapping-notes.md")
  const outUnits = join(ROOT, "src/components/Units/units.json")
  const outLog = join(ROOT, "src/components/Armory/armory-extraction-log.txt")

  const cdb = JSON.parse(readFileSync(cdbPath, "utf-8"))
  const sheets = cdb.sheets || []
  const lookups = buildLookups(cdb)

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

  // Build unit name -> faction mapping and equipment -> units mapping
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

  const unresolvedPlaceholders = []
  const emptyTargetEffectsLists = []
  const equipmentWithoutAttributes = []
  const attributesWithoutLabels = []

  function buildAttributesForEquipment(equipment) {
    const result = []
    for (const traitRef of equipment.traits || []) {
      const trait = traits.get(traitRef)
      if (!trait) continue
      for (const attr of trait.attributes || []) {
        // Don't skip attributes without desc - resolveAttribute can generate descriptions from data
        // Use shared resolver for all attributes
        const resolved = resolveAttribute(attr, lookups)
        if (resolved) {
          // Check for unresolved placeholders
          const resolvedStr = typeof resolved === "string" ? resolved : resolved.desc
          if (resolvedStr && /::[^:]+::/.test(resolvedStr)) {
            unresolvedPlaceholders.push({
              equipment: equipment.id,
              attribute: resolvedStr,
            })
          }
          // Check for attributes that are just percentages/values without labels (like "+40%")
          if (typeof resolved === "string" && /^[+-]?\d+%?$/.test(resolved.trim())) {
            // This is just a value without context - log it for debugging
            attributesWithoutLabels.push({
              equipment: equipment.id,
              attribute: resolved,
              originalAttr: JSON.stringify(attr),
            })
          }
          // Check for empty target_effects_list when placeholder was present
          if (typeof resolved === "object" && resolved.target_effects_list) {
            const originalDesc = attr.desc || ""
            if (originalDesc.includes("::target_effects_list") && resolved.target_effects_list.length === 0) {
              emptyTargetEffectsLists.push({
                equipment: equipment.id,
                desc: resolved.desc,
              })
            }
          }
          result.push(resolved)
        }
      }
    }
    return result.filter((a) => {
      if (typeof a === "string") return a.length > 0
      if (typeof a === "object" && a !== null) return a.desc && a.desc.length > 0
      return false
    })
  }

  const images = readdirSync(gearDir).filter((f) => f.endsWith(".png") || f.endsWith(".webp"))
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

    // Track equipment with no attributes for debugging
    if (attributes.length === 0 && equipment.traits && equipment.traits.length > 0) {
      equipmentWithoutAttributes.push({
        id: equipmentId,
        name: equipment.name,
        traitCount: equipment.traits.length,
        traits: equipment.traits,
      })
    }

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
      id: equipmentId,
    })
  }

  const equipmentWithoutImages = [...equipments.keys()].filter(
    (id) => !equipmentIdsWithImages.has(id)
  )

  // Post-process: Ensure PranaBindu is included for Trooper and Warden Atreides
  // (This equipment exists in CDB but may not have been extracted properly)
  const pranaBinduEquipment = equipments.get("PranaBindu")
  if (pranaBinduEquipment && !equipmentIdsWithImages.has("PranaBindu")) {
    const pranaBinduUnits = [...new Set(equipmentToUnits.get("PranaBindu") || [])]
    const pranaBinduAttributes = buildAttributesForEquipment(pranaBinduEquipment)
    const pranaBinduFactions = [
      ...new Set(
        pranaBinduUnits.map((u) => unitNameToFaction.get(u)).filter(Boolean)
      ),
    ]
    
    // Find image file
    const pranaBinduImage = images.find((img) => 
      img.toLowerCase().includes("prana_bindu") || 
      img.toLowerCase().includes("prana_bindu_initiation")
    ) || "prana_bindu_initiation.webp"
    
    armoryEntries.push({
      name: pranaBinduEquipment.name,
      unit: pranaBinduUnits,
      faction: pranaBinduFactions,
      attributes: pranaBinduAttributes,
      image: pranaBinduImage,
      id: "PranaBindu",
    })
  }

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
- Unresolved placeholders: ${unresolvedPlaceholders.length}
- Empty target_effects_list: ${emptyTargetEffectsLists.length}
- Equipment without attributes (has traits): ${equipmentWithoutAttributes.length}
- Attributes without labels: ${attributesWithoutLabels.length}
`

  writeFileSync(outNotes, notes, "utf-8")

  // Write extraction log
  const logLines = [
    `Armory Extraction Log - ${new Date().toISOString()}`,
    "=".repeat(60),
    "",
    `Total entries: ${armoryEntries.length}`,
    `Unresolved placeholders: ${unresolvedPlaceholders.length}`,
    `Empty target_effects_list: ${emptyTargetEffectsLists.length}`,
    "",
  ]

  if (unresolvedPlaceholders.length > 0) {
    logLines.push("## Unresolved Placeholders")
    logLines.push("")
    unresolvedPlaceholders.forEach(({ equipment, attribute }) => {
      logLines.push(`Equipment: ${equipment}`)
      logLines.push(`  Attribute: ${attribute}`)
      logLines.push("")
    })
  }

  if (emptyTargetEffectsLists.length > 0) {
    logLines.push("## Empty target_effects_list (when placeholder was present)")
    logLines.push("")
    emptyTargetEffectsLists.forEach(({ equipment, desc }) => {
      logLines.push(`Equipment: ${equipment}`)
      logLines.push(`  Description: ${desc}`)
      logLines.push("")
    })
  }

  if (equipmentWithoutAttributes.length > 0) {
    logLines.push("## Equipment with traits but no extracted attributes")
    logLines.push("")
    equipmentWithoutAttributes.forEach(({ id, name, traitCount, traits }) => {
      logLines.push(`Equipment: ${id} (${name})`)
      logLines.push(`  Traits: ${traitCount} (${traits.join(", ")})`)
      logLines.push("")
    })
  }

  if (attributesWithoutLabels.length > 0) {
    logLines.push("## Attributes without labels (just values like '+40%')")
    logLines.push("")
    attributesWithoutLabels.forEach(({ equipment, attribute, originalAttr }) => {
      logLines.push(`Equipment: ${equipment}`)
      logLines.push(`  Attribute: ${attribute}`)
      logLines.push(`  Original data: ${originalAttr}`)
      logLines.push("")
    })
  }

  writeFileSync(outLog, logLines.join("\n"), "utf-8")

  // Write units.json grouped by faction
  writeFileSync(outUnits, JSON.stringify(unitsByFaction, null, 2), "utf-8")

  const totalUnits = Object.values(unitsByFaction).reduce(
    (sum, arr) => sum + arr.length,
    0
  )

  console.log(`Written ${armoryEntries.length} entries to armory-new.json`)
  console.log(`Written armory-mapping-notes.md`)
  console.log(`Written extraction log to armory-extraction-log.txt`)
  if (unresolvedPlaceholders.length > 0) {
    console.warn(`⚠️  Warning: ${unresolvedPlaceholders.length} unresolved placeholders found`)
  }
  if (emptyTargetEffectsLists.length > 0) {
    console.warn(`⚠️  Warning: ${emptyTargetEffectsLists.length} empty target_effects_list found`)
  }
  if (equipmentWithoutAttributes.length > 0) {
    console.warn(`⚠️  Warning: ${equipmentWithoutAttributes.length} equipment items have traits but no extracted attributes`)
  }
  if (attributesWithoutLabels.length > 0) {
    console.warn(`⚠️  Warning: ${attributesWithoutLabels.length} attributes are missing labels (check log for details)`)
  }
  console.log(
    `Written units.json with ${totalUnits} units across ${Object.keys(unitsByFaction).length} factions`
  )
}

main()
