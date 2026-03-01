# Deployment (Firebase App Hosting)

This repository is configured for **Firebase App Hosting** with Next.js SSR + dynamic routes.

## 1) Prerequisites

- Firebase project (Blaze plan)
- Firebase CLI (`npm i -g firebase-tools`)
- App Hosting enabled in Firebase console

## 2) Configure secrets/env

Create secrets in Firebase Secret Manager and map them in `apphosting.yaml`:

- `FUNCTIONS_BASE_URL`
- `BASE_URL`

## 3) Deploy Cloud Functions

Functions live in `functions/` with Node 20 runtime and own `package.json`.

```bash
firebase deploy --only functions
```

## 4) Deploy Firestore rules/indexes

```bash
firebase deploy --only firestore
```

## 5) Deploy App Hosting

Connect this repository to Firebase App Hosting and deploy. `apphosting.yaml` is the source of runtime env mapping.

## Notes

- `firebase.json` intentionally does **not** contain static Hosting `public: out` config.
- Signature placement currently uses a fixed coordinate on the last PDF page (`x: 50, y: 50, width: 180, height: 70`) as a minimal placeholder mapping. Extend this mapping if template-specific fields are required.
