# Solar Mitte Energy OS

Next.js 14 App Router frontend with Firebase Cloud Functions for server-authoritative e-signature processing.

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

- `FUNCTIONS_BASE_URL`: Base URL for deployed Firebase HTTP functions.
- `BASE_URL`: Public frontend URL used to build QR signature links.

## Signature flow

1. Internal user opens `/projects/[projectId]` and clicks **Kunden-Signatur anfordern**.
2. Frontend calls `POST /api/signature/create-request` (proxy) -> Firebase function `createSignatureRequest`.
3. Function creates one-time token hash (`signatureRequests`), TTL 10 minutes, returns QR URL + QR data URL.
4. Customer opens `/sign/[token]`, draws signature, submits.
5. Frontend calls `POST /api/signature/submit` (proxy) -> Firebase function `submitSignature`.
6. Function validates token (hash lookup, pending state, TTL), embeds PNG signature into current PDF, stores next document version in Storage, updates `documents`, appends `documentVersions`, and returns `pdfUrl` + `version`.

## Firebase deployment model

This repository is configured for **Firebase App Hosting** (SSR) + **Cloud Functions** for write-authoritative signature operations.

- `firebase.json` only configures Functions + Firestore (no static `./out` hosting).
- `apphosting.yaml` is the App Hosting runtime configuration.

See `docs/DEPLOYMENT.md` for deployment steps.
