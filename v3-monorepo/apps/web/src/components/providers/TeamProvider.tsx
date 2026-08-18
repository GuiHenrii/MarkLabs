"use client";

import { createContext, useContext, ReactNode } from "react";

interface TeamContextData {
  teamId: string;
}

const TeamContext = createContext<TeamContextData | undefined>(undefined);

export function TeamProvider({
  children,
  teamId,
}: {
  children: ReactNode;
  teamId: string;
}) {
  return (
    <TeamContext.Provider value={{ teamId }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
