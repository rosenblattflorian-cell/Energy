import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Role, canTransition } from '@energy/shared';
import { db } from './firebase';
import { writeAudit } from './audit';

function gate(role: Role, action: string) {
  const matrix: Record<Role, string[]> = {
    ADMIN: ['*'],
    SALES: ['project.transition', 'lead.intake'],
    TECH: ['project.transition'],
    INSTALL: ['project.transition'],
    ACCOUNTING: ['project.transition']
  };
  return matrix[role].includes('*') || matrix[role].includes(action);
}

export const transitionProject = onCall(async (req) => {
  const auth = req.auth;
  if (!auth) throw new HttpsError('unauthenticated', 'Login required');
  const role = (auth.token.role as Role | undefined) ?? 'SALES';
  if (!gate(role, 'project.transition')) throw new HttpsError('permission-denied', 'No access');

  const { projectId, from, to, idempotencyKey } = req.data as {
    projectId: string;
    from: string;
    to: string;
    idempotencyKey?: string;
  };

  if (!canTransition(from, to)) {
    await writeAudit({
      idempotencyKey,
      decision: { type: 'transition', outcome: 'denied', role, from, to, projectId },
      event: { type: 'transition_attempt', role, from, to, projectId }
    });
    throw new HttpsError('failed-precondition', 'Invalid transition');
  }

  await db.collection('projects').doc(projectId).set({ status: to }, { merge: true });
  await writeAudit({
    idempotencyKey,
    decision: { type: 'transition', outcome: 'approved', role, from, to, projectId },
    event: { type: 'transition_applied', role, from, to, projectId }
  });

  return { ok: true };
});
