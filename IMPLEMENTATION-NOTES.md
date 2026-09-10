# NCA Daywork update

The updated project is a separate working copy of the supplied local repository. The original checkout and any production database were not modified. The initial update was pushed to GitHub by the owner; this revision does not deploy a live site.

## Implemented

- A shared responsive interface for landing, authentication, crew profiles, dashboards, job search, posting, editing, matching, contact lists, applications, account settings and issue reporting.
- Required structured profile fields: primary/additional positions, photo, travel distance, availability modes, eligible countries, work types, experience, yacht-size experience, rates and contact preferences.
- Up to three accepted positions, controlled departmental skill tags, required CV/STCW/ENG1/references/passport and optional named certificates. Document metadata is returned separately from files; profile files are capped at 5 MB each and 12 MB total.
- Country/city/port suggestions use the existing location database. Known ports resolve server-side coordinates. Without reliable coordinates, matching conservatively requires the same city; it does not guess distances.
- Profile-first matching with date coverage, role aliases, country aliases, active/fresh profiles, declared work eligibility, work types and required certificate uploads. Certificates are described as uploaded, not independently verified.
- Atomic contact limits of 5 for one crew, 8 for two, 12 for three to five. Jobs needing more than five require NCA intervention; self-service contact access is disabled for those jobs.
- Job ownership checks, private contact/file endpoints, passport isolation, crew introduction notifications and hiring outcomes. Contact access ends immediately on closing/filling/cancelling or date expiry. Closed contact history exposes names and outcome controls, not phone/email/CVs.
- In-app follow-up after the scheduled job end plus 24 hours, checked daily. The PDF's follow-up timing sentence was incomplete; this implementation uses job end, not posting time.
- Availability reminders after 30 days without login/profile updates, followed by seven full days before inactivity, following the latest supplied letter. In-app notices persist and failed notification emails retry hourly.
- Application submission, deduplication, tracking, status management and authenticated CV download. Direct applicants explicitly provide a CV through a separate application flow. Access to application contact details/files closes with the job.
- Job details can be edited before applications or contacts exist. Once crew activity exists, employers close the old job and post a new one so requirements cannot silently change beneath an introduction.
- Issue reports are persisted and emailed to NCA when SMTP is available; delivery success is recorded. Failed issue emails remain in the database for staff retry/review.
- Email verification is enforced even when SMTP is missing. Registration does not issue a usable JWT. Verification/reset codes have validation and expiry; password changes invalidate existing tokens. Missing-code password reset bypasses and the unauthenticated résumé route were fixed.
- Public job DTOs exclude employers, companies, contact lists, applications and document bytes. Job-update allowlists prevent ownership changes or contact-quota tampering. Staff-only location mutations and removal of public database-test routes.
- Dependencies updated; the final npm audit reports zero known vulnerabilities. This is a point-in-time dependency check, not a security certification.

## Validation

- Node integration tests use a disposable MongoDB server and exercise real HTTP requests and persistence, including concurrent contact selection and document authorization.
- Matching tests cover aliases, full date coverage, stale/ineligible profiles, unknown distances and public-response privacy.
- Browser checks at 1440px and 390px covered sign-in, job posting, matching, contact selection, mobile navigation, profile upload/save, browsing, applying and application status. No JavaScript errors or horizontal overflow were found in those checked flows.

## Remaining launch decisions and setup

1. Supply production MongoDB, SMTP and a random JWT secret; configure the allowed origin and staff accounts. Live email/SMS delivery has not been tested with real provider credentials.
2. Finalize the legal entity, address, effective date, jurisdiction and privacy policy. Source terms are preserved as visibly labelled drafts. The PDF has no completed privacy policy. Draft legal text has not been independently reviewed.
3. Connect billing and implement subscription entitlement enforcement, payment webhooks, renewals/refunds and authorized additional vessel users. The price page reflects the PDF, but there is no payment collection or subscription enforcement in this update. Automatic employer approval is the default; staff can enable manual approval and review vessel identity. Email verification remains required.
4. Establish retention/deletion policy, staff document/eligibility verification, operational issue review, backups and production monitoring. Revoking portal access cannot retract files already downloaded by a hiring party.
5. Existing profiles lacking the newly required fields are directed back to profile completion. Jobs lacking dates are excluded from live opportunities; review and replace those legacy postings rather than inventing dates.
6. Load/verify location data before relying on travel-distance matching. No external geocoder or live port API was exercised during verification.

Optional résumé-keyword/swipe ranking, reviews, completed-job reputation ranking, billing and a staff analytics/export console are not implemented. Matching uses structured profile data only. Large-scale load tests and production-provider end-to-end tests remain outstanding.

## Latest requested revision

- Grey, orange and white branding, tactile cards/buttons, scrollable sidebar and mobile close control.
- Employer signup uses account, vessel and review steps; crew profiles use five shorter sections.
- Uploaded crew photos appear in the profile identity panel, signed-in header and employer match cards. Photo changes preview before saving.
- Separate crew (23 sections) and employer (36 sections) terms preserve the latest pasted source with numbered headings, paragraphs and lists.
- Preselection notices use the supplied wording and omit vessel identity. The full supplied reminder letter is used for email.
- Staff-only approval settings and audited decisions; pending/rejected accounts are blocked on the server. Vessel identity changes in manual mode return accounts to review.
- Browser verification covered signup, both legal documents, photo upload/save, notifications, short-screen sidebar scrolling, mobile navigation and staff mode switching.
