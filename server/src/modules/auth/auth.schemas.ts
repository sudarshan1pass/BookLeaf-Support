import { z } from "zod";

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
    message: "Password must be no more than 72 UTF-8 bytes.",
  });

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().max(320),
  password: passwordSchema,
  role: z.enum(["USER", "AUTHOR"]).default("USER"),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(320),
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
