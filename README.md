# Solar Mitte Energy OS

## Local development

1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. `npm run dev`

## Environment

Copy `.env.example` to `.env.local` and set:

- `FUNCTIONS_BASE_URL`: URL of Firebase Cloud Functions endpoint.
- `BASE_URL`: Public app URL used in QR code links.

## Signature flow

- Internal user triggers **Kunden-Signatur anfordern** in `/projects/[projectId]`.
- App calls a Next API proxy endpoint, which forwards to Cloud Function `createSignatureRequest`.
- Cloud Function creates one-time token hash with 10 minute TTL and returns QR data URL.
- Customer opens `/sign/[token]`, draws a signature on canvas, and submits.
- Next API proxy forwards to Cloud Function `submitSignature`.
- Cloud Function validates token + TTL + pending status in a transaction, embeds signature into PDF, creates a new `documentVersions` entry, updates `documents`, and returns `{ success, pdfUrl, version }`.

### Signature placement

Signature placement is currently mapped by `fieldName` in `src/lib/pdf.ts` (`SIGNATURE_FIELD_MAP`).
Default mapping supports `customerSignature`; add coordinates there for additional placeholders.

## Deploy (Firebase App Hosting)

See `docs/DEPLOYMENT.md`.
