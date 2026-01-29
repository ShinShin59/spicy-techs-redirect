import { FACTION_LABELS, useMainStore, type FactionLabel } from "@/store"

const FactionSelector = () => {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const setSelectedFaction = useMainStore((s) => s.setSelectedFaction)


  return (
    <label className="flex items-center gap-2">
      <span className="text-sm font-medium">Faction</span>
      <select
        value={selectedFaction}
        onChange={(e) => setSelectedFaction(e.target.value as FactionLabel)}
        className="bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-2 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {FACTION_LABELS.map((label) => (
          <option key={label as FactionLabel} value={label as FactionLabel}>
            {label as FactionLabel}
          </option>
        ))}
      </select>
    </label>
  )
}

export default FactionSelector