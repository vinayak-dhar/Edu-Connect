EduConnect — System Architecture

This document describes the system architecture for the EduConnect project: components, data flows, integrations (Clerk, Vonage, Google Apps Script), security, deployment, and operational guidance.

## High-level components
- Client (Browser): React/Next.js (App Router) — user-facing UI, server component rendering and client-side interactions.
- Next.js App Server: Server Components, Server Actions, middleware. Hosts server actions in `actions/` and pages in `app/`.
- Authentication: Clerk — user identity, session management, subscription plans.
- Video Service: Vonage Video (OpenTok-compatible) — session creation and client token generation.
- Database: PostgreSQL (via Prisma client) — persistent models: User, Appointment, Availability, CreditTransaction, Payout.
- External Scripts: Google Apps Script — support/contact integration (receives FormData/JSON).
- Admin & Operators: Manual processes for payouts (PayPal/Stripe), admin UI under `/admin`.

## Directory mapping (where logic lives)
- `actions/` — server actions (bookAppointment, generateVideoToken, payouts, credits allocation, admin operations).
- `lib/prisma.js` — single Prisma client.
- `app/(main)` — protected app routes, video-call UI, doctor pages.
- `components/` — UI components that call server actions (e.g., `appointment-card.jsx`).
- `prisma/schema.prisma` — data model.

## Core data model (Prisma summary)
- `User` — clerkUserId, credits, role (PATIENT, DOCTOR, ADMIN), verificationStatus.
- `Appointment` — patientId, doctorId, startTime, endTime, status, videoSessionId, videoSessionToken.
- `CreditTransaction` — userId, amount, type (CREDIT_PURCHASE, APPOINTMENT_DEDUCTION, ADMIN_ADJUSTMENT).
- `Payout` — doctorId, amount, credits, platformFee, netAmount, paypalEmail, status.

## Sequence: Booking an appointment (summary)
1. Client chooses slot and posts form to `bookAppointment` server action.
2. Server authenticates via `auth()` (Clerk), loads patient record from DB.
3. Server checks availability and overlapping appointments (DB queries).
4. Server creates a Vonage video session (`vonage.video.createSession`) and stores `sessionId` on Appointment.
5. Server deducts credits via `deductCreditsForAppointment()` (DB transaction creating two credit transactions, decrement/increment balances).
6. Server creates `Appointment` and calls `revalidatePath()` to update cached pages.
7. Client, when near appointment time, calls `generateVideoToken` server action to get signed token and joins via Vonage client SDK.

## Sequence: Monthly credits allocation
- On app load or in protected layout, app calls `checkAndAllocateCredits(user)` server action which:
  - Checks Clerk subscriptions via `auth().has({ plan })`.
  - If the current month doesn't have a transaction for the plan, creates a `CreditTransaction` and increments user's `credits`.
- Note: this is triggered lazily on user activity. For deterministic monthly allocation, use a cron job or cloud scheduler.

## Sequence: Payout flow
1. Doctor requests payout via `requestPayout()` (provides PayPal email) — a `Payout` with `status: PROCESSING` is created.
2. Admin reviews pending payouts via `getPendingPayouts()` and calls `approvePayout()` which:
   - Validates credits and, in a DB transaction, marks payout `PROCESSED`, decrements doctor credits, and creates `ADMIN_ADJUSTMENT` transaction.
3. Actual money transfer (PayPal/Stripe) is performed outside the app (manual or separate integration).

## Integrations — details and where they are used
- Clerk (Auth & Billing):
  - Client SDK for sign-in/out flows and UI widgets.
  - Server helpers `auth()` and `currentUser()` used in `actions/*` and `lib/checkUser.js` for mapping a Clerk user to local `User` record.
  - Subscription check: `auth().has({ plan: 'standard' })` used to allocate credits.

- Vonage (Video):
  - Server: uses `@vonage/auth` with `VONAGE_PRIVATE_KEY` and `NEXT_PUBLIC_VONAGE_APPLICATION_ID` to create sessions and generate client tokens.
  - Client: receives token & sessionId and connects to Vonage SDK for the video call page.
  - Secrets: private key must never be sent to the client; token generation is server-only.

- Google Apps Script:
  - Used for support contact; client sends FormData/JSON to deployed Apps Script web app URL.
  - Apps Script must implement `doGet/doPost` and be deployed as web app to accept requests.

## Security considerations
- Keep secrets server-side: `DATABASE_URL`, `CLERK_SECRET_KEY`, `VONAGE_PRIVATE_KEY`.
- All calls that mutate data or create tokens are server actions behind Clerk `auth()` or `currentUser()`.
- Use HTTPS and secure cookie/session config when deploying.
- Rate-limit or add abuse protection around video token generation and booking.

## Scaling & high-availability
- Next.js App: scale horizontally via multiple instances behind a load balancer (Vercel, AWS, Azure, or containerized).
- Database: use a managed PostgreSQL with read replicas, connection pooling (PgBouncer). Prisma must be configured for pool handling.
- Vonage: sessions and media are hosted by Vonage. Ensure region/latency considerations.
- Sessions: use sticky session or ensure tokens are stateless (Vonage tokens are independent of Next instances).

## Observability & ops
- Logging: server actions should log errors and important events (appointment created, token generated).
- Monitoring: use APM (Datadog/NewRelic) for server latency; monitor DB connections and queue size.
- Alerts: failures in `bookAppointment`, `generateVideoToken`, or DB transactions should generate alerts.

## Deployment checklist
- Environment variables (minimum):
  - DATABASE_URL
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - CLERK_SECRET_KEY
  - NEXT_PUBLIC_VONAGE_APPLICATION_ID
  - VONAGE_PRIVATE_KEY (newline characters escaped in env)
- Run `npx prisma generate` during build (already in `postinstall`).
- Ensure server can reach Vonage (no private network lockouts) and Google Apps Script URL is reachable by clients.

## Improvements & next work
- Integrate a payment gateway (Stripe) for one-time credit purchases and implement webhooks to create `CreditTransaction` records.
- Implement automated payout integration (Stripe Connect or PayPal Payouts) so `approvePayout()` triggers transfers.
- Add scheduled job (cron) for deterministic monthly credit allocations.
- Add end-to-end tests for `actions/*` and Prisma transactions.

---
### Diagram (component + booking sequence)

```mermaid
graph LR
  Browser[Client Browser]
  NextApp[Next.js App Server]
  Clerk[Clerk Auth]
  Postgres[(PostgreSQL via Prisma)]
  Vonage[Vonage Video Service]
  AppsScript[Google Apps Script]
  Admin[Admin Operator]

  Browser -->|signin / requests| Clerk
  Browser -->|calls server actions| NextApp
  NextApp -->|auth() / currentUser()| Clerk
  NextApp -->|Prisma queries| Postgres
  NextApp -->|create session / generate token| Vonage
  Browser -->|connect to session using token| Vonage
  Browser -->|support POST| AppsScript
  Admin -->|approve payouts| NextApp
  Admin -->|external payout| Admin

sequenceDiagram
  participant C as Client
  participant S as Next.js Server
  participant DB as Postgres
  participant V as Vonage
  participant CL as Clerk

  C->>S: bookAppointment(formData)
  S->>CL: auth() (verify user)
  S->>DB: check availability
  S->>V: createSession()
  V-->>S: sessionId
  S->>DB: create CreditTransactions and update credits (tx)
  S->>DB: create Appointment(sessionId)
  S-->>C: booking success
  C->>S: generateVideoToken(appointmentId)
  S->>CL: auth()
  S->>V: generateClientToken(sessionId)
  V-->>S: token
  S-->>C: token
  C->>V: join(sessionId, token)

```

---
For implementation questions or if you want, I can:
- Add a hosted-ready deployment template (Dockerfile + docker-compose) and a sample `.env.example`.
- Scaffold Stripe checkout + webhook handlers to issue credits automatically.

File: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
