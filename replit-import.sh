#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/web/{app,app/api/lead,components/ui,lib,tests} apps/functions/src packages/shared/{src,tests}

cat > .gitignore <<'EOF'
node_modules
.pnpm-store
.next
coverage
playwright-report
test-results
.env
.env.local
firebase-debug.log
EOF

cat > package.json <<'EOF'
{
  "name": "energy-monorepo",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --filter @energy/web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "format": "prettier --check .",
    "format:write": "prettier --write ."
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/node": "^22.10.1",
    "eslint": "^9.16.0",
    "eslint-config-next": "^14.2.20",
    "prettier": "^3.4.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
EOF

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@energy/shared": ["packages/shared/src/index.ts"],
      "@energy/shared/*": ["packages/shared/src/*"]
    }
  }
}
EOF

cat > .eslintrc.cjs <<'EOF'
module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  ignorePatterns: ["dist", ".next", "coverage"]
};
EOF

cat > .prettierrc <<'EOF'
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
EOF

cat > vitest.config.ts <<'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/shared/tests/**/*.test.ts'],
    environment: 'node'
  }
});
EOF

cat > playwright.config.ts <<'EOF'
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/tests',
  webServer: {
    command: 'pnpm --filter @energy/web dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000
  },
  use: {
    baseURL: 'http://127.0.0.1:3000'
  }
});
EOF

cat > .env.example <<'EOF'
# Web
NEXT_PUBLIC_FIREBASE_API_KEY=__REPLACE_ME__
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=__REPLACE_ME__
NEXT_PUBLIC_FIREBASE_PROJECT_ID=energy-demo
NEXT_PUBLIC_FIREBASE_APP_ID=__REPLACE_ME__

# Functions / Admin
FIREBASE_PROJECT_ID=energy-demo
FIREBASE_CLIENT_EMAIL=__REPLACE_ME__
FIREBASE_PRIVATE_KEY="__REPLACE_ME_MULTILINE_ESCAPED__"

# Optional emulator usage
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
EOF

cat > README.md <<'EOF'
# Energy Monorepo (Replit Import)

## Quickstart
1. Copy `.env.example` to `.env` and fill required Firebase vars.
2. `pnpm i`
3. Optional emulator: start Firebase emulators for Auth + Firestore.
4. Seed demo data:
   - `pnpm --filter @energy/functions seed`
5. Run app:
   - `pnpm dev`

## Required Firebase vars
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

If your Firebase project ID is unknown, keep placeholder `energy-demo` locally and replace before deployment.

## Demo Seed
Creates:
- 1 ADMIN user
- 1 user for each role: SALES/TECH/INSTALL/ACCOUNTING
- 3 demo projects
- Passwords are placeholders in `apps/functions/src/seed.ts`
EOF

cat > tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./apps/web/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: []
};

export default config;
EOF

cat > postcss.config.js <<'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

cat > apps/web/package.json <<'EOF'
{
  "name": "@energy/web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@energy/shared": "workspace:*",
    "firebase": "^11.0.2",
    "next": "14.2.20",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "tailwindcss": "^3.4.16",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "zod": "^3.24.1"
  }
}
EOF

cat > apps/web/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["**/*.ts", "**/*.tsx", "next-env.d.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > apps/web/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

cat > apps/web/next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@energy/shared']
};

export default nextConfig;
EOF

cat > apps/web/app/globals.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-slate-50 text-slate-900;
}
EOF

cat > apps/web/lib/utils.ts <<'EOF'
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}
EOF

cat > apps/web/components/ui/button.tsx <<'EOF'
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700',
        className
      )}
      {...props}
    />
  );
}
EOF

cat > apps/web/app/layout.tsx <<'EOF'
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/web/app/page.tsx <<'EOF'
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start gap-4 p-8">
      <h1 className="text-2xl font-semibold">Energy CRM Demo</h1>
      <p>Login page placeholder for smoke test and Replit import validation.</p>
      <Button>Login</Button>
    </main>
  );
}
EOF

cat > apps/web/lib/firebase.ts <<'EOF'
import { initializeApp, getApps } from 'firebase/app';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export const app = getApps().length ? getApps()[0] : initializeApp(config);
EOF

cat > apps/web/app/api/lead/route.ts <<'EOF'
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
EOF

cat > apps/web/tests/smoke.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';

test('login page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Energy CRM Demo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});
EOF

cat > apps/functions/package.json <<'EOF'
{
  "name": "@energy/functions",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "echo lint-functions",
    "test": "echo no-tests-yet",
    "seed": "tsx src/seed.ts"
  },
  "dependencies": {
    "@energy/shared": "workspace:*",
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^6.1.1",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
EOF

cat > apps/functions/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}
EOF

cat > apps/functions/src/firebase.ts <<'EOF'
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps()[0]
  ? getApps()[0]
  : initializeApp({
      credential:
        process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
          ? cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            })
          : undefined,
      projectId: process.env.FIREBASE_PROJECT_ID
    });

export const db = getFirestore(app);
EOF

cat > apps/functions/src/audit.ts <<'EOF'
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
EOF

cat > apps/functions/src/index.ts <<'EOF'
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
EOF

cat > apps/functions/src/seed.ts <<'EOF'
import { getAuth } from 'firebase-admin/auth';
import { db } from './firebase';

const users = [
  { email: 'admin@example.com', role: 'ADMIN', password: 'PLACEHOLDER_ADMIN_PASSWORD' },
  { email: 'sales@example.com', role: 'SALES', password: 'PLACEHOLDER_SALES_PASSWORD' },
  { email: 'tech@example.com', role: 'TECH', password: 'PLACEHOLDER_TECH_PASSWORD' },
  { email: 'install@example.com', role: 'INSTALL', password: 'PLACEHOLDER_INSTALL_PASSWORD' },
  { email: 'accounting@example.com', role: 'ACCOUNTING', password: 'PLACEHOLDER_ACCOUNTING_PASSWORD' }
];

async function run() {
  const auth = getAuth();
  for (const u of users) {
    let record;
    try {
      record = await auth.getUserByEmail(u.email);
    } catch {
      record = await auth.createUser({ email: u.email, password: u.password });
    }
    await auth.setCustomUserClaims(record.uid, { role: u.role });
    await db.collection('users').doc(record.uid).set({ email: u.email, role: u.role }, { merge: true });
  }

  await db.collection('projects').doc('demo-1').set({ name: 'Solar Alpha', status: 'LEAD' });
  await db.collection('projects').doc('demo-2').set({ name: 'Storage Beta', status: 'QUALIFIED' });
  await db.collection('projects').doc('demo-3').set({ name: 'Retrofit Gamma', status: 'SCHEDULED' });

  console.log('Seed complete');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
EOF

cat > packages/shared/package.json <<'EOF'
{
  "name": "@energy/shared",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "lint": "echo lint-shared",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "typescript": "^5.7.2"
  }
}
EOF

cat > packages/shared/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "noEmit": false
  },
  "include": ["src/**/*.ts"]
}
EOF

cat > packages/shared/src/index.ts <<'EOF'
import { z } from 'zod';

export const Roles = ['ADMIN', 'SALES', 'TECH', 'INSTALL', 'ACCOUNTING'] as const;
export type Role = (typeof Roles)[number];

export const Statuses = [
  'LEAD',
  'QUALIFIED',
  'SURVEY',
  'PROPOSAL',
  'CONTRACT',
  'SCHEDULED',
  'INSTALLED',
  'INVOICED',
  'PAID'
] as const;
export type Status = (typeof Statuses)[number];

const transitions: Record<Status, Status[]> = {
  LEAD: ['QUALIFIED'],
  QUALIFIED: ['SURVEY'],
  SURVEY: ['PROPOSAL'],
  PROPOSAL: ['CONTRACT'],
  CONTRACT: ['SCHEDULED'],
  SCHEDULED: ['INSTALLED'],
  INSTALLED: ['INVOICED'],
  INVOICED: ['PAID'],
  PAID: []
};

export function canTransition(from: string, to: string): boolean {
  if (!(from in transitions)) return false;
  return (transitions as Record<string, string[]>)[from].includes(to);
}

export const LeadIntakeSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  message: z.string().min(5).max(2000),
  source: z.enum(['web', 'phone', 'partner']).default('web'),
  website: z.string().max(0).optional().default('')
});
EOF

cat > packages/shared/tests/status.test.ts <<'EOF'
import { describe, expect, it } from 'vitest';
import { canTransition } from '../src/index';

describe('status transitions', () => {
  it('allows LEAD -> QUALIFIED', () => {
    expect(canTransition('LEAD', 'QUALIFIED')).toBe(true);
  });

  it('denies LEAD -> CONTRACT', () => {
    expect(canTransition('LEAD', 'CONTRACT')).toBe(false);
  });

  it('denies unknown statuses', () => {
    expect(canTransition('UNKNOWN', 'QUALIFIED')).toBe(false);
  });
});
EOF

cat > packages/shared/tests/lead.test.ts <<'EOF'
import { describe, expect, it } from 'vitest';
import { LeadIntakeSchema } from '../src/index';

describe('lead validation', () => {
  it('accepts a valid lead', () => {
    const parsed = LeadIntakeSchema.safeParse({
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+491234567',
      message: 'Bitte Angebot senden',
      source: 'web',
      website: ''
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const parsed = LeadIntakeSchema.safeParse({
      name: 'Max Mustermann',
      email: 'wrong',
      phone: '+491234567',
      message: 'Bitte Angebot senden',
      source: 'web',
      website: ''
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects honeypot content', () => {
    const parsed = LeadIntakeSchema.safeParse({
      name: 'Max Mustermann',
      email: 'max@example.com',
      phone: '+491234567',
      message: 'Bitte Angebot senden',
      source: 'web',
      website: 'spam'
    });
    expect(parsed.success).toBe(false);
  });
});
EOF

cat > firestore.rules <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create, update, delete: if false;
    }

    match /auditDecisions/{id} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    match /auditEvents/{id} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
EOF

chmod +x replit-import.sh

echo "Scaffold complete. Run: pnpm i && pnpm dev"
