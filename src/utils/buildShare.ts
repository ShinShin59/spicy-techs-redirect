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
  DevelopmentsKnowledge,
} from "../store"
import type { MainBaseState } from "../store/main-base"

export const BUILD_PARAM = "build"

/** Full current-build payload: selected faction + panel visibility, developments, metadata. */
export interface SharedBuildPayload {
  f: FactionLabel
  state: MainBaseState
  order: BuildingCoords[]
  /** Second main base (when faction has 2 bases); omitted for single-base or legacy. */
  state2?: MainBaseState
  order2?: BuildingCoords[]
  /** Which main base is selected (0 or 1) when state2/order2 are present. */
  mainBaseIndex?: 0 | 1
  armory: (string | null)[][]
  units: (string | null)[]
  councillors: (string | null)[]
  operations: (string | null)[]
  unitSlotCount: number
  panelVisibility: PanelVisibility
  developmentsSummary: DevelopmentsSummary
  selectedDevelopments: string[]
  metadata: BuildMetadata
  /** Optional per-development Knowledge/day mapping for this shared build. */
  developmentsKnowledge?: DevelopmentsKnowledge
  /** Optional global Knowledge/day (5–50) for development time tooltips. */
  knowledgeBase?: number
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

/**
 * Try to shorten a full share URL using the URLsmush public API.
 *
 * - On success: returns the short URL from the service.
 * - On any error / bad response / CORS issue: returns the original long URL.
 *
 * This is intentionally very defensive so sharing never breaks even if the
 * third-party service is unavailable or changes behavior.
 */
async function tryShortenUrl(longUrl: string): Promise<string> {
  if (typeof fetch === "undefined") return longUrl

  // Many public shorteners (including URLsmush) reject localhost / IP URLs.
  // In dev, that would just log noisy errors, so we skip shortening entirely.
  try {
    const url = new URL(longUrl)
    const host = url.hostname
    const isLocalHost =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      // Heuristic: no dot in hostname ⇒ likely dev
      !host.includes(".")

    if (isLocalHost) return longUrl
  } catch {
    // If URL parsing fails, just bail out to the original long URL.
    return longUrl
  }

  const endpoint = "https://urlsmush.com/api.php"

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: longUrl }),
    })

    if (!res.ok) return longUrl

    const data: unknown = await res.json()

    // Expected response shape:
    // {
    //   status: "success" | "error",
    //   message: string,
    //   data: {
    //     long_url: string
    //     short_code: string
    //     short_url: string
    //     message: string
    //     status: "success"
    //   } | null
    // }

    if (data && typeof data === "object" && "status" in data) {
      const root = data as {
        status?: unknown
        data?: unknown
      }

      if (root.status === "success" && root.data && typeof root.data === "object") {
        const inner = root.data as { short_url?: unknown }
        if (typeof inner.short_url === "string" && inner.short_url.length > 0) {
          return inner.short_url
        }
      }
    }

    return longUrl
  } catch {
    return longUrl
  }
}

/**
 * Generate the share URL and try to shorten it.
 *
 * Always returns a usable URL:
 * - Short URL when the shortener succeeds.
 * - Original long URL when anything fails.
 */
export async function getShareUrlPreferShort(encoded: string): Promise<string> {
  // Always shorten against the deployed GitHub Pages URL so that shared links
  // point to the live site even when generated from localhost.
  const prodBase = "https://shinshin59.github.io/spicy-techs/"
  const longUrl = `${prodBase}?${BUILD_PARAM}=${encoded}`
  return tryShortenUrl(longUrl)
}
