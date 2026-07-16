import type { AdminRole } from "@/types/domain";

export type AdminAccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "missing-env" | "unauthenticated" | "unknown-user" | "insufficient-role";
    };

export type UserAccessDecision =
  | { allowed: true }
  | {
      allowed: false;
      reason: "missing-env" | "unauthenticated" | "unknown-user";
    };

export function hasElevatedAdminRole(role: AdminRole | null | undefined) {
  return role === "editor" || role === "admin" || role === "owner";
}

export function evaluateAdminAccess(input: {
  hasServerEnv: boolean;
  hasUser: boolean;
  hasProfile: boolean;
  role: AdminRole | null | undefined;
}): AdminAccessDecision {
  if (!input.hasServerEnv) {
    return { allowed: false, reason: "missing-env" };
  }

  if (!input.hasUser) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (!input.hasProfile) {
    return { allowed: false, reason: "unknown-user" };
  }

  if (!hasElevatedAdminRole(input.role)) {
    return { allowed: false, reason: "insufficient-role" };
  }

  return { allowed: true };
}

export function evaluateUserAccess(input: {
  hasServerEnv: boolean;
  hasUser: boolean;
  hasProfile: boolean;
}): UserAccessDecision {
  if (!input.hasServerEnv) {
    return { allowed: false, reason: "missing-env" };
  }

  if (!input.hasUser) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (!input.hasProfile) {
    return { allowed: false, reason: "unknown-user" };
  }

  return { allowed: true };
}
