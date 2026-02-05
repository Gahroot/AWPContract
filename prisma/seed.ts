import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user (password: admin123)
  // Using a simple hash for dev - in production use bcrypt
  const { createHash } = await import("crypto");
  const hash = createHash("sha256").update("admin123").digest("hex");

  await prisma.user.upsert({
    where: { email: "admin@awp.com" },
    update: {},
    create: {
      email: "admin@awp.com",
      name: "AWP Admin",
      password: hash,
      role: "ADMIN",
    },
  });

  // Create a test salesman
  const salesHash = createHash("sha256").update("sales123").digest("hex");
  await prisma.user.upsert({
    where: { email: "sales@awp.com" },
    update: {},
    create: {
      email: "sales@awp.com",
      name: "Test Salesman",
      password: salesHash,
      role: "SALESMAN",
    },
  });

  // Default settings
  await prisma.setting.upsert({
    where: { key: "company_name" },
    update: {},
    create: { key: "company_name", value: "Advanced Window Products" },
  });

  await prisma.setting.upsert({
    where: { key: "company_phone" },
    update: {},
    create: { key: "company_phone", value: "(801) 505-9622" },
  });

  await prisma.setting.upsert({
    where: { key: "company_address" },
    update: {},
    create: {
      key: "company_address",
      value: "4035 S 500 W, Murray, UT 84123",
    },
  });

  console.log("Seed completed successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
