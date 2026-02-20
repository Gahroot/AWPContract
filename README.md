# AWP Contracts

A contract management system for Advanced Window Products. Sales teams use it to create, manage, and digitally sign sales contracts, addendums, and change orders — complete with automatic pricing calculations, PDF generation, and HubSpot CRM integration.

## What's Inside

- **Contract Builder** — Create sales contracts with line items, auto-calculated pricing based on window dimensions and addons
- **Addendums & Change Orders** — Modify existing contracts with full audit trail
- **Digital Signatures** — Customers sign right in the browser, no printing needed
- **PDF Generation** — Professional PDFs for contracts, addendums, and change orders
- **Commission Tracking** — Flat rate, per-salesperson, or tiered commission models
- **HubSpot Sync** — Push contracts, contacts, and deals to your CRM
- **Role-Based Access** — Admin and Salesman roles with appropriate permissions

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript 5 |
| Runtime | Bun + Turbopack |
| Database | PostgreSQL 17 via Prisma 7 |
| Auth | Auth.js v5 (next-auth) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Forms | React Hook Form + Zod v4 |
| PDFs | @react-pdf/renderer |
| CRM | HubSpot SDK |
| Testing | Vitest |

---

## Local Development Setup

### Prerequisites

You'll need these installed on your machine:

- [Bun](https://bun.sh) (v1.1+) — our package manager and runtime
- [Docker](https://docs.docker.com/get-docker/) — for the PostgreSQL database
- [Git](https://git-scm.com/)

### 1. Clone and Install

```bash
git clone <your-repo-url> awp-contracts
cd awp-contracts
bun install
```

### 2. Start the Database

We use Docker to run PostgreSQL locally so you don't have to install it yourself.

```bash
docker compose up -d
```

This spins up a PostgreSQL 17 instance on port `5432` with:
- **User:** `awp`
- **Password:** `awp_dev_2026`
- **Database:** `awp_contracts`

You can check it's running with `docker compose ps`.

### 3. Set Up Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://awp:awp_dev_2026@localhost:5432/awp_contracts"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="pick-something-random-and-long"

# Optional — only needed if you want HubSpot integration
HUBSPOT_ACCESS_TOKEN="your-hubspot-token"
```

> For `NEXTAUTH_SECRET`, you can generate a good one with `openssl rand -base64 32`.

### 4. Push the Schema and Seed the Database

```bash
bun run db:generate    # Generate the Prisma client
bun run db:push        # Push the schema to PostgreSQL
bun run db:seed        # Create demo users
```

This gives you two accounts to play with:

| Email | Password | Role |
|-------|----------|------|
| `admin@awp.com` | `admin123` | Admin |
| `sales@awp.com` | `sales123` | Salesman |

### 5. Start the Dev Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in. That's it — you're up and running.

### Useful Commands

| Command | What it does |
|---------|-------------|
| `bun run dev` | Start dev server with Turbopack (hot reload) |
| `bun run build` | Production build |
| `bun run start` | Start the production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript type checker |
| `bun run test` | Run tests with Vitest |
| `bun run test:watch` | Run tests in watch mode |
| `bun run db:studio` | Open Prisma Studio (database GUI in your browser) |
| `bun run db:push` | Push schema changes to the database |
| `bun run db:generate` | Regenerate the Prisma client after schema changes |

---

## Deploying to Railway

[Railway](https://railway.app) is probably the smoothest option here — it handles both the app and the database in one place, so there's less to wire together.

### 1. Create a Railway Project

- Sign up / log in at [railway.app](https://railway.app) and create a new project
- Click **"New Service" > "Database" > "PostgreSQL"** to add a Postgres instance
- Railway will give you a `DATABASE_URL` — you'll need that in a moment

### 2. Add Your App

- Click **"New Service" > "GitHub Repo"** and connect your repository
- Railway auto-detects it's a Next.js app

### 3. Set Environment Variables

In your app service's **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Use `${{Postgres.DATABASE_URL}}` to reference the DB service directly |
| `NEXTAUTH_URL` | `https://your-app.up.railway.app` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `HUBSPOT_ACCESS_TOKEN` | *(optional)* Your HubSpot token |

> **Tip:** Using `${{Postgres.DATABASE_URL}}` keeps the connection string in sync automatically — if you ever change the DB, you don't have to update it manually.

### 4. Set the Build & Start Commands

In your service's **Settings**:

- **Build Command:** `bun install && bun run build`
- **Start Command:** `bun run start`

### 5. Initialize the Database

After your first deploy, open the Railway **shell** for your app service and run:

```bash
bunx prisma db push
bun run db:seed        # optional — creates demo users
```

### 6. That's It

Push to your connected branch and Railway builds and deploys automatically. Your app will be live at the Railway-provided URL, or you can hook up a custom domain in the service settings.

---

## Deploying to Vercel

[Vercel](https://vercel.com) is made by the Next.js team, so it's a natural fit. The one catch is that Vercel doesn't include a database — you'll need to bring your own PostgreSQL.

### 1. Get a Database

Pick any hosted PostgreSQL provider. Some solid free-tier options:

- [Neon](https://neon.tech) — serverless Postgres, generous free tier
- [Supabase](https://supabase.com) — free tier with managed Postgres
- [Railway](https://railway.app) — just spin up a standalone Postgres service
- Any other provider that gives you a `postgresql://` connection string

### 2. Deploy to Vercel

**Option A — Via the dashboard:**

Go to [vercel.com/new](https://vercel.com/new), import your GitHub repo, and Vercel auto-detects Next.js.

**Option B — Via the CLI:**

```bash
bun add -g vercel
vercel
```

Follow the prompts and you're deployed.

### 3. Set Environment Variables

In your Vercel project's **Settings > Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `HUBSPOT_ACCESS_TOKEN` | *(optional)* |

### 4. Verify Build Settings

Vercel usually picks these up automatically, but double-check in **Settings > General**:

- **Framework Preset:** Next.js
- **Build Command:** `bun run build` *(this runs `prisma generate` automatically)*
- **Install Command:** `bun install`

### 5. Initialize the Database

From your local machine, point at the production database and push the schema:

```bash
DATABASE_URL="your-production-connection-string" bunx prisma db push
DATABASE_URL="your-production-connection-string" bun run db:seed   # optional
```

### 6. You're Live

Push to your main branch and Vercel deploys automatically. You also get free preview deployments for every pull request.

---

## Deploying to Netlify

[Netlify](https://netlify.com) supports Next.js through their [Next.js Runtime](https://docs.netlify.com/frameworks/next-js/overview/). Like Vercel, you'll need to bring your own database.

### 1. Get a Database

Same deal as Vercel — pick a hosted PostgreSQL provider ([Neon](https://neon.tech), [Supabase](https://supabase.com), etc.) and get your connection string.

### 2. Deploy to Netlify

**Option A — Via the dashboard:**

Go to [app.netlify.com/start](https://app.netlify.com/start), click **"Import an existing project"**, and connect your GitHub repo. Netlify detects Next.js automatically.

**Option B — Via the CLI:**

```bash
bun add -g netlify-cli
netlify init
netlify deploy --build --prod
```

### 3. Set Environment Variables

In **Site settings > Environment variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `NEXTAUTH_URL` | `https://your-site.netlify.app` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `HUBSPOT_ACCESS_TOKEN` | *(optional)* |

### 4. Set Build Settings

In **Site settings > Build & deploy > Build settings**:

- **Build command:** `bun run build`
- **Publish directory:** `.next`

### 5. Initialize the Database

From your local machine:

```bash
DATABASE_URL="your-production-connection-string" bunx prisma db push
DATABASE_URL="your-production-connection-string" bun run db:seed   # optional
```

### 6. Ship It

Push to your connected branch and Netlify handles the rest.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Your app's public URL (e.g., `https://contracts.yourcompany.com`) |
| `NEXTAUTH_SECRET` | Yes | Random string for encrypting sessions. Generate with `openssl rand -base64 32` |
| `HUBSPOT_ACCESS_TOKEN` | No | HubSpot private app token — only needed for CRM sync features |

---

## Project Structure

```
src/
├── app/                  # Next.js App Router (pages + API routes)
│   ├── (auth)/login/     # Login page
│   ├── (dashboard)/      # Protected routes (contracts, commissions, settings)
│   ├── contracts/        # Public routes (customer signing, contract viewing)
│   └── api/              # REST API (contracts, pricing, commissions, hubspot)
├── components/           # React components (contracts, commissions, shared, ui)
├── lib/                  # Business logic (pricing, auth, db, pdf, hubspot)
├── types/                # TypeScript type augmentations
└── generated/prisma/     # Prisma generated client
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Seed script
```

## License

Proprietary — Advanced Window Products.
