"use client";

import { createContext, useContext } from "react";

export type ShellUser = {
  id: string;
  email: string;
  fullName: string | null;
  professionalTitle: string | null;
  avatarUrl: string | null;
  timezone: string;
};

const UserContext = createContext<ShellUser | null>(null);

export function UserProvider({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  return <UserContext value={user}>{children}</UserContext>;
}

export function useShellUser(): ShellUser {
  const user = useContext(UserContext);
  if (!user) throw new Error("useShellUser must be used inside <AppShell>");
  return user;
}

export function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "N";
}
