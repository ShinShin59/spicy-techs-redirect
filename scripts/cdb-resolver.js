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
 */
export function getTraitEffectDescs(traitId, lookups, attr) {
  const trait = lookups.traits.get(traitId)
  if (!trait) return []
  const descs = []
  for (const a of trait.attributes || []) {
    if (a.desc) {
      descs.push(resolveDesc(a.desc, a, lookups))
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

  return result
}

/**
 * Resolve ::target_effects_list:: / ::target_effects_list2:: in a desc,
 * returning { desc, target_effects_list } for structured rendering.
 * If no list placeholder, returns just the resolved string.
 */
export function resolveAttribute(attr, lookups) {
  const desc = attr?.desc || ""

  if (desc.includes("::target_effects_list::")) {
    const traitId = attr.target?.trait
    const list = traitId ? getTraitEffectDescs(traitId, lookups, attr) : []
    const resolvedDesc = resolveDesc(desc.replace(/::target_effects_list::/g, "").trim(), attr, lookups)
    return { desc: resolvedDesc, target_effects_list: list }
  }

  if (desc.includes("::target_effects_list2::")) {
    const traitId = attr.target2?.trait
    const list = traitId ? getTraitEffectDescs(traitId, lookups, attr) : []
    const resolvedDesc = resolveDesc(desc.replace(/::target_effects_list2::/g, "").trim(), attr, lookups)
    return { desc: resolvedDesc, target_effects_list: list }
  }

  return resolveDesc(desc, attr, lookups)
}
