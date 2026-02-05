#!/usr/bin/env node
/**
 * Build developments.json from data.cdb.
 * Run: node scripts/build-developments.js
 *
 * Icons use sprite sheets (techIcons2.png) - gfx gives { file, size, x, y } for
 * background-position: -(x*size)px -(y*size)px at runtime.
 */

import { readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { buildLookups, resolveAttribute } from "./cdb-resolver.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

/** CDB domain -> app DevelopmentsSummary key */
const DOMAIN_TO_KEY = {
  Economy: "economic",
  Military: "military",
  Statecraft: "statecraft",
  Expansion: "green",
}

/** CDB faction name -> app FactionLabel */
const FACTION_TO_LABEL = {
  Harkonnen: "harkonnen",
  Atreides: "atreides",
  Ecaz: "ecaz",
  Smugglers: "smuggler",
  Vernius: "vernius",
  Fremen: "fremen",
  Corrino: "corrino",
}

/** Correct grid positions for developments (overrides CDB values) */
const CORRECT_GRID_POSITIONS = {
  CompositeMaterials: { gridX: 1, gridY: 0 },
  AdvancedEngineering: { gridX: 2, gridY: 1 },
  ModularParts: { gridX: 0, gridY: 1 },
  EnergyMarkets: { gridX: 2, gridY: 2 },
  AraakisRiches: { gridX: 3, gridY: 2 },
  EconomicLobbying: { gridX: 1, gridY: 2 },
  GridexPlane: { gridX: 0, gridY: 2 },
  StructuredWarehouses: { gridX: 1, gridY: 3 },
  VeteranCrews: { gridX: 0, gridY: 3 },
  LocalDialectStudies: { gridX: 1, gridY: 0 },
  LayoftheLand: { gridX: 0, gridY: 1 },
  LocalHubs: { gridX: 1, gridY: 1 },
  Paracompass: { gridX: 2, gridY: 1 },
  WaterSellersContacts: { gridX: 3, gridY: 2 },
  OutpostLogistics: { gridX: 2, gridY: 2 },
  SpectralImaging: { gridX: 1, gridY: 2 },
  BorderDefense: { gridX: 1, gridY: 3 },
  WaterTrade: { gridX: 3, gridY: 3 },
  SurvivalTraining: { gridX: 1, gridY: 0 },
  DefenseSystems: { gridX: 1, gridY: 1 },
  ArmyLogistics: { gridX: 0, gridY: 1 },
  CalltoArms: { gridX: 2, gridY: 1 },
  MilitaryThreat: { gridX: 1, gridY: 2 },
  GroundCommand: { gridX: 2, gridY: 2 },
  SupportStructures: { gridX: 3, gridY: 3 },
  AirCommand: { gridX: 1, gridY: 3 },
  HighCommand: { gridX: 2, gridY: 3 },
  IntelligenceNetwork: { gridX: 1, gridY: 0 },
  DiplomaticManoeuvers: { gridX: 1, gridY: 1 },
  SpyingLogistic: { gridX: 2, gridY: 1 },
  CounterMeasures: { gridX: 0, gridY: 2 },
  PoliticalStrength: { gridX: 1, gridY: 2 },
  NegotiationTactics: { gridX: 3, gridY: 2 },
  StealthGear: { gridX: 2, gridY: 2 },
  SandDiplomacy: { gridX: 1, gridY: 3 },
  SpyingMastery: { gridX: 2, gridY: 3 },
  AtreidesMerchants: { gridX: 1, gridY: 0 },
  UrbanPlanning: { gridX: 2, gridY: 1 },
  AtreidesForemen: { gridX: 0, gridY: 3 },
  UnderstandTheBeauty: { gridX: 1, gridY: 1 },
  EmbraceCulture: { gridX: 2, gridY: 2 },
  VeteranMilitia: { gridX: 1, gridY: 2 },
  NewHomeland: { gridX: 2, gridY: 1 },
  AtreidesOfficers: { gridX: 3, gridY: 3 },
  AtreidesSympathizers: { gridX: 1, gridY: 0 },
  AtreidesDelegations: { gridX: 0, gridY: 2 },
  ActiveSurveillance: { gridX: 3, gridY: 2 },
  SustainableSpying: { gridX: 2, gridY: 2 },
  HarkonnenNegociation: { gridX: 1, gridY: 0 },
  MartialEconomy: { gridX: 3, gridY: 2 },
  InstillFear: { gridX: 2, gridY: 1 },
  MonitoringNetworks: { gridX: 3, gridY: 2 },
  SymbolsOfAuthority: { gridX: 3, gridY: 3 },
  BloodCommand: { gridX: 2, gridY: 3 },
  AssemblyLines: { gridX: 1, gridY: 3 },
  AraakisButchers: { gridX: 0, gridY: 1 },
  CruelReputation: { gridX: 1, gridY: 1 },
  LandsraadWhispers: { gridX: 1, gridY: 2 },
  HarkonnenLegacy: { gridX: 2, gridY: 2 },
  TinkererTeams: { gridX: 0, gridY: 1 },
  UnderworldContacts: { gridX: 0, gridY: 3 },
  CriminalPast: { gridX: 1, gridY: 0 },
  UndergroundNetwork: { gridX: 1, gridY: 1 },
  AegisoftheUnderworld: { gridX: 2, gridY: 2 },
  OrganizedLooting: { gridX: 1, gridY: 1 },
  GuerrillaTactics: { gridX: 0, gridY: 1 },
  IndustrialScavenging: { gridX: 1, gridY: 2 },
  MilitaryAdministration: { gridX: 2, gridY: 3 },
  UnderworldBosses: { gridX: 1, gridY: 0 },
  SecurityDetails: { gridX: 0, gridY: 2 },
  UnderworldBribes: { gridX: 1, gridY: 2 },
  SpreadingTheFaith: { gridX: 2, gridY: 1 },
  ArrakisSecrets: { gridX: 0, gridY: 1 },
  SpiceMarket: { gridX: 1, gridY: 2 },
  FremenCommand: { gridX: 2, gridY: 2 },
  DuneWanderers: { gridX: 0, gridY: 1 },
  SpiceHegemony: { gridX: 1, gridY: 1 },
  AdvancedThumpers: { gridX: 1, gridY: 2 },
  SkyGazing: { gridX: 0, gridY: 1 },
  DesertTrekkers: { gridX: 1, gridY: 1 },
  StalwartAlliance: { gridX: 1, gridY: 2 },
  TruePeople: { gridX: 1, gridY: 3 },
  DesertShadows: { gridX: 1, gridY: 0 },
  SandDiplomats: { gridX: 1, gridY: 1 },
  SietchNetwork: { gridX: 0, gridY: 2 },
  SolidMaterials: { gridX: 1, gridY: 0 },
  ImperialTaxes: { gridX: 1, gridY: 2 },
  CHOAMManipulation: { gridX: 1, gridY: 3 },
  Megalopolis: { gridX: 1, gridY: 0 },
  ImperialResearchers: { gridX: 0, gridY: 1 },
  ImperialAdministration: { gridX: 1, gridY: 1 },
  AdministrativeConsolidation: { gridX: 2, gridY: 1 },
  ImperialCommand: { gridX: 0, gridY: 1 },
  ImperialThreat: { gridX: 2, gridY: 3 },
  AbsolutePower: { gridX: 1, gridY: 0 },
  DiplomaticSpying: { gridX: 1, gridY: 1 },
  EmperorEyes: { gridX: 0, gridY: 2 },
  ArtisticAspirations: { gridX: 2, gridY: 1 },
  CulturalTourism: { gridX: 2, gridY: 2 },
  ManicheanPropaganda: { gridX: 1, gridY: 1 },
  NativeArtists: { gridX: 2, gridY: 1 },
  PridefulCrown: { gridX: 1, gridY: 2 },
  NationalMythos: { gridX: 1, gridY: 1 },
  MartialPerfectionism: { gridX: 2, gridY: 1 },
  InspiringStandart: { gridX: 1, gridY: 2 },
  LogisticalFlourish: { gridX: 2, gridY: 2 },
  CosmopoliteElegance: { gridX: 3, gridY: 2 },
  PoliticalArt: { gridX: 1, gridY: 3 },
  InfluentialPlots: { gridX: 2, gridY: 3 },
  EntropicEngineering: { gridX: 0, gridY: 1 },
  SpiceEnlightenment: { gridX: 0, gridY: 3 },
  SequentialThinking: { gridX: 1, gridY: 0 },
  NeuralTropism: { gridX: 2, gridY: 1 },
  AutomatedDefenses: { gridX: 1, gridY: 3 },
  WaterBatteries: { gridX: 0, gridY: 1 },
  GuildCollaboration: { gridX: 2, gridY: 1 },
  AutomatedManufacture: { gridX: 2, gridY: 3 },
  TechnologicalExchange: { gridX: 1, gridY: 0 },
  HereticalComputing: { gridX: 2, gridY: 1 },
  HolisticThinking: { gridX: 3, gridY: 2 },
  PhysicalWiring: { gridX: 2, gridY: 3 },
}

function main() {
  const cdbPath = join(ROOT, "res/assets/data.cdb")
  const outJson = join(ROOT, "src/components/Developments/developments.json")

  const cdb = JSON.parse(readFileSync(cdbPath, "utf-8"))
  const lookups = buildLookups(cdb)

  const devSheet = (cdb.sheets || []).find((s) => s.name === "development")
  if (!devSheet) throw new Error("Missing development sheet in CDB")

  const entries = []

  for (const d of devSheet.lines || []) {
    const id = d.id
    if (!id) continue

    const name = d.name ?? d.texts?.name ?? id
    const desc = d.desc ?? d.texts?.desc ?? ""
    const domain = d.domain ?? "Economy"
    const tier = d.tier ?? 0
    const gridX = d.gridX ?? 0
    const gridY = d.gridY ?? 0
    const requires = d.requires ?? null
    const replaces = d.replaces ?? null
    const faction = d.faction ? FACTION_TO_LABEL[d.faction] ?? d.faction : null

    const gfx = d.gfx
      ? {
        file: (d.gfx.file || "").replace(/\.png$/i, ".webp"),
        size: d.gfx.size,
        x: d.gfx.x,
        y: d.gfx.y,
      }
      : undefined

    const attributes = (d.attributes || [])
      .map((a) => resolveAttribute(a, lookups))
      .filter((a) => {
        // Filter out empty strings and objects with empty desc
        if (typeof a === "string") return a.length > 0
        if (typeof a === "object" && a !== null) return a.desc && a.desc.length > 0
        return false
      })

    entries.push({
      id,
      name,
      desc,
      domain: DOMAIN_TO_KEY[domain] ?? domain.toLowerCase(),
      tier,
      gridX,
      gridY,
      requires,
      replaces,
      faction: faction ?? undefined,
      gfx,
      attributes: attributes.length ? attributes : undefined,
    })
  }

  // Apply correct grid positions (overrides CDB values)
  let correctedCount = 0
  for (const entry of entries) {
    if (CORRECT_GRID_POSITIONS[entry.id]) {
      const correct = CORRECT_GRID_POSITIONS[entry.id]
      if (entry.gridX !== correct.gridX || entry.gridY !== correct.gridY) {
        entry.gridX = correct.gridX
        entry.gridY = correct.gridY
        correctedCount++
      }
    }
  }
  if (correctedCount > 0) {
    console.log(`Applied correct grid positions to ${correctedCount} developments`)
  }

  writeFileSync(outJson, JSON.stringify(entries, null, 2), "utf-8")
  console.log(`Written ${entries.length} developments to ${outJson}`)
}

main()
