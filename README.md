# Solar Mitte Energy OS

Next.js 14 (App Router) + Firebase Cloud Functions + Firestore/Storage based signature workflow.

## Local development

```bash
npm ci
npm run lint
npm run test
npm run build
npm run dev
```

## Environment

Copy `.env.example` to `.env.local`:

- `FUNCTIONS_BASE_URL`: Base URL of deployed Firebase HTTP functions.
- `BASE_URL`: Public URL of the web app used to generate QR links.

## Signature flow (E2E)

1. Internal user opens `/projects/[projectId]` and clicks **Kunden-Signatur anfordern**.
2. Frontend calls `/api/signature/create-request` (proxy), which forwards to Cloud Function `createSignatureRequest`.
3. Function stores `signatureRequests` with `tokenHash`, `expiresAt` (10 minutes), `status=pending`, and returns `{ url, qrDataUrl }`.
4. Customer opens `/sign/[token]`, signs on canvas, submits.
5. Frontend calls `/api/signature/submit` (proxy), which forwards to Cloud Function `submitSignature`.
6. Function validates token hash + TTL + pending state, embeds PNG into PDF, saves a new document version in Storage, updates `documents` and append-only `documentVersions`, marks request `submitted`, returns `{ success, pdfUrl, version }`.

## Security model

- Browser never writes signature-critical records directly.
- `signatureRequests`, `documents`, `documentVersions` are server-authoritative in Firestore rules.
- Anonymous customer uses token flow via HTTP function only.

## Deployment

Primary path: Firebase App Hosting for SSR/dynamic routes. See `docs/DEPLOYMENT.md`.
