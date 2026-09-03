# Public demo — local verification

Status: ready for user review. No deployment, push, credential rotation, or shared database edits performed.

## Data protection

- Anonymous /api/state returns only three explicitly fictional examples and an empty case list. It does not read Convex.
- Every /api/state write checks the signed staff session before reading the body or calling the database. Body role flags and forged cookies do not grant access.
- /api/guide similarly requires a verified staff session. Real follow-up policy wording and team directory are not imported into the client bundle.
- /api/jobs continues to require its separate server secret.
- Session verification rejects malformed, forged, expired and non-finite expiry values. No private records are shown while unlocking.
- Responses use private/no-store caching and vary by cookie. Refresh failure, logout and detected session expiration clear private UI state.
- Search, feedback and escalation previews use browser memory only. There is no public teammate selector or shared submission.
- Existing test artifacts are filtered from normal staff lists, not deleted from storage. Setup/routing demo notices were removed.
- The Next.js floating development indicator is disabled through its documented configuration. No fixed-position widget appeared in local tests. Vercel's optional injected toolbar is outside the local app and was not tested on the unchanged live deployment.

## Output from executed checks

```
npm test: tests 44 / pass 44 / fail 0
local API security: checks 34 / passed 34 / failed 0
publicWritesDenied: true
privateRecordsReturned: false
production build: compiled successfully; TypeScript passed; 6/6 static pages generated
frontend asset scan: 24 files; private names, policy sentinels and configured secrets not found
```

API checks used no cookie and forged Founder/CoS cookies; all eight mutation actions returned 401. PUT/PATCH/DELETE were rejected; /api/guide and /api/jobs denied anonymous access. No real PIN login or authenticated production write was attempted. Session success was tested using a synthetic unit-test secret, not a fabricated production login.

## Browser checks

| Check | 390px | 1440px |
| --- | --- | --- |
| Fictional public library only | Pass | Pass |
| Search first-purchase discount | Pass | Pass |
| Unrelated query gives no match | Pass | Pass |
| Escalation carries text; finish says nothing sent/saved | Pass | Pass |
| Feedback preview does not submit | Pass | Pass |
| Category filter | Pass (Operations) | Pass (Marketing) |
| Founder and CoS prompt for PIN; no private queue | Pass | Pass |
| Expand/collapse and reasoning disclosure | Pass | Pass |
| Measured visible targets >=44px | Pass | Pass |
| Input focused and unobstructed; no fixed widgets | Pass | Pass |
| Horizontal overflow | None | None |

Screenshots are in the parent outputs/public-demo folder: mobile-390.png and desktop-1440.png. Browser viewport testing is not a physical Android/iPhone test. Authenticated staff workflows were not end-to-end browser tested against the shared database in this task.

## Files changed

New:
- lib/public-demo.ts — three fictional entries and test-record filter.
- lib/session-role.ts — strict signed-session validation.
- lib/domain-actions.ts — server-side actions and private team directory moved out of frontend-shared domain module.
- app/api/guide/route.ts — authenticated, read-only staff follow-up answers.
- components/public-demo.tsx — read-only public search/browse/preview and locked staff entry.
- components/staff-follow-up.tsx — staff follow-up UI loads protected answers from the server.
- tests/public-demo.test.mjs — fictional-data/session tests.
- scripts/test-public-demo.mjs — local HTTP authorization checks.
- scripts/check-public-assets.mjs — built frontend privacy scan.
- PUBLIC_DEMO_SCOPE.md, PARKING_LOT.md, PUBLIC_DEMO_VERIFICATION.md — scope and verification notes.

Modified:
- app/api/state/route.ts — anonymous projection and write authorization.
- lib/auth.ts — strict session verification.
- lib/store.ts — server-only import guard.
- lib/convex-store.ts — server action import.
- lib/domain.ts — removed private directory and mutation implementation from browser-shared helpers.
- components/precedent-app.tsx — public/staff separation, state clearing, setup removal, protected follow-ups.
- components/rule-feedback.tsx — team directory supplied only through authenticated data.
- app/product.css — 44px targets and responsive demo layout.
- next.config.ts — disable local development indicator.
- tests/domain.test.mjs, tests/feedback.test.mjs — imports updated after server action separation.

Removed:
- components/routing-demo.tsx — unused setup-only simulator.

The pre-existing .gitignore edit was preserved, not authored in this task.

## Before a later deployment

The currently published site still runs the previous open-data code. These protections apply only locally until deployment is separately approved. Logged-out real teammates will now see the fictional demo; a separate authenticated teammate flow is parked. Review/rotate shared PINs before publishing because they were previously shared in this conversation. No secrets are recorded here.
