# Energy Monorepo (Replit Import)

## Quickstart
1. Copy `.env.example` to `.env` and fill required Firebase vars.
2. `pnpm i`
3. Optional emulator: start Firebase emulators for Auth + Firestore.
4. Seed demo data:
   - `pnpm --filter @energy/functions seed`
5. Run app:
   - `pnpm dev`

## Required Firebase vars
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

If your Firebase project ID is unknown, keep placeholder `energy-demo` locally and replace before deployment.

## Demo Seed
Creates:
- 1 ADMIN user
- 1 user for each role: SALES/TECH/INSTALL/ACCOUNTING
- 3 demo projects
- Passwords are placeholders in `apps/functions/src/seed.ts`
