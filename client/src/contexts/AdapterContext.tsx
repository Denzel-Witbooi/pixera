import React, { createContext, useContext } from "react";
import type { DataAdapter } from "@/lib/adapter";

const AdapterContext = createContext<DataAdapter | null>(null);

export const AdapterProvider: React.FC<{
  adapter: DataAdapter;
  children: React.ReactNode;
}> = ({ adapter, children }) => (
  <AdapterContext.Provider value={adapter}>{children}</AdapterContext.Provider>
);

export const useAdapter = (): DataAdapter => {
  const adapter = useContext(AdapterContext);
  if (!adapter) throw new Error("useAdapter must be used within AdapterProvider");
  return adapter;
};
