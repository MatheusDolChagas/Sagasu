import prisma from '../config/database';
import type { NotificationType } from '@prisma/client';
import { emitToUser } from '../socket';
import {
  countUnreadInGroup,
  getGroupParticipantUserIds,
} from '../utils/groupUnread';
import { withGroupDisplayName } from '../utils/groupDisplay';

async function createAndEmitNotification(data: {
  userId: string;
  caseId: string | null;
  groupId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  const n = await prisma.notification.create({
    data: {
      userId: data.userId,
      caseId: data.caseId,
      groupId: data.groupId,
      title: data.title,
      message: data.message,
      type: data.type,
    },
    include: {
      case: { select: { id: true, title: true } },
    },
  });
  emitToUser(data.userId, 'notification', n);
  return n;
}

export async function onGroupMessageCreated(
  groupId: string,
  authorUserId: string,
  authorName: string,
  preview: string,
): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      case: { select: { id: true, title: true, userId: true } },
      leader: { select: { id: true, name: true } },
      members: {
        select: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!group) return;

  const recipientIds = await getGroupParticipantUserIds(groupId, authorUserId);
  if (recipientIds.length === 0) return;

  const snippet = preview.trim().slice(0, 120) || 'Nova mensagem no chat';
  const chatKind = group.isPrivate ? 'contato salvo' : 'grupo de busca';

  for (const userId of recipientIds) {
    const displayGroup = withGroupDisplayName(group, userId);
    const groupLabel = displayGroup.displayName ?? displayGroup.name;

    await createAndEmitNotification({
      userId,
      caseId: group.caseId,
      groupId,
      title: group.isPrivate ? 'Mensagem no contato' : 'Mensagem no grupo',
      message: `${authorName} enviou uma mensagem em "${groupLabel}" (${chatKind}): ${snippet}`,
      type: 'GROUP_MESSAGE',
    });

    const unreadCount = await countUnreadInGroup(userId, groupId);
    emitToUser(userId, 'group:unread', { groupId, unreadCount });
  }
}
