import { db } from "@/lib/db";
import type { CommissionModelType } from "@/generated/prisma/client";

export interface CommissionResult {
  amount: number;
  rate: number;
  modelType: CommissionModelType;
  contractTotal: number;
}

/**
 * Calculate commission for a given contract total and salesperson.
 * Supports three models:
 *  - FLAT_PERCENT: contractTotal * flatRate
 *  - PER_SALESPERSON: user-specific rate, fallback to flatRate
 *  - TIERED: graduated brackets (each bracket taxed at its own rate)
 */
export async function calculateCommission(
  contractTotal: number,
  userId: string
): Promise<CommissionResult> {
  // Edge case: $0 or negative contracts
  if (contractTotal <= 0) {
    return { amount: 0, rate: 0, modelType: "FLAT_PERCENT", contractTotal };
  }

  // Fetch active config (use first record, or default)
  const config = await db.commissionConfig.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    // No config = no commission
    return { amount: 0, rate: 0, modelType: "FLAT_PERCENT", contractTotal };
  }

  const modelType = config.modelType;
  const flatRate = config.flatRate ?? 0;

  switch (modelType) {
    case "FLAT_PERCENT": {
      const amount = round(contractTotal * flatRate);
      return { amount, rate: flatRate, modelType, contractTotal };
    }

    case "PER_SALESPERSON": {
      const userRate = await db.commissionRate.findUnique({
        where: { userId },
      });
      const rate = userRate?.rate ?? flatRate;
      const amount = round(contractTotal * rate);
      return { amount, rate, modelType, contractTotal };
    }

    case "TIERED": {
      const tiers = await db.commissionTier.findMany({
        orderBy: { sortOrder: "asc" },
      });

      if (tiers.length === 0) {
        return { amount: 0, rate: 0, modelType, contractTotal };
      }

      // Graduated calculation: each bracket taxed at its own rate
      let totalCommission = 0;
      let remaining = contractTotal;

      for (const tier of tiers) {
        if (remaining <= 0) break;

        const bracketMin = tier.minAmount;
        const bracketMax = tier.maxAmount;

        // Amount in this bracket
        const bracketSize =
          bracketMax != null ? bracketMax - bracketMin : remaining;
        const taxable = Math.min(remaining, bracketSize);

        if (taxable > 0) {
          totalCommission += taxable * tier.rate;
          remaining -= taxable;
        }
      }

      totalCommission = round(totalCommission);
      // Effective rate
      const effectiveRate =
        contractTotal > 0 ? round(totalCommission / contractTotal) : 0;

      return {
        amount: totalCommission,
        rate: effectiveRate,
        modelType,
        contractTotal,
      };
    }

    default:
      return { amount: 0, rate: 0, modelType, contractTotal };
  }
}

/**
 * Upsert a commission record for a completed contract.
 * Deletes any existing record and creates a new one.
 */
export async function upsertCommissionForContract(
  contractId: string,
  notes?: string
): Promise<void> {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      status: true,
      contractTotal: true,
      userId: true,
    },
  });

  if (!contract) return;
  if (contract.status !== "COMPLETED") return;
  if (!contract.userId) return;

  const result = await calculateCommission(
    contract.contractTotal,
    contract.userId
  );

  // Delete existing record for this contract then create new one
  await db.commissionRecord.deleteMany({
    where: { contractId },
  });

  await db.commissionRecord.create({
    data: {
      contractId,
      userId: contract.userId,
      contractTotal: result.contractTotal,
      modelType: result.modelType,
      rate: result.rate,
      amount: result.amount,
      notes: notes ?? null,
    },
  });
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
