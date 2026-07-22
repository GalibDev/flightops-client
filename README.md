# FlightOps

### Manage flights. Simplify operations.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Stripe](https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel)](https://flightops-client.vercel.app/)

FlightOps is a full-stack airline operations and flight discovery platform built for travellers, flight operators and administrators. Travellers can discover routes, review complete flight information and reserve seats through Stripe Checkout. Operators can publish and manage flight listings, while administrators control users, approvals, bookings, payments, messages and audit activity from one workspace.

## Live project

- **Live application:** [flightops-client.vercel.app](https://flightops-client.vercel.app/)
- **Frontend repository:** [GalibDev/flightops-client](https://github.com/GalibDev/flightops-client)
- **Server repository:** [GalibDev/flightops-server](https://github.com/GalibDev/flightops-server)

## Project screenshots

### Landing page

![FlightOps landing page](docs/screenshots/home.png)

### Flight explorer

![FlightOps flight explorer with search and filters](docs/screenshots/explore-flights.png)

### Flight details and booking

![FlightOps flight details and booking page](docs/screenshots/flight-details.png)

## Core capabilities

### Public experience

- Responsive landing page with an animated hero slider, destination carousel, operational statistics, benefits, call-to-action and other meaningful sections
- Site-wide bilingual AI travel assistant powered through a secure server-side WalkAI integration
- Flight explorer with search, airline and cabin-class filtering, price filtering, sorting and pagination
- Consistent flight cards with image, route, schedule, fare, availability and details action
- Public flight details with an image gallery, itinerary, duration, aircraft, baggage allowance, seat availability and related routes
- Professional About, Contact, Privacy Policy and Terms & Conditions pages
- Skeleton, loading, empty, error and toast feedback states

### Authenticated user experience

- Registration and login with validation, clear error messages and demo access
- JWT session stored in a secure HTTP-only cookie
- Personal operations dashboard with live MongoDB-backed statistics and Recharts visualisations
- Protected flight submission form with searchable suggestions, free-text airline entry and drag-and-drop image support
- Personal flight management with view and delete actions
- Seat reservation and secure Stripe-hosted test checkout
- Verified contact messages that automatically use the signed-in user's name and email

### Administrator experience

- Dedicated role-protected Admin Center
- User search, role changes, block/unblock and account deletion
- Flight review with approve, reject and delete actions
- Booking status management and payment monitoring
- Contact inbox with sender identity, read/unread state, reply shortcut and deletion
- Persistent audit log for privileged administrative actions
- Operational overview calculated from current database records

## Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router, React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, responsive CSS animations |
| Forms and validation | React Hook Form, Zod |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT with `jose`, HTTP-only cookies, bcryptjs |
| Payments | Stripe Checkout and signed webhooks |
| Charts | Recharts |
| UI feedback | Lucide React, Sonner |
| Deployment | Vercel |

## Application architecture

```text
Browser
  |-- Public pages and flight discovery
  |-- Protected user workspace
  |-- Role-protected Admin Center
  |
Next.js App Router
  |-- React server/client components
  |-- Typed route handlers under /api
  |-- Cookie-based route protection
  |
  |-- MongoDB Atlas: users, flights, bookings, payments,
  |                  messages and audit logs
  `-- Stripe Checkout: payment session and webhook confirmation
```

The project uses a unified Next.js application: UI pages and server-side API route handlers live in the same TypeScript codebase. MongoDB stores persistent business data, while Stripe webhooks provide the authoritative payment result.

## Main routes

| Access | Route | Purpose |
|---|---|---|
| Public | `/` | Landing page |
| Public | `/flights` | Search, filter, sort and paginate flights |
| Public | `/flights/[id]` | Flight details and related routes |
| Public | `/about`, `/contact` | Company information and contact form |
| Public | `/login`, `/register` | Authentication |
| Public | `/privacy`, `/terms` | Legal pages |
| User | `/dashboard` | Operations overview and charts |
| User | `/flights/add` | Submit a flight |
| User | `/flights/manage` | Manage submitted flights |
| User | `/flights/[id]/book` | Reserve seats and start checkout |
| Admin | `/admin` | Complete administration workspace |

Important API groups include `/api/auth/*`, `/api/flights/*`, `/api/bookings`, `/api/contact`, `/api/dashboard/stats`, `/api/admin/*` and `/api/stripe/*`.

## Database models

- **User:** identity, password hash, role and account status
- **Flight:** route, airline, schedule, fare, capacity, media, owner and approval status
- **Booking:** passenger details, seats, total amount and booking/payment state
- **Payment:** Stripe identifiers, amount, method and settlement state
- **ContactMessage:** verified sender, subject, message and read state
- **AuditLog:** administrator, action, target and timestamp

## Local development

### Prerequisites

- Node.js latest LTS
- npm
- MongoDB Atlas database
- Stripe test-mode account for payment testing

### Installation

```bash
git clone https://github.com/GalibDev/flightops-client.git
cd flightops-client
npm install
```

Copy `.env.example` to `.env.local`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure the following values:

```env
MONGODB_URI=mongodb+srv://DATABASE_USER:DATABASE_PASSWORD@CLUSTER/flightops
JWT_SECRET=use-a-long-random-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_BASE_URL=https://walkai.top
ANTHROPIC_AUTH_TOKEN=sk-...
ANTHROPIC_MODEL=your-enabled-model-id
```

Never commit `.env.local` or expose database, JWT or Stripe secret keys in client-side code.

The chatbot calls WalkAI's Anthropic-compatible `/v1/messages` endpoint only from the server route. Use the exact model ID enabled for your WalkAI key; the display name shown in the WalkAI dashboard may differ from its API model ID. Claude Code-only settings such as `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` and `CLAUDE_CODE_ATTRIBUTION_HEADER` are not required by the deployed chatbot.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

| Role | Email | Password |
|---|---|---|
| User | `user@flightops.com` | `User123!` |
| Admin | `admin@flightops.com` | `Admin123!` |

Demo accounts provide quick evaluation access. Newly submitted regular-user flights remain pending until an administrator approves them.

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimised production build |
| `npm start` | Run the production build |
| `npm run typecheck` | Validate TypeScript types |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed flight data into MongoDB |
| `npm run seed:admin` | Seed stable admin demonstration records |

Before submitting or deploying a change, run:

```bash
npm run typecheck
npm run lint
npm run build
```

## Stripe test checkout

1. Add Stripe test keys to the environment variables.
2. Create a webhook endpoint for `https://YOUR_DOMAIN/api/stripe/webhook`.
3. Subscribe it to the Checkout completion and payment events used by the application.
4. Add the generated `whsec_...` signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Redeploy after changing production environment variables.

Use Stripe test cards only while the project is configured with `pk_test_` and `sk_test_` keys. No raw card details are stored by FlightOps.

## Vercel deployment

1. Import the `flightops-client` GitHub repository into Vercel.
2. Add all variables from `.env.example` in **Project Settings > Environment Variables**.
3. Set `NEXT_PUBLIC_BASE_URL` to the production domain.
4. Ensure MongoDB Atlas Network Access allows the deployment to connect and the database user has the required permissions.
5. Deploy, configure the Stripe webhook, add its signing secret, then redeploy once more.

## Security notes

- Passwords are hashed before storage.
- Authentication tokens are stored in HTTP-only cookies.
- Protected routes require a valid session; admin APIs additionally verify the admin role.
- Request payloads are validated before database operations.
- Stripe webhook signatures are verified before payment records are updated.
- Administrative mutations create audit records.

## Project status

FlightOps is feature-complete for demonstration and academic submission use. Live airline inventory, production payment processing and transactional email delivery require separate production provider accounts and credentials.
