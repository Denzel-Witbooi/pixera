import type { BackendType, DataAdapter } from "./types";
import { LocalAdapter } from "./local";
import { SupabaseAdapter } from "./supabase";

export function createAdapter(backend: BackendType): DataAdapter {
  return backend === "local" ? new LocalAdapter() : new SupabaseAdapter();
}

export type { DataAdapter, BackendType };
export { queryKeys } from "./types";
