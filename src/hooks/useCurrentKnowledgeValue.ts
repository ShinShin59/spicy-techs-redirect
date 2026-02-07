import { useMainStore } from "@/store"
import { computeCurrentKnowledgeValue, type DevWithTierAndDomain } from "@/utils/knowledge"
import developmentsData from "@/components/Developments/developments.json"

const idToDev = new Map<string, DevWithTierAndDomain>(
  (developmentsData as { id: string; tier: number; domain: "economic" | "military" | "statecraft" | "expansion" }[]).map(
    (d) => [d.id, d]
  )
)

/**
 * Single source of truth for the current knowledge/day value.
 * Reactive to: selectedDevelopments, developmentsKnowledge, mainBaseState, buildingDates, knowledgeBase, selectedFaction.
 */
export function useCurrentKnowledgeValue(): number {
  return useMainStore((s) => {
    const ctx = {
      selectedFaction: s.selectedFaction,
      mainBaseState: s.mainBaseState,
      selectedDevelopments: s.selectedDevelopments,
      developmentsKnowledge: s.developmentsKnowledge,
      knowledgeBase: s.knowledgeBase,
      buildingDates: s.buildingDates,
    }
    return computeCurrentKnowledgeValue(ctx, idToDev)
  })
}
