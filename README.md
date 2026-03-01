# Solar Mitte Energy OS

## Local development

1. Install root dependencies: `npm ci`
2. Run quality checks:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
3. Start app locally: `npm run dev`

## Environment

Copy `.env.example` to `.env.local` and set:

- `FUNCTIONS_BASE_URL`: URL of Firebase Cloud Functions endpoint.
- `BASE_URL`: Public app URL used in QR code links (for QR generation in functions).

## Signature flow (E2E)

1. Internal user opens `/projects/[projectId]` and clicks **Kunden-Signatur anfordern**.
2. Frontend calls `/api/signature/create-request`.
3. Next API route proxies request to Cloud Function `createSignatureRequest`.
4. Function creates a one-time token hash (TTL 10 min), stores pending request, returns QR URL + QR image.
5. Customer opens `/sign/[token]`, draws signature, and submits.
6. Frontend calls `/api/signature/submit` (proxy to Cloud Function `submitSignature`).
7. Function validates token hash + TTL + pending state, marks request submitted atomically, embeds PNG signature into current PDF, writes a new version in Storage, updates `documents`, appends `documentVersions`, and returns `{ success, pdfUrl, version }`.

## Deploy (Firebase App Hosting)

See `docs/DEPLOYMENT.md`.
