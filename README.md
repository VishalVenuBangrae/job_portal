# Nauti Crew Agency Daywork

Node/Express + MongoDB, with a responsive vanilla HTML/CSS/JavaScript frontend. See [IMPLEMENTATION-NOTES.md](IMPLEMENTATION-NOTES.md) for the changes, validation, migration behavior and launch requirements.

## Local preview with sample data

Requires Node.js 20.19+ (tested with Node 22).

```sh
npm ci
npm run preview
```

Open http://127.0.0.1:8080. Preview creates a **disposable database**, not your configured database. Its data is lost when the preview process exits. On the first run, mongodb-memory-server downloads a MongoDB executable (the Windows archive is approximately 781 MB); keep the development dependencies installed.

| Account  | Email                 | Password        |
| -------- | --------------------- | --------------- |
| Employer | employer@example.test | PreviewOnly123! |
| Crew     | crew@example.test     | PreviewOnly123! |
| Staff    | admin@example.test    | PreviewOnly123! |

All jobs, people and documents in this preview are sample data. Email delivery is suppressed. These accounts are never created by `npm start`.

## Run against your own database

```sh
npm ci
```

Copy `.env.example` to `.env`, set `MONGO_URL`, a random `JWT_SECRET` of at least 32 characters, and SMTP credentials. Then:

```sh
npm start
```

Registration requires functioning SMTP for email verification. Startup fails clearly if the database or JWT configuration is missing. Use HTTPS and set `NODE_ENV=production` plus `ALLOWED_ORIGIN` for deployment. Do not use preview credentials or its test environment in production.

The app serves the `public/` directory. The old `client/build` is not the active frontend. The shared UI is in `public/portal.js`, `public/portal-enhancements.js` and `public/portal.css`.

## Employer approval and notifications

Automatic approval is enabled by default; email verification is still required. Set `ADMIN_EMAILS` to trusted staff email addresses. Those accounts see **Employer approvals**, where staff can review vessel name, call sign/MMSI and choose automatic or manual approval. Manual mode blocks pending/rejected employers from hiring tools. Recorded approvals are preserved; legacy accounts without a recorded decision require review in manual mode. Changing vessel identity in manual mode requires another review.

Set `APP_URL` to the public HTTPS address for email links. Crew receive preselection notices in Notifications and by email. After 30 days without a login/profile update, the supplied reminder email gives seven further days before automatic inactivity. Failed notification emails remain queued for hourly retry. SMTP credentials are required for actual delivery.

Terms are separately formatted for crew and employers from `content/terms-source.txt`; rebuild with `python scripts/build-terms.py`. Bracketed legal placeholders still need final details.

## Checks

```sh
npm test
npm run test:unit
npm run security:check
```

`npm test` starts an isolated MongoDB instance. It never connects to `MONGO_URL`. Unit tests do not need MongoDB. Existing external port/API scripts remain available but are not part of the deterministic test suite.

## Core routes

- `/api/v1/auth`: registration, verification, login, password reset/change, authenticated account details and vessel identity.
- `/api/v1/profile`: own crew profile, availability status and own document downloads.
- `/api/v1/jobs`: public job summaries; employer-owned posting/editing; crew applications.
- `/api/v1/jobs/:id/matches`: employer-owned structured matches.
- `/api/v1/jobs/:id/contacts`: limited, job-specific contact access.
- `/api/v1/portal`: options, notifications, introductions and private issue reporting.
- `/api/v1/locations`: existing location catalog; staff-only mutations.

## Before launch

SMTP, production data, final legal/privacy text and subscription billing/entitlement enforcement are still required. Do not treat the sample pricing page as an implemented payment system. Review the detailed launch checklist in [IMPLEMENTATION-NOTES.md](IMPLEMENTATION-NOTES.md).
