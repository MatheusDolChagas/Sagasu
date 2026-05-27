import prisma from '../config/database';
import type { Notification, NotificationType } from '@prisma/client';
import { emitCaseFeed, emitToUser } from '../socket';

async function createAndEmitNotification(data: {
  userId: string;
  caseId: string | null;
  title: string;
  message: string;
  type: NotificationType;
}): Promise<Notification> {
  const n = await prisma.notification.create({
    data: {
      userId: data.userId,
      caseId: data.caseId,
      title: data.title,
      message: data.message,
      type: data.type,
    },
  });
  emitToUser(data.userId, 'notification', n);
  return n;
}

export async function onTipCreated(
  caseId: string,
  tipId: string,
  tipAuthorUserId: string | null,
  preview: string,
): Promise<void> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { userId: true, title: true },
  });
  if (!c) return;
  if (tipAuthorUserId && tipAuthorUserId === c.userId) return;

  await createAndEmitNotification({
    userId: c.userId,
    caseId,
    title: 'Nova dica recebida',
    message: `Nova informação no caso "${c.title}".`,
    type: 'TIP_RECEIVED',
  });

  emitCaseFeed(caseId, {
    type: 'TIP',
    id: tipId,
    createdAt: new Date().toISOString(),
    preview: preview.slice(0, 200),
  });
}

export async function onVolunteerPending(
  caseId: string,
  volunteerId: string,
  volunteerName: string,
): Promise<void> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { userId: true, title: true },
  });
  if (!c) return;

  await createAndEmitNotification({
    userId: c.userId,
    caseId,
    title: 'Novo voluntário',
    message: `${volunteerName} quer ajudar no caso "${c.title}".`,
    type: 'VOLUNTEER_JOINED',
  });

  emitCaseFeed(caseId, {
    type: 'VOLUNTEER',
    id: volunteerId,
    createdAt: new Date().toISOString(),
    volunteerName,
    status: 'PENDING',
  });
}

export async function onVolunteerStatusChanged(
  caseId: string,
  volunteerUserId: string,
  caseTitle: string,
  status: 'APPROVED' | 'REJECTED' | 'PENDING',
  volunteerId: string,
  volunteerName: string,
): Promise<void> {
  const title =
    status === 'APPROVED'
      ? 'Pedido aprovado'
      : status === 'REJECTED'
        ? 'Pedido não aprovado'
        : 'Atualização do voluntariado';

  const message =
    status === 'APPROVED'
      ? `Você foi aprovado como voluntário no caso "${caseTitle}".`
      : status === 'REJECTED'
        ? `Seu pedido de voluntariado no caso "${caseTitle}" não foi aprovado.`
        : `Houve uma atualização no seu pedido para o caso "${caseTitle}".`;

  await createAndEmitNotification({
    userId: volunteerUserId,
    caseId,
    title,
    message,
    type: 'CASE_UPDATE',
  });

  emitCaseFeed(caseId, {
    type: 'VOLUNTEER',
    id: volunteerId,
    createdAt: new Date().toISOString(),
    volunteerName,
    status,
  });
}

export async function onSightingCreated(
  caseId: string,
  sightingId: string,
  photoUrl: string,
  description: string | null,
): Promise<void> {
  const c = await prisma.case.findUnique({
    where: { id: caseId },
    select: { userId: true, title: true },
  });
  if (!c) return;

  await createAndEmitNotification({
    userId: c.userId,
    caseId,
    title: 'Novo avistamento',
    message: `Foi registrado um avistamento com foto no caso "${c.title}".`,
    type: 'CASE_UPDATE',
  });

  emitCaseFeed(caseId, {
    type: 'SIGHTING',
    id: sightingId,
    createdAt: new Date().toISOString(),
    photoUrl,
    description: description ?? undefined,
  });
}
