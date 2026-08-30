# Scentira Decision Precedent Tool

This project now targets Next.js on Vercel, with Convex for shared data.

## Local development

Run `npm install`, then `npm run dev`. Next.js reads the private `.env.local` file.
Run `npm test` and `npm run build` before publishing.

## Private server settings

Configure these separately in Vercel: `CONVEX_URL`, `PRECEDENT_BRIDGE_SECRET`,
`FOUNDER_PIN`, `COS_PIN`, `SESSION_SECRET`, and `JOB_SECRET`.
Never prefix secrets with `NEXT_PUBLIC_` or `VITE_`, commit them to GitHub, or
paste their values into chat. `.env.example` lists empty placeholders.
The bridge key must match `PRECEDENT_BRIDGE_SECRET` on the selected Convex deployment.

The app uses server-side API routes; only the server calls the protected Convex
functions. Convex code is deployed separately with its CLI. Uploading this
repository to GitHub does not deploy Convex functions or copy server settings.

## Current testing database

The existing cloud development deployment is `polite-sardine-31`, in the
`scentira-decision-tool` Convex project. It contains migrated rules and clearly
labeled demo cases. It is not a separate production database.

## Before sharing

- Keep initial Vercel deployment protected/private until access is approved.
- Resolve reported security issues before publishing.
- Verify server settings, PIN login, saved decisions and mobile layout at the deployed URL.
- Shared PINs and open team access are demo-only controls, not production authentication.
- Emails and unattended escalation routing are not connected; do not claim otherwise.
- Do not enable a scheduler or email sending as part of deployment without testing them separately.

## Migration safety

The pre-migration source archive and original SQLite/JSON backup are in the parent
workspace's private `outputs` folder, outside this repository. The old D1 database
does not contain later Convex writes; restoring old source must not silently switch
the data source back to D1. Take a fresh Convex backup before any later data move.
