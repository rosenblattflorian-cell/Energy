# Deployment (Firebase App Hosting)

This repository is configured for **Firebase App Hosting** with Next.js SSR and dynamic routes.

## 1) Prerequisites

- Firebase project with Blaze plan.
- Firebase CLI (`npm i -g firebase-tools`).
- App Hosting enabled in Firebase console.

## 2) Configure secrets/env

Set secrets in Firebase Secret Manager and map them in `apphosting.yaml`:

- `FUNCTIONS_BASE_URL`
- `BASE_URL`

## 3) Cloud Functions

Deploy functions first:

```bash
firebase deploy --only functions
```

Expected function exports from `functions/src/index.ts`:
- `createSignatureRequest`
- `submitSignature`

## 4) Firestore rules + indexes

```bash
firebase deploy --only firestore
```

## 5) App Hosting deploy

Connect this repo to App Hosting in Firebase console, ensure `apphosting.yaml` is detected, then deploy.

> `firebase.json` intentionally has no static hosting `public: out` config and no hosting rewrites.
> SSR/dynamic routing is handled by App Hosting.
