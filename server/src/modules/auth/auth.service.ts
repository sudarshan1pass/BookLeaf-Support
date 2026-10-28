import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "../../config/constants.js";
import { AppError } from "../../errors/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { createAccessToken } from "../../middleware/authenticate.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: publicUserSelect,
  });

  return { user, accessToken: createAccessToken(user.id) };
}

async function loginWithRole(input: LoginInput, expectedRole?: "AUTHOR" | "ADMIN") {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  if (
    !user ||
    (expectedRole && user.role !== expectedRole) ||
    !(await bcrypt.compare(input.password, user.passwordHash))
  ) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return { user: publicUser, accessToken: createAccessToken(user.id) };
}

export function login(input: LoginInput) {
  return loginWithRole(input);
}

export function loginAuthor(input: LoginInput) {
  return loginWithRole(input, "AUTHOR");
}

export function loginAdmin(input: LoginInput) {
  return loginWithRole(input, "ADMIN");
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "The account no longer exists.");
  }

  return user;
}
