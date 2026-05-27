import prisma from '../config/database';

type ClosureFields = {
  closureDetails: string | null;
  cancellationReason: string | null;
  closedAt: Date | null;
};

export async function attachCaseClosureFields<T extends { id: string }>(
  caseItem: T,
): Promise<T & ClosureFields> {
  try {
    const rows = await prisma.$queryRaw<ClosureFields[]>`
      SELECT "closureDetails", "cancellationReason", "closedAt"
      FROM "cases"
      WHERE "id" = ${caseItem.id}
    `;
    const row = rows[0];
    if (!row) return { ...caseItem, closureDetails: null, cancellationReason: null, closedAt: null };
    return { ...caseItem, ...row };
  } catch {
    return { ...caseItem, closureDetails: null, cancellationReason: null, closedAt: null };
  }
}
