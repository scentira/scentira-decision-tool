# Discount flow — local verification, 31 August 2026

Milestone 1 implemented locally. No deployment, database writes or messages sent.
Saved discount policy unchanged: 0 → 5%, 1–10 → none, above 10 → 10%.

## Changed in this task

- `components/discount-decision.tsx`: explicit count confirmation, checked result,
  editable reply, invalidation of old decisions/drafts, stale-response protection.
- `components/public-demo.tsx`: fictional count-driven flow, collapsed reference
  and escalation/feedback, no-match escalation retained.
- `components/staff-follow-up.tsx`: same presentation using authenticated guide;
  checked context retained for staff escalation, cleared when count changes.
- `components/precedent-app.tsx`: follow-up first, reference and supporting actions
  collapsed; library rule text explicitly labelled as a reference, not an outcome.
- `lib/demo-discount.ts`: standalone fictional example, no private policy imports.
- `lib/public-demo.ts`: replaces unconditional first-purchase answer with a conditional reference.
- `lib/discount-guide.ts`: supplied-count explanation and reply draft; policy boundaries unchanged.
- `app/product.css`: sage-green decision hero, one primary action, compact search after result.
- `tests/demo-discount.test.mjs`: count boundaries, invalid/unknown inputs, matching replies.
- `DISCOUNT_FLOW_SCOPE.md` and this report.

Earlier public-demo safety changes remain in the working tree; they were not deployed.

## Executed results

```text
npm test: tests 48, pass 48, fail 0
npm run build: compiled successfully; TypeScript passed; 6/6 pages generated
test-public-demo.mjs: checks 34, passed 34, failed 0
publicWritesDenied: true; privateRecordsReturned: false
check-public-assets.mjs: passed true; filesScanned 24
privateNamesPoliciesOrSecretsFound: false
git diff --check: exit 0 (line-ending warnings only)
```

## Browser checks

Actual `innerWidth` verified at 390 and 1440 pixels, height 1000.
At both widths: 0, 1, 10, 11 and 12 produce the expected outcomes only after
Check decision; unknown requests history rather than selecting a discount;
reply draft opens and can be edited; no-match escalation finishes with nothing sent;
Founder and CoS show PIN gates. No horizontal overflow, no undersized visible controls,
and the situation input center is not covered by another element.

Additional mobile checks: entering 12 alone did not issue an answer; negative input
was rejected; changing count removed the answer and edited draft; editing search
removed the old answer; expanded feedback controls meet 44px minimum and produce
only a local preview notice. Precedent and escalation details are initially collapsed.

Screenshots captured from the real local app, not generated mockups:
`../outputs/discount-decision/mobile-390.png` and
`../outputs/discount-decision/desktop-1440.png`.

## What protects private data

Logged-out state uses three explicit fictional fixtures without reading private
storage. Public writes and private guide calls are rejected server-side. Staff
sessions require a valid signed, unexpired cookie. Real policy logic remains behind
the authenticated guide route, not imported into browser code. Reply preparation
has no save/send endpoint. The compiled browser asset scan passed.

## Limits / next verification

Real Founder/CoS login and their private guide network flow were not exercised in
the browser this turn. Their policy logic was unit-tested, and anonymous/forged
access was HTTP-tested. Verify that signed-in flow locally before deployment.
No claim of order-system verification: counts are supplied by the user.
Other decision types were not expanded into new guided flows in this milestone.

## Milestone 2 — basis before headline

Changed `components/discount-decision.tsx`, `lib/demo-discount.ts`,
`lib/discount-guide.ts`, `app/product.css`, `tests/demo-discount.test.mjs`
and the scope/verification notes. The entered count now appears above the headline.
Alternative branches appear below WHY. Staff results explicitly say Scentira’s
rule and contain no fictional/demo text; staff counts remain honestly labelled
team-provided, not independently verified.

Executed: 50/50 unit tests, build including TypeScript, 34/34 public HTTP checks,
and browser-asset privacy scan (24 files) passed. Browser measurements at 390 and
1440 confirmed `basisAboveHeadline: true` and `overflow: false`.
Screenshots: `../outputs/discount-decision/basis-390.png` and `basis-1440.png`.
Staff wording was tested at the guide-data level, not through a real staff login.
Saved 11+ / 10% policy preserved; no new escalation requirement, writes or deployment.

## Milestone 3 — user-authorised correction to 10+

This correction supersedes milestones 1–2: 0 → 5%, 1–9 → none, 10+ → 10%.
WHY now records the founder’s supplied judgment (earn a second order; recognise
contribution at 10+; no additional discount in between). Demo wording stays fictional.

Updated policy/version/history, staff guide, fictional guide/reference, regression
tests and privacy scan. Authenticated reads apply the exact recognised old-policy
correction in memory so reference and guide agree without writing on a read.
The existing authorised mutation path will persist the versioned correction on a
future staff write. No staff writes were executed in this task.

Results: 51/51 unit tests, production build including TypeScript, 34/34 public access
checks, and privacy scan of 24 compiled files passed. Browser tests at 390 and 1440
confirmed 9 → none, 10 → 10%, 11 → 10%; no horizontal overflow. WHY inspected in DOM.
Screenshots: ../outputs/discount-decision/corrected-ten-390.png and corrected-ten-1440.png.
Real staff login remains untested in browser; staff guide wording and history correction
were unit-tested. No live database changes or deployment.

## Founder browser verification — completed after user sign-in

On http://localhost:3000, actual Founder session confirmed. Staff search asked for
order count before answering. Tested 9 → no discount, 10 → 10%, 11 → 10% through
the authenticated guide. WHY contained Scentira’s rule and founder judgment, with
no demo/fictional language. Customer reply opened and accepted a local edit; no
record was submitted or saved. At 390 and 1440px: basis above headline, no horizontal
overflow. CoS switch correctly requested its own PIN; verification awaits user sign-in.
This supersedes the earlier limitation about Founder login. No deployment.

## CoS browser verification — completed after user sign-in

Actual CoS session verified on localhost:3000. The role is selected and Founder-only
Manage precedents navigation is absent. Discount flow asked for count before answering.
Tested 0 → 5%, 9 → none, 10 → 10%, 11 → 10%; unknown → check order history first.
Reply draft opened and accepted an edit without sending/saving. WHY contains Scentira’s
rule and founder judgment, no demo/fictional wording. At 390/1440px: no horizontal
overflow, basis above headline, and no undersized visible button/summary/input targets.
Screenshots: ../outputs/discount-decision/cos-verified-390.png and cos-verified-1440.png.
Founder and CoS local browser checks are now complete. No records submitted, no deployment.

## Deployment — user approved

Vercel Preview deployed successfully (READY):
https://scentira-decision-tool-r26u2ac4c-scentira.vercel.app
Deployment ID: dpl_EBm7T6MqhL1GRjXa5nenZ2LwCbUQ.
Live unauthenticated checks: page/state HTTP 200, exactly 3 fictional entries,
0 cases, readOnly true, private/no-store caching. State and guide POST probes returned
401. Browser checks: Founder/CoS PIN gates, discount search, 10 orders → 10%.
No real records submitted. Screenshot: ../outputs/discount-decision/live-deployed.png.

IMPORTANT: old deployment scentira-decision-tool-ejgxpck8e-scentira.vercel.app
still returns non-demo entries anonymously (18 entries in read-only check).
Asked user permission to delete this exact obsolete deployment; not removed yet.
New deployment does not automatically disable old immutable URLs.

## Old deployment retired — user approved

Deleted only dpl_GVZVf694uqVe2YYPGsyv5g2YnUDf
(scentira-decision-tool-ejgxpck8e-scentira.vercel.app) after inspecting its identity.
Vercel confirmed exactly one deployment removed. Follow-up: old /api/state HTTP 404;
new /api/state HTTP 200, mode demo, exactly 3 fictional entries, readOnly true.
The earlier pending-removal warning is resolved for this exact URL.
Project, source files and Convex database were not deleted.
