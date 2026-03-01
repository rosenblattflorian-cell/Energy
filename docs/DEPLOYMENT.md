# Deployment (Firebase App Hosting)

This repository uses **Firebase App Hosting** (SSR) + Cloud Functions for signature authority.

## 1) Prerequisites

- Firebase project (Blaze)
- Firebase CLI
- App Hosting enabled in Firebase console

## 2) Environment/secrets

Configure the values from `.env.example` as secrets/variables for App Hosting and Cloud Functions.

## 3) Deploy backend first

```bash
firebase deploy --only functions,firestore
```

This deploys:
- Cloud Functions from `functions/src/index.ts`
- Firestore security rules and indexes

## 4) Deploy app via App Hosting

Connect this GitHub repository in Firebase App Hosting and deploy.

`apphosting.yaml` is the source of App Hosting runtime config.

## Notes

- `firebase.json` intentionally has no static hosting `public: ./out` config.
- Signature placement currently uses a minimal coordinate mapping (`customerSignature` fallback in `functions/src/lib/pdf.ts`).
