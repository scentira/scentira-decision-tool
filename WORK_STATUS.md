# Work in progress — not ready for live use

## Latest checkpoint — Vercel-compatible Next.js migration verified

- Replaced Vinext/Cloudflare hosting with Next.js 16.3.3 and React/React DOM 19.2.8. Convex remains the only active storage; app settings now come from process.env / ignored .env.local. Removed obsolete Vite/Sites/D1 source integration; old SQLite and migration SQL remain preserved, not used as fallback.
- Working pre-change source archive: `../outputs/before-vercel-migration-20260831.zip` (private; contains local settings). Do not upload or commit it. Original D1 data backup remains separately preserved.
- npm install initially hit EBUSY from retained Vinext dev session 10007. Stopped that session, then installation succeeded. Updated the vulnerable transitive undici within its allowed range. npm audit reports 0 known vulnerabilities.
- All 40 tests, TypeScript, and Next.js production build passed. New Next dev preview retained session 50410, http://127.0.0.1:3000 (localhost works too). HTTP homepage 200; full existing Convex integration test passed again without creating another case. Shared PIN throttle now keyed per role rather than trusting Cloudflare-specific IP headers on Vercel.
- Added Vercel config, private-file exclusions, deployment notes, README and configured-secret source scan. Scan passed across 123 source files; .env.local/.env/.dev.vars/.env.convex-bridge/.wrangler ignored.
- Created local Git main repository. Agent commands need per-command safe.directory scoped to this exact project because Codex Windows identities differ; no global trust change made. GitHub remote/upload and Vercel deployment not yet performed. Existing user terminal has valid GitHub/Vercel login; agent GitHub credential access previously failed. Do not ask for raw tokens or repeated login.
- Remaining: upload private GitHub repository, configure Vercel server settings securely, review private deployment and access approval, then verify deployed behavior/mobile. Convex still uses development deployment polite-sardine-31. Email/scheduler/real per-person authentication are not enabled.

## Latest migration checkpoint — app uses Convex, integration passed

- User approved restarting preview. Windows port lookup did not expose listener; vinext startup positively identified existing project server PID 15400. Stopped only that PID and restarted this project's dev server in retained session 10007 at localhost:3000, using `.dev.vars`.
- `scripts/test-convex-app.mjs` PASSED against the running app: services.storage=convex; discount/damage search; duplicate escalation; team cannot answer; founder PIN login; concurrent first-answer-wins; second independent request sees answer; one-off excluded from precedents; direct Convex persistence; stale CAS write rejected.
- One labeled Low-priority one-off `migration-convex-smoke-20260831` is retained in Convex. No real customer case changed. No emails sent. Convex now has the original 19 entries, original 2 cases plus this demo case, and original pending notices plus the demo answer notice. D1 remains the original revision-6 snapshot; do not silently fall back because new cloud writes are not in D1.
- Preview is still laptop-only and still Vinext/Cloudflare-based. GitHub upload and Vercel compatibility/deployment remain unfinished; dependency security review still required. Shared PIN remains demo-only security. No physical phone/browser-click test in this checkpoint.

## Migration checkpoint — import verified, preview restart needed

- User successfully deployed the prepared Convex functions. Agent TypeScript check passed.
- Confirmed source SQLite still exactly matched backup; imported revision 6 with 19 entries, 2 cases and 2 notices into Convex. Read-back matched backup byte-for-byte and SHA256. Unauthorized direct reads/writes rejected. All 40 existing tests pass.
- Added DATA_BACKEND=convex to ignored `.dev.vars` after verification. Added API `services.storage` and truthful footer labels.
- New `scripts/test-convex-app.mjs` checks search, duplicate escalation, PIN login, team denial, concurrent first-answer-wins, second-client read, one-off exclusion and cloud persistence. It FAILED at the first storage assertion: running server still reports `local-d1`. It stopped BEFORE creating any test record or submitting any PIN. Do not claim app reads/writes Convex yet.
- Next: restart only this project's localhost:3000 development server to reload `.dev.vars`; rerun integration test. It will create one labeled Low-priority one-off `migration-convex-smoke-20260831`. No email delivery, production publishing or GitHub upload performed. Old D1 remains intact but must not be used as a silent fallback after cloud writes begin.

## Migration checkpoint — paused at Convex build permissions

- Agent can access `polite-sardine-31` using the user's Convex login. `convex data` confirmed destination has no tables.
- Full local SQLite backup and JSON export created at `../outputs/migration-backups/20260831-012024/`: revision 6, 19 entries, 2 cases, 2 notices. Data SHA256 `799215c7b4d89518dab1b7b00320c9ecab0adb198bedfaaf5940de51f25a501c`. Original local DB untouched.
- Added Convex schema, secret-gated read/CAS/login-attempt functions, admin-only repeat-safe initial import, and server adapter. Existing D1 path remains active until DATA_BACKEND=convex is explicitly set. PIN and domain actions stay server-side; data remains in one JSON document with revision checks during this first migration.
- Generated private PRECEDENT_BRIDGE_SECRET in ignored `.dev.vars` and `.env.convex-bridge`; configured the same key on this Convex dev deployment. Never print or commit these files. CONVEX_URL configured in `.dev.vars`; no backend switch yet.
- `convex dev --once` FAILED in agent session: esbuild cannot read parent directory (`Access is denied`), then cannot resolve `convex/server` in its virtual config. No retry/bypass made. User must run the same command in their regular PowerShell or approve a supported permissions fix. Newly added adapter/functions have not yet passed typecheck or build. No data imported and no app publishing.
- After successful deployment: run `scripts/import-convex-backup.mjs` with the reviewed `app-state.json` path; verify imported content against backup, then enable Convex and test. Before final switch compare source data again for intervening changes. Retain D1 for rollback; do not silently fall back after a Convex write failure.

## In progress — user-requested GitHub / Vercel / Convex migration

- User explicitly requested moving this project to the GrowthX stack. Preserve the current local app and its saved state before switching storage or hosting. No production publishing has been approved yet.
- User PowerShell confirms GitHub `scentira` (SSH/keyring) and Vercel `scentira`, active team Scentira. Agent GitHub API calls still return 401 and Vercel check timed out. Do not make the user log in repeatedly or request raw credentials; account status is distinct from this session's access.
- User created Convex project `scentira-decision-tool` under `support's team`, development cloud deployment `polite-sardine-31` in US East. Screenshot confirms cloud URL `https://polite-sardine-31.convex.cloud` and HTTP actions URL `https://polite-sardine-31.convex.site`. Screenshot shows Never deployed: no app functions/data have been migrated.
- Next: install official Convex package, connect local CLI to the existing development project (pause for browser login), then implement/test the storage and Vercel compatibility changes. Preserve all precedent history, cases and notices, plus PIN protection and atomic first-answer-wins behavior. Do not publish a writable unprotected backend or commit secrets/data backups.

## Latest checkpoint — damaged-product guided checks

- Top search match for the unchanged Active damaged-product/no-unboxing-video rule now shows four questions, one at a time: customer photos, packing records, order/complaint history, evidence-based packing security. Includes blurry/unavailable/not-checked options, back navigation and answer summary. Evidence stays outside the app.
- Only team-confirmed insecure packing follows the existing replacement/refund exception. Secure or uncertain packing does not invent a decision or reject the customer. Unknown evidence remains unknown. No seed policy changed.
- Partial and complete answers carry into the existing escalation draft, labeled team-provided. Search edits/new searches clear answers; unrelated matches and revised/superseded policies do not reuse guidance.
- All 40 logic tests and TypeScript check passed; local homepage responds 200. Browser clicking not tested this turn. No real case submitted, no alerts sent, and local-only hosting limitations unchanged.

## Latest checkpoint — 1–10 previous orders clarified

- Gazal confirmed: 0 previous orders → 5% off; 1–10 previous orders → no discount; 11+ previous orders → 10% off. This overrides the earlier undefined 1–10 policy below.
- Saved Active replacement `discount-policy-2026-08-31`; prior policy preserved as Superseded. Follow-up answers and escalation context use the same thresholds.
- Running local app API confirms the new saved rule. All 34 tests passed, including the existing-store history update and exactly 10 vs 11 boundary. No browser interaction test this turn. Local-only demo limitations remain unchanged.

## Latest checkpoint — discount policy updated

- User-approved policy: first-time purchasers (0 previous orders) get 5% off; more than 10 previous orders (11+) get 10% off. Exactly 10 and 1–9 remain undefined and need founder guidance. Do not silently treat “more than 10” as “10+”.
- Saved current replacement `discount-policy-2026-08-30` in the local shared store; original entry 1 retained as Superseded with reciprocal links. Other entries, cases and notices preserved. Guarded, repeat-safe data update also handles a fresh store without overwriting later revisions.
- Additional-discount search asks for previous order count or unknown; the answer and applicable rule/gap carry into escalation. No general incomplete-input gate added.
- Verified running app API returns the new Active rule and old Superseded rule. All 33 tests, TypeScript check and production build passed. No browser interaction test this turn. Hosting remains deferred: existing local demo limitations and alerts/scheduler are unchanged.

## Latest checkpoint — feedback browser loop verified

- Tested the existing labeled violet-lantern demo rule only; no seed decisions edited.
- Team submitted a Low-priority outcome report. Founder unlocked via user input, opened the report, chose Clarify, entered revised decision/reasoning/exception and saved a required review reason.
- Verified the founder pending queue cleared; switched back to Team and reloaded. Search returned the new Active demo rule only, with the original wording attached as Superseded and the change reason displayed.
- Submitted situations shows Reviewed, the original reported outcome and RULE CLARIFIED with the founder's reason. One labeled feedback report and its demo replacement remain in local data.
- Email is still not connected, as disclosed by save notices. This test does not establish email delivery, automatic handoff, multi-device access or all review branches. Keep/replace and concurrent-review edge cases remain covered by domain tests, not this browser run.

## Latest checkpoint — approved forest design applied

- Applied the forest-green header, cream cards and coral attention accents to the live local app. Kept “Decision Precedent Tool”; removed “playbook” wording from the app.
- Shortened the search introduction, moved supporting rule text/history into expandable details, and made queue cards collapsed by default. Existing rule text, auth and domain behavior are unchanged.
- Demo setup and handoff simulation are grouped under a footer disclosure whose summary explicitly says alerts and automatic routing are off.
- Replaced the old overlapping product CSS and aligned shared light/dark tokens. No database records or backend files were changed for this redesign.
- TypeScript, all 25 rule tests and full production build passed. Local homepage returned HTTP 200. Visual/browser-click QA has not been performed for the redesign.
- Still local only; previously documented live-service and dependency-security blockers remain.

## Latest checkpoint — rule-outcome feedback

- Added “This decision didn’t work” to expanded current-rule cards in search and category browsing.
- Reports save the situation, actual outcome, submitter, chosen priority and a server-copied snapshot of the source rule in the existing shared state. No SQL schema change was needed.
- Policy reviews go to the founder queue, never timed CoS routing; the report form explains that urgent case decisions should use ordinary escalation separately.
- Founder can keep, clarify or replace, with a required review reason. Clarify/replace atomically retire the current version, publish a linked replacement and resolve the report. Keep leaves the library unchanged.
- Team can see the reported outcome and founder resolution. Duplicate retries are idempotent; stale concurrent reviews and non-founder resolution attempts are rejected server-side.
- 25 domain tests passed (16 existing + 9 feedback tests), TypeScript passed, full production build passed, localhost returned HTTP 200.
- New feedback browser clicks and saved-report API integration have NOT yet been tested. Earlier core escalation-to-precedent browser loop passed; one clearly labeled demo precedent remains in local data.
- Email, automatic scheduler and AI remain disconnected. Publishing is still deferred pending the previously recorded dependency-security findings and live-service setup; no hosted deployment has been made.
- Earlier checkpoints below are historical where contradicted by this checkpoint.

## Latest checkpoint — database recovery

- The JSX bracket and response type errors were corrected; TypeScript passed on the preceding turn.
- Diagnosed ENOMEM: Node `os.userInfo()` fails in this Windows execution environment; Drizzle's CLI tsx loader calls it for a temporary folder name. Physical RAM exhaustion is not established.
- Added scripts/generate-db.mjs using Drizzle's public API and Node's built-in TypeScript support. No dependency, OS function or security-setting patches. `npm run db:generate` now passes; generated and inspected drizzle/0000_initial_schema.sql and metadata for both expected tables.
- Added tests/domain.test.mjs: all 12 tests passed, covering seeds, search, empty input, idempotent escalation, one-hour routing, founder-only exclusion, role restrictions, first-answer wins, CoS review/promotion, supersession and queue order.
- Fixed broad public-risk matching and disallowed direct promotion of unreviewed CoS answers.
- Restarted dev server at http://localhost:3000/ (retained session 93272).
- Current home page HTTP 200. /api/state successfully returns 13 Active precedents, one Superseded precedent, zero submitted situations and team role.
- Browser interaction testing and end-to-end saved-decision testing are still pending. No successful final build or deployment exists. AI/email/scheduler remain unavailable as visibly disclosed.
- Earlier checkpoint details below are historical where superseded by this section.

## Current state

- Scaffolded with @openai/create-sites 0.3.0, shadcn and D1.
- Seed data deduplicated: 13 Active, one Superseded (12a), one No rule (6).
- First static slice returned HTTP 200 at localhost:3000 and was opened in Codex.
- Subsequent full UI is UNVERIFIED. It hit a JSX missing-brace error on line 74 of components/precedent-app.tsx; that bracket was corrected, but checks have not been rerun.
- The development server was stopped deliberately after the checks failed.
- Database schema, revision-checked shared-state mutations, PIN-based sessions, UI and routing endpoint are written but not validated end to end.
- Private generated local PINs/settings are in ignored .dev.vars and .env. A private access note is in the parent workspace outputs/demo-access.txt. Never commit those private files.
- No publishing or live email sending has occurred. No Sites project has been created remotely.

## Blocking checks and unfinished work

1. `npm run db:generate` failed: `uv_os_get_passwd returned ENOMEM (not enough memory)`. Cause is not confirmed; do not assume physical RAM is exhausted. User requested a pause on failed commands, so no retry has been made.
2. Rerun TypeScript checking after permission to continue. No successful full build exists.
3. npm audit returned 14 findings: 6 moderate, 8 high. Known fixes suggested for React Server DOM 19.2.8, vinext beta.8, Vite 8.2.2 and Cloudflare Vite plugin 1.54.2. Verify compatibility and release policy; do not run audit fix --force or downgrade drizzle-kit automatically.
4. AI, email and unattended routing are NOT connected. UI says so. /api/jobs requires JOB_SECRET and implements routing only; there is no live scheduler or delivery worker. Notification records are pending, not sent. Do not claim automatic retry or alerts work.
5. Validate server rules: prevent direct promotion of an unreviewed CoS answer; require review instead. Tighten public-risk keyword detection to avoid classifying ordinary public marketing language as a customer complaint. Test founder-only exceptions, concurrent answers, retried submissions, replacement conflicts, and promotion.
6. Check historical-link rendering after more than one replacement; it must resolve to the current rule rather than display a superseded rule as Active.
7. Add pure domain tests and local API tests. Verify database persistence and two-client refresh. Do not claim browser testing; none was requested/performed.
8. Generate and inspect database migrations once the database tool can run.
9. Link-preview subagent produced C:/Users/DELL/.codex/generated_images/01a052ca-e32c-7420-8f73-139955380b66/exec-15ddea46-200d-44a8-89ca-95611e8fd665.png. It reported correct title/brand/tagline. Root still needs to inspect and copy it to public/og.png and wire trusted-origin metadata.
10. Finish validation and follow Sites hosting only when safe. No deployable or shareable app exists yet.

## Critical product rules

- Public-escalation precedent #7: High priority, founder email only, NEVER CoS timeout routing, wait for founder.
- Other High cases: founder email then CoS after one unanswered hour. Medium/Low queue only.
- AI suggests priority but person must explicitly choose. Search is retrieval-only. Ordinary search text is never stored.
- First saved answer wins; notify the other decider. CoS original answer stays a one-off even when founder-approved future wording becomes a precedent.
- Separate founder and CoS PINs; CoS can answer only assigned cases and cannot publish precedents.
- All escalations shared; one-offs searchable only through submitted list, not the precedent search/library.
- Seed is origin, not status. Missing reasoning stays Not recorded; never invent policy.
