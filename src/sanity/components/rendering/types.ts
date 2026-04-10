// Backward-compat re-export shim.
// Shared rendering types now live at src/lib/rendering/types.ts (moved in Phase 33 Plan 01
// so admin tool islands can import without reaching into the Studio tree).
// All existing Studio imports continue to work unchanged.
export * from "../../../lib/rendering/types";
