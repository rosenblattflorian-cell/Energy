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
- Customer opens `/sign/[token]` and submits signature data.
- Next API proxy forwards to Cloud Function `submitSignature`.
- Cloud Function validates token + TTL + pending status, embeds signature in PDF, creates new `documentVersions` entry, updates `documents`, and returns a download URL.

## Deploy (Firebase App Hosting)

See `docs/DEPLOYMENT.md`.
