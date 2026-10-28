import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { BCRYPT_ROUNDS } from "../src/config/constants.js";
import { prisma } from "../src/lib/prisma.js";

const seedEnv = z
  .object({
    SEED_ADMIN_NAME: z.string().trim().min(2).max(120),
    SEED_ADMIN_EMAIL: z.email().trim().toLowerCase(),
    SEED_ADMIN_PASSWORD: z.string().min(12).max(72),
  })
  .parse(process.env);

try {
  const passwordHash = await bcrypt.hash(seedEnv.SEED_ADMIN_PASSWORD, BCRYPT_ROUNDS);
  const admin = await prisma.user.upsert({
    where: { email: seedEnv.SEED_ADMIN_EMAIL },
    update: { fullName: seedEnv.SEED_ADMIN_NAME, role: "ADMIN" },
    create: {
      fullName: seedEnv.SEED_ADMIN_NAME,
      email: seedEnv.SEED_ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true },
  });

  console.info(`Seeded administrator account ${admin.email} (${admin.role}).`);
} finally {
  await prisma.$disconnect();
}
