export const PIPELINE_STAGES = [
  { key: "kontakt", label: "Kontakt", color: "#50645F" },
  { key: "behovsanalys", label: "Behovsanalys", color: "#5A7080" },
  { key: "offert", label: "Offert", color: "#C4883A" },
  { key: "forhandling", label: "Förhandling", color: "#6A7F7A" },
  { key: "avslutad_affar", label: "Avslutad (affär)", color: "#2A3835" },
  { key: "avslutad_ingen_affar", label: "Avslutad (ingen affär)", color: "#8B3D3D" },
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number]["key"];

export const FACTORY_TYPES = [
  { key: "modulfabrik", label: "Modulfabrik" },
  { key: "vagg_tak_fabrik", label: "Vägg & takfabrik" },
] as const;

export type FactoryType = (typeof FACTORY_TYPES)[number]["key"];

export const CURRENCIES = ["SEK", "EUR", "NOK", "DKK"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const MACHINE_CATEGORIES = [
  { key: "Element Handling", label: "Element Handling" },
  { key: "Module Transport Solutions", label: "Module Transport Solutions" },
] as const;

export type MachineCategory = (typeof MACHINE_CATEGORIES)[number]["key"];

export const USER_ROLES = [
  { key: "admin", label: "Administratör" },
  { key: "salesperson", label: "Säljare" },
] as const;

export type UserRole = (typeof USER_ROLES)[number]["key"];
