type GroupMemberUser = { id: string; name: string } | null | undefined;

type GroupForDisplay = {
  name: string;
  isPrivate: boolean;
  leaderId: string;
  leader?: { id: string; name: string } | null;
  members?: Array<{ user?: GroupMemberUser }>;
};

/** Nome exibido: em contatos privados, cada usuário vê o nome do outro participante. */
export function getGroupDisplayName(group: GroupForDisplay, viewerUserId: string): string {
  if (!group.isPrivate) {
    return group.name;
  }

  const otherFromMembers = (group.members ?? [])
    .map((m) => m.user)
    .find((u) => u?.id && u.id !== viewerUserId);

  if (otherFromMembers?.name) {
    return `Contato - ${otherFromMembers.name}`;
  }

  if (group.leader && group.leader.id !== viewerUserId) {
    return `Contato - ${group.leader.name}`;
  }

  return group.name;
}

export function withGroupDisplayName<T extends GroupForDisplay>(
  group: T,
  viewerUserId: string,
): T & { displayName: string } {
  return {
    ...group,
    displayName: getGroupDisplayName(group, viewerUserId),
  };
}
