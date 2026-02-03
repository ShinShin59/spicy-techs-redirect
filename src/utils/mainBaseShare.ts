import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string"
import type {
  FactionLabel,
  BuildingCoords,
  PanelVisibility,
  DevelopmentsSummary,
  BuildMetadata,
} from "../store"
import type { MainBaseState } from "../store/main-base"

export const BUILD_PARAM = "build"

/** Full current-build payload: selected faction + panel visibility, developments, metadata. */
export interface SharedBuildPayload {
  f: FactionLabel
  state: MainBaseState
  order: BuildingCoords[]
  armory: (string | null)[][]
  units: (string | null)[]
  councillors: (string | null)[]
  operations: (string | null)[]
  unitSlotCount: number
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  selectedDevelopments: string[]
  metadata: BuildMetadata
}

export function encodeBuildPayload(payload: SharedBuildPayload): string {
  const json = JSON.stringify(payload)
  return compressToEncodedURIComponent(json)
}

export function decodeBuildPayload(search: string): SharedBuildPayload | null {
  try {
    const params = new URLSearchParams(search)
    const raw = params.get(BUILD_PARAM)
    if (!raw) return null
    const json = decompressFromEncodedURIComponent(raw)
    if (!json) return null
    return JSON.parse(json) as SharedBuildPayload
  } catch {
    return null
  }
}

export function getShareUrl(encoded: string): string {
  const base = typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""
  return `${base}?${BUILD_PARAM}=${encoded}`
}
