# Guide: Fixing Tooltip Extraction and Data Resolution

This guide explains how to fix missing descriptions, unresolved placeholders, and incomplete data extraction for game data files (armory.json, operations.json, developments.json, etc.).

## Overview

The extraction scripts (`build-armory.js`, `build-operations.js`, `build-developments.js`) read data from `res/assets/data.cdb` and resolve placeholders using `cdb-resolver.js`. Common issues:

1. **Missing descriptions** - Attributes with empty `desc` fields are skipped
2. **Unresolved placeholders** - Patterns like `::s_percent::`, `::target_effects::` remain in output
3. **Missing labels** - Values like `"+40%"` without context (e.g., "attack speed")
4. **Empty arrays** - `target_effects_list` arrays that should be populated

## Key Files

- **`scripts/cdb-resolver.js`** - Core resolution logic for placeholders and data generation
- **`scripts/build-*.js`** - Extraction scripts for each data type
- **`res/assets/data.cdb`** - Source data (JSON format)
- **`src/components/*/`** - Output JSON files

## Common Issues and Fixes

### Issue 1: Missing Descriptions (Empty Attributes)

**Symptoms:** Many items show "No description available" in tooltips

**Root Cause:** Script skips attributes without `desc` field before calling `resolveAttribute()`

**Fix:**
```javascript
// BEFORE (in build-*.js):
for (const attr of trait.attributes || []) {
  if (!attr.desc) continue  // ❌ This skips attributes that can be generated from data
  const resolved = resolveAttribute(attr, lookups)
  // ...
}

// AFTER:
for (const attr of trait.attributes || []) {
  // ✅ Don't skip - resolveAttribute can generate descriptions from val/target data
  const resolved = resolveAttribute(attr, lookups)
  if (resolved) {
    // ...
  }
}
```

### Issue 2: Unresolved Placeholders

**Symptoms:** Attributes contain patterns like `::s_percent::`, `::target_effects::`, `::s_value::`

**Root Cause:** Placeholders aren't being caught by resolution logic

**Fix in `cdb-resolver.js`:**
```javascript
// Add final cleanup pass in resolveDesc():
// 14. Final cleanup: Remove any remaining ::placeholder:: patterns
result = result.replace(/::[^:]+::/g, "?")

// 15. Clean up question marks
result = result.replace(/\?\s*\?/g, "?")
result = result.replace(/\s+\?/g, "?")
result = result.replace(/\?\s+/g, "?")
```

### Issue 3: Missing Labels (Values Without Context)

**Symptoms:** Attributes show `"+40%"` instead of `"+40% attack speed"`

**Root Cause:** When `target` object is empty `{}` but `ref` field contains stat name, we're not extracting it

**Fix in `cdb-resolver.js`:**
```javascript
// Add function to extract stat names from ref field:
function extractStatNameFromRef(ref) {
  if (!ref || typeof ref !== "string") return null
  
  let cleaned = ref
    .replace(/^(Unit_|Entity_|Army_)/, "")
    .replace(/_ARatio$/, "")
    .replace(/_MRatio$/, "")
    .replace(/_Flat$/, "")
    .replace(/_Bonus$/, "")
  
  // Common mappings
  const statMappings = {
    "AttackRange": "attack range",
    "AttackSpeed": "attack speed",
    "Power": "Power",
    "Life": "Life",
    "Armor": "Armor",
    // ... add more as needed
  }
  
  return statMappings[cleaned] || prettifyId(cleaned).toLowerCase()
}

// In generateDescFromData():
let statName = null
if (attr.ref) {
  statName = extractStatNameFromRef(attr.ref)
}

// Use statName when target doesn't resolve:
if ((!targetName || targetName.trim() === "") && statName) {
  targetName = statName
}

// Also handle case where only val exists:
if (attr.val != null && statName) {
  // Format with stat name
  return `+${pct}% ${statName}`
}
```

### Issue 4: Empty target_effects_list Arrays

**Symptoms:** Complex attributes have empty `target_effects_list: []` when they should have items

**Root Cause:** `getTraitEffectDescs()` returns empty array when trait attributes don't have `desc` fields

**Fix in `cdb-resolver.js`:**
```javascript
// In resolveAttribute(), improve fallback:
if (desc.includes("::target_effects_list::")) {
  const traitId = attr.target?.trait
  let list = []
  if (traitId) {
    list = getTraitEffectDescs(traitId, lookups, attr)
    // If empty but trait exists, try generating from attribute data
    if (list.length === 0) {
      const trait = lookups.traits.get(traitId)
      if (trait && trait.attributes && trait.attributes.length > 0) {
        for (const a of trait.attributes) {
          const generated = generateDescFromData(a, lookups, false)
          if (generated && generated.trim() && generated !== "?") {
            list.push(generated)
          }
        }
      }
    }
  }
  // ...
}
```

## Step-by-Step Process

### 1. Identify the Problem

Run the extraction script and check:
- Console warnings about unresolved placeholders
- Generated log file (e.g., `armory-extraction-log.txt`)
- Output JSON for patterns like `::placeholder::` or empty arrays

```bash
node scripts/build-operations.js
```

### 2. Add Logging

Add tracking for issues in the build script:
```javascript
const unresolvedPlaceholders = []
const emptyTargetEffectsLists = []
const attributesWithoutLabels = []

// Track issues during extraction
// Log them at the end
```

### 3. Fix Resolution Logic

Update `cdb-resolver.js`:
- Add cleanup passes for remaining placeholders
- Improve `generateDescFromData()` to extract labels from `ref` field
- Enhance `getTraitEffectDescs()` to handle missing desc fields

### 4. Test and Verify

```bash
# Generate new file (don't overwrite existing)
# Change output path in build script temporarily
const outJson = join(ROOT, "src/components/Operations/operations-new.json")

# Run script
node scripts/build-operations.js

# Compare results
diff src/components/Operations/operations.json src/components/Operations/operations-new.json

# Check for remaining issues
grep -r "::" src/components/Operations/operations-new.json
grep -r '"attributes": \[]' src/components/Operations/operations-new.json
```

### 5. Handle Manual Fixes

Some items may need manual fixes (e.g., missing from CDB, ID mismatches):
- Check `units.json` or equivalent for expected IDs
- Verify image files exist
- Add manual entries if needed

### 6. Replace Production File

Once verified:
```bash
cp src/components/Operations/operations-new.json src/components/Operations/operations.json
```

## Key Patterns to Look For

### In CDB Data Structure:
```json
{
  "id": "EquipmentId",
  "name": "Display Name",
  "traits": [{"ref": "TraitId"}],
  "attributes": [
    {
      "desc": "Description with ::placeholders::",
      "val": 0.4,
      "target": {"resource": "AttackSpeed"},
      "ref": "Unit_AttackSpeed_ARatio"
    }
  ]
}
```

### Common Ref Patterns:
- `Unit_AttackSpeed_ARatio` → "attack speed"
- `Unit_AttackRange_ARatio` → "attack range"
- `Entity_Power_ARatio` → "Power"
- `Entity_Life_ARatio` → "Life"
- `Entity_Armor_Flat` → "Armor"

### Placeholder Types:
- `::s_percent::` - Signed percentage (from multiplier: 1.4 → +40%)
- `::s_percent_value::` - Direct signed percentage (0.4 → +40%)
- `::s_value::` - Signed value (+10, -5)
- `::target_effects::` - Inline trait effects
- `::target_effects_list::` - List of trait effects
- `::target_stacking_limit::` - Stacking limit from trait props
- `::target_duration::` - Duration from trait props

## Debugging Tips

1. **Check the log file** - It shows which items have issues
2. **Inspect CDB data** - Use `grep` to find specific equipment/traits:
   ```bash
   grep -A 20 '"id": "OperationId"' res/assets/data.cdb
   ```
3. **Test resolution manually** - Add console.logs in `resolveAttribute()` to see what's happening
4. **Compare with working examples** - Look at items that work correctly to understand the pattern

## Example: Fixing Operations

1. Run `node scripts/build-operations.js`
2. Check `operations-extraction-log.txt` for issues
3. Update `cdb-resolver.js` with fixes (same patterns as armory)
4. Update `build-operations.js` to not skip attributes without desc
5. Regenerate and verify
6. Replace production file

## Notes

- Always generate to a `-new.json` file first for comparison
- Keep the extraction log to track what was fixed
- Some items may legitimately have no data (log them for review)
- Manual fixes may be needed for edge cases or missing CDB entries
