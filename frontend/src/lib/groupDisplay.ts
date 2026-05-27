import type { Group } from '../types';

/** Título do grupo na UI; contatos privados mostram o nome do outro participante. */
export function getGroupLabel(
  group: Pick<Group, 'name' | 'displayName' | 'isPrivate' | 'leaderId'> & {
    members?: Group['members'];
    leader?: Group['leader'];
  },
  currentUserId?: string,
): string {
  if (group.displayName?.trim()) {
    return group.displayName.trim();
  }

  if (group.isPrivate && currentUserId) {
    const other = group.members
      ?.map((m) => m.user)
      .find((u) => u?.id && u.id !== currentUserId);
    if (other?.name) {
      return `Contato - ${other.name}`;
    }
    if (group.leader && group.leader.id !== currentUserId) {
      return `Contato - ${group.leader.name}`;
    }
  }

  return group.name;
}

/** Papel exibido na lista de membros (dono do caso tem prioridade sobre membro/líder). */
export function getMemberRoleLabel(
  userId: string | undefined,
  memberRole: string,
  caseOwnerId?: string,
  groupLeaderId?: string,
): string {
  if (userId && caseOwnerId && userId === caseOwnerId) {
    return 'Dono do caso';
  }
  if (userId && groupLeaderId && userId === groupLeaderId) {
    return 'Líder do grupo';
  }
  if (memberRole === 'LEADER') {
    return 'Líder do grupo';
  }
  return 'Membro';
}

export function getViewerGroupRoleLabel(
  viewerId: string | undefined,
  group: {
    leaderId: string;
    case?: { userId?: string };
    members?: Array<{ role: string; user?: { id: string } }>;
  },
): string | null {
  if (!viewerId) return null;
  if (group.case?.userId === viewerId) return 'Dono do caso';
  if (group.leaderId === viewerId) return 'Líder do grupo';
  const m = group.members?.find((x) => x.user?.id === viewerId);
  if (!m) return null;
  return getMemberRoleLabel(m.user?.id, m.role, group.case?.userId, group.leaderId);
}

const MEMBER_ROLE_BADGE: Record<string, string> = {
  'Dono do caso':
    'bg-violet-500/15 text-violet-900 border-violet-500/35 dark:text-violet-200',
  'Líder do grupo':
    'bg-primary/15 text-dark border-primary/30',
  Membro: 'bg-muted/15 text-dark border-muted/25',
};

export function memberRoleBadgeClass(roleLabel: string): string {
  return MEMBER_ROLE_BADGE[roleLabel] ?? MEMBER_ROLE_BADGE.Membro;
}
