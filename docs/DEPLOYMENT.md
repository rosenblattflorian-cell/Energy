# Deployment (Firebase App Hosting)

This repo is aligned to **Firebase App Hosting** for Next.js SSR and dynamic routes.

## Why this configuration

- No static export (`out/`) assumptions.
- No rewrite to a non-existing function `app`.
- Next app is deployed by App Hosting, API server authority is in Firebase Functions.

## Prerequisites

- Firebase project (Blaze plan)
- Firebase CLI
- App Hosting enabled in Firebase console

## Required secrets/env

Defined in `apphosting.yaml`:

- `FUNCTIONS_BASE_URL`
- `BASE_URL`

Set both as Secret Manager entries and map in App Hosting.

## Deploy steps

1. Deploy Firestore rules/indexes:

```bash
firebase deploy --only firestore
```

2. Deploy Cloud Functions:

```bash
firebase deploy --only functions
```

3. Deploy Next.js app through Firebase App Hosting (GitHub-connected deploy or console-triggered deploy).

## Notes

- `firebase.json` intentionally contains Firestore + Functions config only for this setup.
- Signature submit endpoint is server-authoritative in Cloud Functions.
