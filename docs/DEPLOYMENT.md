# Deployment (Firebase App Hosting + Cloud Functions)

This project uses **one consistent strategy**:

- Next.js SSR app on **Firebase App Hosting**
- Signature write flow on **Firebase Cloud Functions**
- Firestore rules/indexes deployed from repo root

## 1) Prerequisites

- Firebase project (Blaze)
- Firebase CLI installed and authenticated
- App Hosting enabled in Firebase Console

## 2) Environment/Secrets

Set secrets in Firebase Secret Manager and map in `apphosting.yaml`:

- `FUNCTIONS_BASE_URL`
- `BASE_URL`

For local frontend, create `.env.local` from `.env.example`.

## 3) Deploy Functions

```bash
cd functions
npm ci
npm run build
cd ..
firebase deploy --only functions
```

## 4) Deploy Firestore rules + indexes

```bash
firebase deploy --only firestore
```

## 5) Deploy SSR app (App Hosting)

Connect the GitHub repository in Firebase App Hosting and deploy the configured backend.

## Notes

- No static export (`next export`, `./out`) is used.
- `firebase.json` intentionally does not include a static hosting block or rewrite to a missing `app` function.
