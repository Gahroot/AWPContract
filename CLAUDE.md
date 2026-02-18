# AWP Contracts

Contract management system for Advanced Window Products — enables sales teams to create, manage, and digitally sign sales contracts, addendums, and change orders with built-in pricing calculation, PDF generation, and HubSpot CRM integration.

## Tech Stack

Next.js 16 + React 19 + TypeScript 5 | Bun + Turbopack | Prisma 7 + PostgreSQL 17 | Auth.js v5 | Zod v4 + React Hook Form | Tailwind v4 + shadcn/ui | @react-pdf/renderer | HubSpot SDK

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/login/           # Login page
│   ├── (dashboard)/            # Protected routes
│   │   ├── contracts/          # List, new, [id], [id]/edit
│   │   │   └── [id]/           # Detail, addendum/new, change-order/new
│   │   ├── commissions/        # Commission management
│   │   └── settings/           # App settings + commissions config
│   ├── contracts/              # Public routes (sign/[token], view/[token])
│   └── api/                    # API routes
│       ├── auth/               # NextAuth endpoints
│       ├── contracts/          # CRUD, PDF, submit, addendum, change-order
│       ├── commissions/        # Config, recalculate, export
│       ├── hubspot/            # CRM sync (deals, addendums, change-orders)
│       ├── pricing/            # Pricing calculation
│       └── settings/           # Settings API
├── lib/                        # Business logic & utilities
│   ├── auth.ts                 # NextAuth v5 config
│   ├── db.ts                   # PrismaClient + PrismaPg adapter
│   ├── pricing.ts              # Isomorphic pricing calculator
│   ├── commission.ts           # Commission calculation logic
│   ├── constants.ts            # Pricing matrix + form options
│   ├── validations.ts          # Zod schemas (3 contract types)
│   ├── hubspot.ts              # HubSpot CRM wrapper
│   ├── pdf.tsx                 # PDF generation (react-pdf)
│   └── hooks/                  # use-auto-save, use-pricing-calculator
├── components/
│   ├── contracts/              # Form components (sales, addendum, change-order)
│   ├── commissions/            # Commission tables, editors, summary
│   ├── shared/                 # Signature pad, currency input, auto-save
│   └── ui/                     # shadcn/ui components
├── types/                      # TypeScript augmentations (next-auth.d.ts)
└── generated/prisma/           # Prisma generated client (client.ts)
prisma/
├── schema.prisma               # DB schema (User, Contract, LineItem, Addendum, ChangeOrder, Commission*)
└── seed.ts                     # Seed script (admin + sales users)
```

## Organization Rules

- API routes → `src/app/api/`, one file per resource
- Components → `src/components/`, grouped by domain (contracts, shared, ui)
- Business logic → `src/lib/`, one module per concern
- Types → `src/types/` or co-located with usage
- Single responsibility per file, clear descriptive names

## Code Quality

After editing ANY file, run:

```bash
bun run lint
bun run typecheck
```

Fix ALL errors/warnings before continuing.

Run tests after changing business logic:

```bash
bun run test
```

Dev server (hot-reloads automatically):

```bash
bun run dev
```

Database commands:

```bash
bun run db:generate   # Regenerate Prisma client after schema changes
bun run db:push       # Push schema changes to database
bun run db:seed       # Seed database
```

## Known Gotchas

- **Prisma 7**: Import from `@/generated/prisma/client` (not index.ts)
- **Zod v4 + @hookform/resolvers**: Use `as any` cast for `zodResolver()`
- **Auth.js adapter**: PrismaAdapter needs `as any` cast
- **React 19**: `useRef()` requires initial argument
- **Next.js 16**: `useSearchParams()` must be in Suspense boundary
- **@react-pdf/renderer**: Files must use `.tsx` extension
- **Edge middleware**: Cannot import Node.js modules (use simple cookie check)
