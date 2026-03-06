/**
 * Production seed script — safe to run on production database.
 *
 * Only creates/updates:
 *  1. Commission settings (rates, thresholds)
 *  2. Territories
 *  3. Company settings
 *
 * Does NOT create test users, contracts, or any sample data.
 * All operations use upsert so it's idempotent.
 *
 * Usage: railway run bun prisma/seed-production.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting production seed...\n");

  // ─── Company Settings ───────────────────────────────────────
  const settings = [
    { key: "company_name", value: "Advanced Window Products" },
    { key: "company_phone", value: "(801) 505-9622" },
    { key: "company_address", value: "4035 S 500 W, Murray, UT 84123" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`[OK] Company settings (${settings.length} keys)`);

  // ─── Commission Settings ───────────────────────────────────
  // Use upsert-like approach: if any row exists, update it; otherwise create.
  const existing = await prisma.commissionSettings.findFirst();

  const commissionData = {
    // Sales Rep
    salesRepRate: 0.10,
    salesRepRateBelowFair: 0.05,
    salesRepFloor: 0.85,
    salesRepCeiling: 1.15,

    // Setter
    setterRate: 0.03,
    setterFloor: 0.85,

    // Setter Manager
    setterManagerRate: 0.02,
    setterManagerRateBelowFair: 0.01,

    // Territory Owner (tiered)
    territoryOwnerRateTier1: 0.01,
    territoryOwnerRateTier2: 0.015,
    territoryOwnerRateTier3: 0.02,
    territoryOwnerTier2Threshold: 500000,
    territoryOwnerTier3Threshold: 1000000,

    // VP
    vpRate: 0.01,
    vpRateBelowFair: 0.005,

    // NSM
    nsmRate: 0.005,
    nsmRateBelowFair: 0.0025,

    // Traditional Sales (self-gen)
    traditionalSalesRepRate: 0.12,
    traditionalSalesRepRateBelowFair: 0.07,
    traditionalFloorRate: 0.85,
    traditionalPriceCeiling: 1.15,
    traditionalNsmOverrideRate: 0.005,
    traditionalNsmOverrideRateBelowFair: 0.0025,
  };

  if (existing) {
    await prisma.commissionSettings.update({
      where: { id: existing.id },
      data: commissionData,
    });
    console.log(`[OK] Commission settings (updated existing row ${existing.id})`);
  } else {
    await prisma.commissionSettings.create({ data: commissionData });
    console.log("[OK] Commission settings (created new row)");
  }

  // ─── Territories ────────────────────────────────────────────
  const territories = [
    { name: "SLC", market: "SLC" },
    { name: "Orem", market: "SLC" },
    { name: "Phoenix", market: "Phoenix" },
    { name: "Vancouver", market: "Vancouver" },
  ];

  for (const t of territories) {
    await prisma.territory.upsert({
      where: { name: t.name },
      update: { market: t.market },
      create: t,
    });
  }
  console.log(`[OK] Territories (${territories.length} upserted)`);

  // ─── Summary ────────────────────────────────────────────────
  const userCount = await prisma.user.count();
  const contractCount = await prisma.contract.count();
  const territoryCount = await prisma.territory.count();

  console.log("\n--- Production DB Summary ---");
  console.log(`Users:        ${userCount}`);
  console.log(`Contracts:    ${contractCount}`);
  console.log(`Territories:  ${territoryCount}`);
  console.log("\nProduction seed completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
