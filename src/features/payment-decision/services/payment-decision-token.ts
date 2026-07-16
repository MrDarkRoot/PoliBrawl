import crypto from "node:crypto";

const tokenPattern = /^[A-Za-z0-9_-]{43,160}$/;

export function createReportToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function isValidReportToken(value: string) {
  return tokenPattern.test(value);
}
