# Scentira Decision Precedent Tool

An internal demo for searching past decisions, escalating new situations, and
recording founder or chief-of-staff answers.

- Next.js runs the screens and protected server routes.
- Convex stores shared precedents, their history, submitted situations, and pending notices.
- Founder and CoS views use separate server-checked demo PINs.

Use `npm install`, `npm run dev`, `npm test`, and `npm run build` for local work.
See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel settings and safety limitations.

Email delivery and unattended routing are not enabled. Shared PINs are not
production authentication. Never commit private environment files or data backups.
