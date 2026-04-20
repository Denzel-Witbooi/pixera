import type { BackendType, DataAdapter } from "./types";
import { LocalAdapter } from "./local";
import { DotNetAdapter } from "./dotnet";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export function createAdapter(backend: BackendType): DataAdapter {
  return backend === "local" ? new LocalAdapter() : new DotNetAdapter(API_URL);
}

export type { DataAdapter, BackendType };
export { queryKeys } from "./types";
