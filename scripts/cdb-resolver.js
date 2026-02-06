#!/usr/bin/env node
/**
 * Shared CDB placeholder resolver used by build-developments.js and build-armory.js.
 *
 * Resolves ::placeholder:: patterns, strips game-UI markers ([!X], [$my(...)]),
 * and handles <good>X</good> rich-text tags.
 */

/**
 * Build lookup maps from all relevant CDB sheets.
 * @param {object} cdb - parsed data.cdb JSON
 * @returns {object} lookup maps keyed by sheet name
 */
export function buildLookups(cdb) {
  const sheets = cdb.sheets || []
  const sheetByName = {}
  for (const s of sheets) {
    sheetByName[s.name] = s
  }

  /** Helper: build id -> name map from a sheet */
  function nameMap(sheetName, getNameFn) {
    const m = new Map()
    const sheet = sheetByName[sheetName]
    if (!sheet) return m
    for (const line of sheet.lines || []) {
      if (!line.id) continue
      const name = getNameFn(line)
      if (name) m.set(line.id, name)
    }
    return m
  }

  const buildings = nameMap("building", (l) => l.name || l.texts?.name || l.id)
  const resources = nameMap("resource", (l) => l.texts?.name || l.name || l.id)
  const treaties = nameMap("treaty", (l) => l.name || l.texts?.name || l.id)
  const infiltrations = nameMap("infiltration", (l) => l.texts?.name || l.name || l.id)
  const units = nameMap("unit", (l) => l.texts?.name || l.name || l.id)
  const structures = nameMap("structure", (l) => l.texts?.name || l.name || l.id)
  const factions = nameMap("faction", (l) => l.texts?.name || l.name || l.id)
  const icons = nameMap("icon", (l) => l.texts?.name || l.name || "")
  const terms = nameMap("term", (l) => l.texts?.name || l.name || "")
  const abilities = nameMap("ability", (l) => l.texts?.name || l.name || l.id)

  // Constants: id -> value
  const constants = new Map()
  const constSheet = sheetByName["constant"]
  if (constSheet) {
    for (const line of constSheet.lines || []) {
      if (line.id && line.value != null) {
        constants.set(line.id, line.value)
      }
    }
  }

  // Traits: id -> { attributes: [...], props: {...} }
  const traits = new Map()
  const traitSheet = sheetByName["trait"]
  if (traitSheet) {
    for (const line of traitSheet.lines || []) {
      if (!line.id) continue
      traits.set(line.id, {
        id: line.id,
        attributes: line.attributes || [],
        props: line.props || {},
      })
    }
  }

  return { buildings, resources, treaties, infiltrations, units, structures, factions, icons, terms, abilities, constants, traits }
}

/**
 * Resolve a target/target2 object to a human-readable name.
 * The object may have keys like { building: "X" }, { resource: "Y" }, etc.
 */
export function resolveTargetName(targetObj, lookups) {
  if (!targetObj || typeof targetObj !== "object") return null
  const { buildings, resources, treaties, infiltrations, units, structures, abilities } = lookups

  // Order matters: check the most specific keys first
  if (targetObj.building) return buildings.get(targetObj.building) || prettifyId(targetObj.building)
  if (targetObj.resource) return resources.get(targetObj.resource) || prettifyId(targetObj.resource)
  if (targetObj.treaty) return treaties.get(targetObj.treaty) || prettifyId(targetObj.treaty)
  if (targetObj.infiltration) return infiltrations.get(targetObj.infiltration) || prettifyId(targetObj.infiltration)
  if (targetObj.unit) return units.get(targetObj.unit) || prettifyId(targetObj.unit)
  if (targetObj.structure) return structures.get(targetObj.structure) || prettifyId(targetObj.structure)
  if (targetObj.ability) return abilities.get(targetObj.ability) || prettifyId(targetObj.ability)
  if (targetObj.domain) return prettifyId(targetObj.domain)
  if (targetObj.range) return prettifyId(targetObj.range)
  if (targetObj.trait) return null // traits are used for ::target_effects::, not name display
  if (targetObj.raid) return prettifyId(targetObj.raid)
  if (targetObj.siegeAction) return prettifyId(targetObj.siegeAction)
  if (targetObj.resAction) return prettifyId(targetObj.resAction)
  if (targetObj.information) return prettifyId(targetObj.information)
  if (targetObj.combo) return null // combo refs are internal
  return null
}

/**
 * Turn PascalCase / snake_case ID into readable name.
 * e.g. "MaintenanceCenter" -> "Maintenance Center"
 */
export function prettifyId(id) {
  if (!id || typeof id !== "string") return ""
  return id
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim()
}

/**
 * Format a numeric value according to a placeholder type.
 */
export function formatValue(val, type) {
  if (val == null) return "?"

  switch (type) {
    case "s_value": {
      // Signed integer: +10, -1
      const n = Number(val)
      const rounded = Number.isInteger(n) ? n : parseFloat(n.toFixed(2))
      return (rounded >= 0 ? "+" : "") + rounded
    }
    case "value": {
      // Unsigned: 10
      const n = Number(val)
      return Number.isInteger(n) ? String(n) : n.toFixed(2)
    }
    case "s_percent": {
      // Multiplier signed: 1.2 -> +20%, 0.5 -> -50%
      const pct = Math.round((Number(val) - 1) * 100)
      return (pct >= 0 ? "+" : "") + pct + "%"
    }
    case "percent": {
      // Multiplier: 0.85 -> -15%
      const pct = Math.round((Number(val) - 1) * 100)
      return (pct >= 0 ? "+" : "") + pct + "%"
    }
    case "s_percent_value": {
      // Direct percent signed: 0.1 -> +10%
      const pct = Math.round(Number(val) * 100)
      return (pct >= 0 ? "+" : "") + pct + "%"
    }
    case "percent_value": {
      // Direct percent unsigned: 0.2 -> 20%
      const pct = Math.round(Number(val) * 100)
      return pct + "%"
    }
    default:
      return String(val)
  }
}

/**
 * Collect descriptions from a trait's attributes (for ::target_effects::).
 * Recursively resolves placeholders within those descriptions.
 * If desc is missing, tries to generate from val/target data.
 * Note: When generating from trait attributes, we don't recursively resolve traits
 * to prevent infinite loops.
 */
export function getTraitEffectDescs(traitId, lookups, attr) {
  const trait = lookups.traits.get(traitId)
  if (!trait) return []
  const descs = []
  for (const a of trait.attributes || []) {
    if (a.desc) {
      const resolved = resolveDesc(a.desc, a, lookups)
      // Only add non-empty resolved descriptions
      if (resolved && resolved.trim() && resolved !== "?") {
        descs.push(resolved)
      }
    } else {
      // Try to generate description from trait attribute data
      // Don't allow recursive trait resolution to prevent infinite loops
      const generated = generateDescFromData(a, lookups, false)
      if (generated && generated.trim() && generated !== "?") {
        descs.push(generated)
      }
    }
  }
  return descs
}

/**
 * Resolve all placeholders in a description string.
 * @param {string} desc - the raw description
 * @param {object} attr - the attribute object with val, target, target2, etc.
 * @param {object} lookups - lookup maps from buildLookups()
 * @returns {string} resolved description
 */
export function resolveDesc(desc, attr, lookups) {
  if (!desc) return ""
  let result = desc

  // 1. Resolve parameterized placeholders: ::type(ConstName)::
  result = result.replace(/::(s_value|value|s_percent|percent|s_percent_value|percent_value)\(([^)]+)\)::/g, (_match, type, constName) => {
    const constVal = lookups.constants.get(constName)
    return formatValue(constVal, type)
  })

  // 2. Resolve simple value placeholders: ::s_value::, ::value::, etc.
  result = result.replace(/::(s_value|value|s_percent|percent|s_percent_value|percent_value)::/g, (_match, type) => {
    return formatValue(attr?.val, type)
  })

  // 3. Resolve ::target:: and ::target2::
  result = result.replace(/::target::/g, () => {
    const name = resolveTargetName(attr?.target, lookups)
    return name ? name : "?"
  })
  result = result.replace(/::target2::/g, () => {
    const name = resolveTargetName(attr?.target2, lookups)
    return name ? name : "?"
  })

  // 4. Resolve ::target_effects:: (inline single-effect traits)
  result = result.replace(/::target_effects::/g, () => {
    const traitId = attr?.target?.trait
    if (!traitId) return "?"
    const descs = getTraitEffectDescs(traitId, lookups, attr)
    return descs.length > 0 ? descs.join(", ") : "?"
  })

  // 5. Resolve ::target_effects2:: (uses target2.trait)
  result = result.replace(/::target_effects2::/g, () => {
    const traitId = attr?.target2?.trait
    if (!traitId) return "?"
    const descs = getTraitEffectDescs(traitId, lookups, attr)
    return descs.length > 0 ? descs.join(", ") : "?"
  })

  // 6. Resolve ::target_stacking_limit:: / ::target_stacking_limit2:: from trait props
  result = result.replace(/::target_stacking_limit::/g, () => {
    const traitId = attr?.target?.trait
    if (!traitId) return "?"
    const trait = lookups.traits.get(traitId)
    const limit = trait?.props?.stackingLimit ?? trait?.props?.maxTargetTraitStacks
    return limit != null ? String(limit) : "?"
  })
  result = result.replace(/::target_stacking_limit2::/g, () => {
    const traitId = attr?.target2?.trait
    if (!traitId) return "?"
    const trait = lookups.traits.get(traitId)
    const limit = trait?.props?.stackingLimit ?? trait?.props?.maxTargetTraitStacks
    return limit != null ? String(limit) : "?"
  })

  // 7. Resolve ::target_duration:: and ::target_duration_seconds::
  result = result.replace(/::target_duration::/g, () => {
    const traitId = attr?.target?.trait
    if (!traitId) return "?"
    const trait = lookups.traits.get(traitId)
    const dur = trait?.props?.duration
    return dur != null ? String(Math.round(dur)) : "?"
  })
  result = result.replace(/::target_duration_seconds::/g, () => {
    const traitId = attr?.target?.trait
    if (!traitId) return "?"
    const trait = lookups.traits.get(traitId)
    const dur = trait?.props?.duration
    return dur != null ? String(Math.round(dur)) : "?"
  })

  // 7b. Resolve ::target_effects_list:: / ::target_effects_list2:: inline
  // (when embedded inside a desc that was itself resolved from a trait effect)
  result = result.replace(/::target_effects_list::/g, () => {
    const traitId = attr?.target?.trait
    if (!traitId) return "?"
    const descs = getTraitEffectDescs(traitId, lookups, attr)
    return descs.length > 0 ? descs.join(", ") : "?"
  })
  result = result.replace(/::target_effects_list2::/g, () => {
    const traitId = attr?.target2?.trait
    if (!traitId) return "?"
    const descs = getTraitEffectDescs(traitId, lookups, attr)
    return descs.length > 0 ? descs.join(", ") : "?"
  })

  // 8. Strip <good>X</good> -> X (keep content)
  result = result.replace(/<good>(.*?)<\/good>/g, "$1")

  // 9. Strip [!X] patterns (icon-only game markers)
  // Also handle trailing 's' for plurals: [!Village]s -> remove entirely
  // Strip preceding prepositions when they'd be orphaned
  result = result.replace(/\b(?:in|at|of|from|on|per)\s+\[![^\]]*\]s?/gi, "")
  result = result.replace(/\[![^\]]*\]s?/g, "")

  // 10. Strip preposition + [$my(X)] patterns and variants like [$my(faction)-adjective]
  // e.g. "in [$my(mainbase)]" -> "" (strip the preposition too)
  result = result.replace(/\b(?:in|at|of|from|on)\s+\[\$my\([^)]*\)(?:-\w+)?\]/gi, "")
  // Catch any remaining [$my()] not preceded by preposition
  result = result.replace(/\[\$my\([^)]*\)(?:-\w+)?\]/g, "")

  // 11. Resolve [Faction-adjective], [Faction-longname], [Faction-shortname]
  result = result.replace(/\[(\w+)-(adjective|longname|shortname)\]/g, (_match, factionId, _variant) => {
    const name = lookups.factions.get(factionId)
    return name || prettifyId(factionId)
  })

  // 12. Resolve [BracketedID] content to human-readable names
  // Look up IDs in buildings, resources, treaties, infiltrations, units, structures, terms, icons
  result = result.replace(/\[([^\]]+)\]/g, (_match, id) => {
    // Try all lookup tables; keep brackets for runtime coloring
    const name =
      lookups.buildings.get(id) ||
      lookups.resources.get(id) ||
      lookups.treaties.get(id) ||
      lookups.infiltrations.get(id) ||
      lookups.units.get(id) ||
      lookups.structures.get(id) ||
      lookups.terms.get(id) ||
      lookups.icons.get(id) ||
      lookups.factions.get(id) ||
      null
    if (name) return "[" + name + "]"
    // For unknown IDs that look like internal refs (PascalCase with T prefix, _Debuff/_Buff suffixes),
    // prettify them and keep in brackets
    const cleaned = id
      .replace(/^T(?=[A-Z])/, "")           // strip leading T prefix
      .replace(/_(Debuff|Buff|Trait)$/i, "") // strip internal suffixes
    return "[" + prettifyId(cleaned) + "]"
  })

  // 13. Clean up extra whitespace from stripping
  result = result.replace(/\s{2,}/g, " ").trim()

  // 14. Final cleanup: Remove any remaining ::placeholder:: patterns that weren't caught
  // This ensures no unresolved placeholders remain in the output
  result = result.replace(/::[^:]+::/g, "?")

  // 15. Clean up any double question marks or question marks with spaces
  result = result.replace(/\?\s*\?/g, "?")
  result = result.replace(/\s+\?/g, "?")
  result = result.replace(/\?\s+/g, "?")
  result = result.replace(/\s{2,}/g, " ").trim()

  return result
}

/**
 * Generate a description from attribute data when desc is missing.
 * Tries to resolve trait references or generate from val/target data.
 * @param {boolean} allowTraitResolution - if false, skip trait resolution to prevent recursion
 */
/**
 * Extract stat name from a ref string (e.g., "Unit_AttackRange_ARatio" -> "attack range")
 */
function extractStatNameFromRef(ref) {
  if (!ref || typeof ref !== "string") return null
  
  // Remove common prefixes and suffixes
  let cleaned = ref
    .replace(/^(Unit_|Entity_|Army_)/, "")  // Remove prefixes
    .replace(/_ARatio$/, "")                 // Remove _ARatio suffix
    .replace(/_Ratio$/, "")                  // Remove _Ratio suffix
    .replace(/_Flat$/, "")                   // Remove _Flat suffix
    .replace(/_Bonus$/, "")                  // Remove _Bonus suffix
  
  // Common stat name mappings
  const statMappings = {
    "AttackRange": "attack range",
    "AttackSpeed": "attack speed",
    "Power": "Power",
    "Life": "Life",
    "Armor": "Armor",
    "Speed": "Speed",
    "DamageVsNonMechanical": "damage vs non-mechanical",
    "FirstAttackPower": "first attack power",
    "Cloaked": "camouflage",
    "Replace": "", // Skip replace operations
  }
  
  if (statMappings[cleaned]) {
    return statMappings[cleaned]
  }
  
  // Fallback: prettify the cleaned ref
  return prettifyId(cleaned).toLowerCase()
}

function generateDescFromData(attr, lookups, allowTraitResolution = true) {
  // If there's a trait reference, try to resolve it (but only if allowed to prevent recursion)
  if (allowTraitResolution && attr.target?.trait) {
    const traitId = attr.target.trait
    const descs = getTraitEffectDescs(traitId, lookups, attr)
    if (descs.length > 0) {
      return descs.join(", ")
    }
  }
  
  // Check if we have a ref field that can give us the stat name
  let statName = null
  if (attr.ref) {
    statName = extractStatNameFromRef(attr.ref)
  }
  
  // If there's a val and target, try to generate a basic description
  if (attr.val != null && attr.target) {
    let targetName = resolveTargetName(attr.target, lookups)
    
    // resolveTargetName should already prettify, but if it returned null or empty,
    // try to extract directly from target fields
    if (!targetName || targetName.trim() === "") {
      // Check resource field (often contains stat names like AttackSpeed, Power, etc.)
      if (attr.target.resource) {
        targetName = prettifyId(attr.target.resource)
      }
      // Check unit field
      else if (attr.target.unit) {
        targetName = prettifyId(attr.target.unit)
      }
      // Check structure field
      else if (attr.target.structure) {
        targetName = prettifyId(attr.target.structure)
      }
      // Check ability field
      else if (attr.target.ability) {
        targetName = prettifyId(attr.target.ability)
      }
      // Check range field
      else if (attr.target.range) {
        targetName = prettifyId(attr.target.range)
      }
      // Check domain field
      else if (attr.target.domain) {
        targetName = prettifyId(attr.target.domain)
      }
    }
    
    // If we still don't have a target name but have a stat name from ref, use that
    if ((!targetName || targetName.trim() === "") && statName) {
      targetName = statName
    }
    
    if (targetName) {
      // Format based on val type
      if (typeof attr.val === "number") {
        if (attr.val > 1) {
          // Multiplier: 1.4 -> +40%
          const pct = Math.round((attr.val - 1) * 100)
          return `${pct >= 0 ? "+" : ""}${pct}% ${targetName}`
        } else if (attr.val > 0 && attr.val < 1) {
          // Direct percentage: 0.4 -> +40%
          const pct = Math.round(attr.val * 100)
          return `+${pct}% ${targetName}`
        } else if (attr.val >= 1) {
          return `+${attr.val} ${targetName}`
        } else if (attr.val < 0) {
          return `${attr.val} ${targetName}`
        } else {
          return `${attr.val} ${targetName}`
        }
      }
    } else {
      // Target exists but no name - try to use target type
      if (attr.target.range) {
        const rangeName = prettifyId(attr.target.range)
        if (attr.val != null && typeof attr.val === "number") {
          if (attr.val > 1) {
            const pct = Math.round((attr.val - 1) * 100)
            return `${pct >= 0 ? "+" : ""}${pct}% at [${rangeName}]`
          } else if (attr.val > 0 && attr.val < 1) {
            const pct = Math.round(attr.val * 100)
            return `+${pct}% at [${rangeName}]`
          }
          return `+${attr.val} at [${rangeName}]`
        }
      }
    }
  }
  
  // If there's just a val, try to use stat name from ref if available
  if (attr.val != null && statName) {
    if (typeof attr.val === "number") {
      if (attr.val > 1) {
        // Multiplier: 1.4 -> +40%
        const pct = Math.round((attr.val - 1) * 100)
        return `${pct >= 0 ? "+" : ""}${pct}% ${statName}`
      } else if (attr.val > 0 && attr.val < 1) {
        // Direct percentage: 0.4 -> +40%
        const pct = Math.round(attr.val * 100)
        return `+${pct}% ${statName}`
      } else if (attr.val >= 1) {
        return `+${attr.val} ${statName}`
      } else if (attr.val < 0) {
        return `${attr.val} ${statName}`
      } else {
        return `+${attr.val} ${statName}`
      }
    }
    return `${attr.val} ${statName}`
  }

  // Handle attributes that represent states/abilities (ref without val)
  if (statName && attr.val == null) {
    // These are typically boolean states that are granted
    return `Grants ${statName}`
  }

  // If there's just a val without any target context, format it
  // (This is a fallback - ideally we should have target info)
  if (attr.val != null) {
    if (typeof attr.val === "number") {
      if (attr.val > 1) {
        // Multiplier: 1.4 -> +40%
        const pct = Math.round((attr.val - 1) * 100)
        return `${pct >= 0 ? "+" : ""}${pct}%`
      } else if (attr.val > 0 && attr.val < 1) {
        // Direct percentage: 0.4 -> +40%
        const pct = Math.round(attr.val * 100)
        return `+${pct}%`
      } else if (attr.val >= 1) {
        return `+${attr.val}`
      } else if (attr.val < 0) {
        return String(attr.val)
      } else {
        return `+${attr.val}`
      }
    }
    return String(attr.val)
  }
  
  // Check if there's a target2 with val2
  if (attr.val2 != null && attr.target2) {
    const targetName = resolveTargetName(attr.target2, lookups)
    if (targetName) {
      if (typeof attr.val2 === "number") {
        if (attr.val2 > 0 && attr.val2 < 1) {
          const pct = Math.round((attr.val2 - 1) * 100)
          return `${pct >= 0 ? "+" : ""}${pct}% ${targetName}`
        } else if (attr.val2 >= 1) {
          return `+${attr.val2} ${targetName}`
        }
      }
    }
  }
  
  return null
}

/**
 * Resolve ::target_effects_list:: / ::target_effects_list2:: in a desc,
 * returning { desc, target_effects_list } for structured rendering.
 * If no list placeholder, returns just the resolved string.
 * If desc is empty, tries to generate one from trait references or data.
 */
export function resolveAttribute(attr, lookups) {
  let desc = attr?.desc || ""
  
  // If desc is empty/null but we have data, try to generate a description
  if (!desc || desc.trim() === "") {
    const generated = generateDescFromData(attr, lookups)
    if (generated) {
      desc = generated
    } else {
      // Still empty after generation attempt - skip this attribute
      return null
    }
  }

  if (desc.includes("::target_effects_list::")) {
    const traitId = attr.target?.trait
    let list = []
    if (traitId) {
      list = getTraitEffectDescs(traitId, lookups, attr)
      // If list is empty but trait exists, try to get at least something
      if (list.length === 0) {
        const trait = lookups.traits.get(traitId)
        if (trait && trait.attributes && trait.attributes.length > 0) {
          // Try to generate descriptions even if they don't have desc fields
          for (const a of trait.attributes) {
            const generated = generateDescFromData(a, lookups, false)
            if (generated && generated.trim() && generated !== "?") {
              list.push(generated)
            }
          }
        }
      }
    }
    const resolvedDesc = resolveDesc(desc.replace(/::target_effects_list::/g, "").trim(), attr, lookups)
    return { desc: resolvedDesc, target_effects_list: list }
  }

  if (desc.includes("::target_effects_list2::")) {
    const traitId = attr.target2?.trait
    let list = []
    if (traitId) {
      list = getTraitEffectDescs(traitId, lookups, attr)
      // If list is empty but trait exists, try to get at least something
      if (list.length === 0) {
        const trait = lookups.traits.get(traitId)
        if (trait && trait.attributes && trait.attributes.length > 0) {
          // Try to generate descriptions even if they don't have desc fields
          for (const a of trait.attributes) {
            const generated = generateDescFromData(a, lookups, false)
            if (generated && generated.trim() && generated !== "?") {
              list.push(generated)
            }
          }
        }
      }
    }
    const resolvedDesc = resolveDesc(desc.replace(/::target_effects_list2::/g, "").trim(), attr, lookups)
    return { desc: resolvedDesc, target_effects_list: list }
  }

  return resolveDesc(desc, attr, lookups)
}
