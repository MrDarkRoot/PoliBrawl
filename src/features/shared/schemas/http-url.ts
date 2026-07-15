import { z } from "zod";

const allowedProtocols = new Set(["http:", "https:"]);

export function isSafeHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return allowedProtocols.has(protocol);
  } catch {
    return false;
  }
}

export const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(isSafeHttpUrl, "Use an http or https URL.");

export const optionalHttpUrlSchema = httpUrlSchema.nullable().optional();
