export type ScopeValue = "local" | "international";

interface ResolveScopeInput {
  scopeParam?: string | null;
  country?: string | null;
  localDestination?: string | null;
}

/**
 * Normalize the requested scope so UI and data fetching stay in sync.
 * - Explicit scope param wins
 * - Country implies international
 * - Local destination implies local
 * - Default to local
 */
export function resolveScope({
  scopeParam,
  country,
  localDestination,
}: ResolveScopeInput): ScopeValue {
  if (scopeParam === "international") return "international";
  if (scopeParam === "local") return "local";
  if (country) return "international";
  if (localDestination) return "local";
  return "local";
}
