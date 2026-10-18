// Plans agent: saved plans live here, with their own storage, not in the planner store (lib/store).
// The planner store's draft keys start with "goatplan:draft:"; keep plans under their own prefix.

export const PLANS_STORAGE_PREFIX = "goatplan:plans:";
