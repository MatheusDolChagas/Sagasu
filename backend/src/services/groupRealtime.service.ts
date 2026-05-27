import prisma from '../config/database';
import { emitGroupMembers } from '../socket';

export async function notifyGroupMembersChanged(groupId: string): Promise<void> {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  emitGroupMembers(groupId, { groupId, members });
}
