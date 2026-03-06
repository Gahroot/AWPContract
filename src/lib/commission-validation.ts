import { db } from "@/lib/db";

export interface ValidationResult {
  warnings: string[];
}

export async function validateRoleAssignments(): Promise<ValidationResult> {
  const warnings: string[] = [];

  // Check for at least one NSM
  const nsmCount = await db.user.count({ where: { isNSM: true } });
  if (nsmCount === 0) {
    warnings.push("No National Sales Manager (NSM) is configured. NSM commissions will not be calculated.");
  }

  // Check for at least one VP
  const vpCount = await db.user.count({ where: { isVP: true } });
  if (vpCount === 0) {
    warnings.push("No VP is configured. VP commissions will not be calculated.");
  }

  // Check active territories have territory owners
  const activeTerritories = await db.territory.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { isTerritoryOwner: true },
        select: { id: true },
      },
    },
  });

  for (const territory of activeTerritories) {
    if (territory.users.length === 0) {
      warnings.push(`Territory "${territory.name}" has no territory owner assigned.`);
    }
  }

  // Check for territories with users but no territory owner
  const territoriesWithUsers = await db.territory.findMany({
    where: {
      isActive: true,
      users: { some: {} },
    },
    include: {
      _count: { select: { users: true } },
      users: {
        where: { isTerritoryOwner: true },
        select: { id: true },
      },
    },
  });

  for (const territory of territoriesWithUsers) {
    if (territory.users.length === 0 && territory._count.users > 0) {
      warnings.push(
        `Territory "${territory.name}" has ${territory._count.users} user(s) but no territory owner.`
      );
    }
  }

  // Check for setter managers
  const setterMgrCount = await db.user.count({ where: { isSetterManager: true } });
  if (setterMgrCount === 0) {
    warnings.push("No Setter Manager is configured. Setter Manager commissions will not be calculated.");
  }

  return { warnings };
}
