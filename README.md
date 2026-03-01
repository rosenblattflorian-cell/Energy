# Solar Mitte Energy OS

Next.js 14 App Router app with Firebase-backed document signature flow.

## Local setup

1. Copy env template:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Run checks:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
4. Start app:
   ```bash
   npm run dev
   ```

## Environment variables

- `FUNCTIONS_BASE_URL` – base URL of deployed Firebase functions (without trailing slash), e.g. `https://europe-west1-<project>.cloudfunctions.net`
- `BASE_URL` – public base URL for the app (used to generate QR links in functions)

## Signature flow (end-to-end)

1. Internal user opens `/projects/[projectId]` and clicks **Kunden-Signatur anfordern**.
2. Frontend calls `POST /api/signature/create-request`.
3. Next API route proxies to Cloud Function `createSignatureRequest`.
4. Function creates one-time token (`tokenHash` only stored), TTL = 10 minutes, returns `{ url, qrDataUrl, expiresAt }`.
5. Customer opens `/sign/[token]`, signs on canvas, submits.
6. Frontend calls `POST /api/signature/submit` (proxy -> Cloud Function `submitSignature`).
7. Function validates token (exists, pending, not expired), marks request as processing, embeds PNG signature into PDF, stores a new version, writes `documentVersions`, updates `documents`, marks request submitted, and returns `{ success, pdfUrl, version }`.

## Deployment

This repo is aligned to **Firebase App Hosting** for Next.js SSR + dynamic routes.

See `docs/DEPLOYMENT.md`.
