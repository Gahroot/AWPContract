import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default admin user (password: admin123)
  const adminHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@awp.com" },
    update: { password: adminHash },
    create: {
      email: "admin@awp.com",
      name: "AWP Admin",
      password: adminHash,
      role: "ADMIN",
    },
  });

  // Create a test salesman
  const salesHash = await bcrypt.hash("sales123", 12);
  await prisma.user.upsert({
    where: { email: "sales@awp.com" },
    update: { password: salesHash },
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
