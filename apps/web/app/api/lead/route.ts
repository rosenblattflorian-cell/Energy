import { NextRequest, NextResponse } from 'next/server';
import { LeadIntakeSchema } from '@energy/shared';

const ALLOWLIST = ['name', 'email', 'phone', 'message', 'source', 'website'] as const;
const buckets = new Map<string, { count: number; ts: number }>();

function limited(ip: string) {
  const now = Date.now();
  const item = buckets.get(ip) ?? { count: 0, ts: now };
  if (now - item.ts > 60_000) {
    buckets.set(ip, { count: 1, ts: now });
    return false;
  }
  item.count += 1;
  buckets.set(ip, item);
  return item.count > 20;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (limited(ip)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 });

  const body = await req.json();
  const stripped = Object.fromEntries(
    Object.entries(body).filter(([k]) => (ALLOWLIST as readonly string[]).includes(k))
  );

  const parsed = LeadIntakeSchema.safeParse(stripped);
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 202 });

  return NextResponse.json({ ok: true }, { status: 202 });
}
