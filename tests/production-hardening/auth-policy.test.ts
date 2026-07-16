import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateAdminAccess,
  evaluateUserAccess,
} from "../../src/lib/auth-policy";

test("admin access fails closed when auth env is missing", () => {
  const decision = evaluateAdminAccess({
    hasServerEnv: false,
    hasUser: true,
    hasProfile: true,
    role: "owner",
  });

  assert.deepEqual(decision, { allowed: false, reason: "missing-env" });
});

test("admin access rejects unauthenticated requests", () => {
  const decision = evaluateAdminAccess({
    hasServerEnv: true,
    hasUser: false,
    hasProfile: false,
    role: null,
  });

  assert.deepEqual(decision, { allowed: false, reason: "unauthenticated" });
});

test("admin access rejects viewer profiles", () => {
  const decision = evaluateAdminAccess({
    hasServerEnv: true,
    hasUser: true,
    hasProfile: true,
    role: "viewer",
  });

  assert.deepEqual(decision, { allowed: false, reason: "insufficient-role" });
});

test("admin access allows verified editorial roles", () => {
  const decision = evaluateAdminAccess({
    hasServerEnv: true,
    hasUser: true,
    hasProfile: true,
    role: "admin",
  });

  assert.deepEqual(decision, { allowed: true });
});

test("user dashboard access fails closed when auth env is missing", () => {
  const decision = evaluateUserAccess({
    hasServerEnv: false,
    hasUser: true,
    hasProfile: true,
  });

  assert.deepEqual(decision, { allowed: false, reason: "missing-env" });
});

test("user dashboard access rejects unauthenticated requests", () => {
  const decision = evaluateUserAccess({
    hasServerEnv: true,
    hasUser: false,
    hasProfile: false,
  });

  assert.deepEqual(decision, { allowed: false, reason: "unauthenticated" });
});

test("user dashboard access allows authenticated profiles", () => {
  const decision = evaluateUserAccess({
    hasServerEnv: true,
    hasUser: true,
    hasProfile: true,
  });

  assert.deepEqual(decision, { allowed: true });
});
