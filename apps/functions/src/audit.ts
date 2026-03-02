import { db } from './firebase';

export async function writeAudit(input: {
  idempotencyKey?: string;
  decision: Record<string, unknown>;
  event: Record<string, unknown>;
}) {
  const key = input.idempotencyKey ?? crypto.randomUUID();
  const marker = db.collection('auditIdempotency').doc(key);
  const seen = await marker.get();
  if (seen.exists) return { duplicate: true };

  await db.runTransaction(async (tx) => {
    tx.create(marker, { createdAt: Date.now() });
    tx.create(db.collection('auditDecisions').doc(), {
      ...input.decision,
      idempotencyKey: key,
      createdAt: Date.now()
    });
    tx.create(db.collection('auditEvents').doc(), {
      ...input.event,
      idempotencyKey: key,
      createdAt: Date.now()
    });
  });

  return { duplicate: false };
}
