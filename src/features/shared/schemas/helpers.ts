import { z } from "zod";
import { httpUrlSchema } from "@/features/shared/schemas/http-url";

export const uuidSchema = z.string().uuid();
export const isoDatetimeSchema = z.string().datetime();
export { httpUrlSchema };
export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only.");

export function nullableTrimmedString(max: number) {
  return z.string().trim().max(max).nullable().optional();
}

export function partialUpdateSchema<T extends z.ZodRawShape>(
  shape: T,
  message = "Provide at least one field to update.",
) {
  return z
    .object(shape)
    .partial()
    .refine((value) => Object.values(value).some((entry) => entry !== undefined), {
      message,
    });
}
