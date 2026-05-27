import prisma from '../config/database';

export async function getGroupParticipantUserIds(
  groupId: string,
  excludeUserId?: string,
): Promise<string[]> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: {
      leaderId: true,
      case: { select: { userId: true } },
      members: { select: { userId: true } },
    },
  });
  if (!group) return [];

  const ids = new Set<string>([group.leaderId, ...group.members.map((m) => m.userId)]);
  if (group.case?.userId) ids.add(group.case.userId);
  if (excludeUserId) ids.delete(excludeUserId);
  return Array.from(ids);
}

export async function countUnreadInGroup(userId: string, groupId: string): Promise<number> {
  const receipt = await prisma.groupReadReceipt.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { lastReadAt: true },
  });

  return prisma.groupComment.count({
    where: {
      groupId,
      userId: { not: userId },
      ...(receipt
        ? { createdAt: { gt: receipt.lastReadAt } }
        : {}),
    },
  });
}

export async function countUnreadByGroups(
  userId: string,
  groupIds: string[],
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  if (groupIds.length === 0) return result;

  await Promise.all(
    groupIds.map(async (groupId) => {
      result[groupId] = await countUnreadInGroup(userId, groupId);
    }),
  );
  return result;
}

export async function markGroupAsRead(userId: string, groupId: string): Promise<void> {
  const now = new Date();
  await prisma.groupReadReceipt.upsert({
    where: { groupId_userId: { groupId, userId } },
    create: { groupId, userId, lastReadAt: now },
    update: { lastReadAt: now },
  });
}
