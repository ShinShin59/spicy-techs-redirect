import { useState, useRef, useEffect } from "react"
import { useMainStore } from "@/store"
import { encodeBuildPayload, getShareUrl } from "@/utils/mainBaseShare"

export function useShareButton() {
  const selectedFaction = useMainStore((s) => s.selectedFaction)
  const mainBaseState = useMainStore((s) => s.mainBaseState)
  const buildingOrder = useMainStore((s) => s.buildingOrder)
  const armoryState = useMainStore((s) => s.armoryState)
  const unitSlotCount = useMainStore((s) => s.unitSlotCount)
  const unitSlots = useMainStore((s) => s.unitSlots)
  const councillorSlots = useMainStore((s) => s.councillorSlots)
  const operationSlots = useMainStore((s) => s.operationSlots)
  const panelVisibility = useMainStore((s) => s.panelVisibility)
  const developmentsSummary = useMainStore((s) => s.developmentsSummary)
  const selectedDevelopments = useMainStore((s) => s.selectedDevelopments)
  const metadata = useMainStore((s) => s.metadata)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    }
  }, [])

  const handleShare = () => {
    const payload = {
      f: selectedFaction,
      state: mainBaseState[selectedFaction],
      order: buildingOrder[selectedFaction] ?? [],
      armory: armoryState[selectedFaction],
      units: unitSlots[selectedFaction],
      councillors: councillorSlots[selectedFaction],
      operations: operationSlots[selectedFaction],
      unitSlotCount,
      panelVisibility,
      developmentsSummary,
      selectedDevelopments,
      metadata,
    }
    const encoded = encodeBuildPayload(payload)
    const url = getShareUrl(encoded)
    void navigator.clipboard.writeText(url).catch(() => { })
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
    setCopied(true)
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false)
      copyTimeoutRef.current = null
    }, 800)
  }

  return { copied, handleShare }
}
