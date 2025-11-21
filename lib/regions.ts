// lib/regions.ts
// Shared list of South African provinces/regions used across the app

export const SOUTH_AFRICAN_PROVINCES = [
  "Western Cape",
  "Eastern Cape",
  "Northern Cape",
  "Free State",
  "KwaZulu-Natal",
  "Gauteng",
  "Limpopo",
  "Mpumalanga",
  "North West",
] as const;

export type SouthAfricanProvince = typeof SOUTH_AFRICAN_PROVINCES[number];
