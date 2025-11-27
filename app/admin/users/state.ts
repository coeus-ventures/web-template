import { atom } from "jotai";

// User type from Better Auth
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  image: string | null;
  pending?: boolean; // For optimistic updates
}

// Session type from Better Auth
export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  impersonatedBy: string | null;
}

// Users list state
export const usersAtom = atom<User[]>([]);
export const usersLoadingAtom = atom(false);
export const usersTotalAtom = atom(0);

// Pagination state
export const usersPageAtom = atom(1);
export const usersLimitAtom = atom(10);

// Filter/Search state
export const usersSearchAtom = atom("");
export const usersRoleFilterAtom = atom<string | undefined>(undefined);

// Sort state
export const usersSortByAtom = atom<string | undefined>(undefined);
export const usersSortDirectionAtom = atom<"asc" | "desc">("asc");

// Impersonation state
export const isImpersonatingAtom = atom(false);
export const impersonatedUserAtom = atom<User | null>(null);

// Selected sessions (for session management dialog)
export const selectedUserSessionsAtom = atom<Session[]>([]);
export const sessionsLoadingAtom = atom(false);
