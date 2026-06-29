# Dokan Hisab

Bangla-first inventory, sales, customer ledger, and invoicing SaaS for small businesses in Bangladesh.

**Product name:** দোকান হিসাব  
**Tagline:** স্টক থেকে বিক্রি, বিল থেকে পেমেন্ট - সব এক জায়গায়  
**Target users:** Small shop owners, freelancers, and service businesses in Bangladesh

## Overview

Dokan Hisab combines two workflows that are usually separate: inventory tracking and invoice/payment management.

The core flow is:

1. Add products with stock quantity, buy price, sell price, and low-stock threshold.
2. Record a sale from the quick-sale cart.
3. Product stock is deducted automatically by PostgreSQL triggers.
4. Generate an invoice from the sale.
5. Record payment by cash, bKash, Nagad, Rocket, bank, or credit.
6. Invoice due amounts and customer balances update automatically.

The application is built as a multi-tenant SaaS. Each shop has its own `business_id`, and Supabase Row Level Security keeps tenant data isolated.

## Tech Stack

- **Framework:** Next.js App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase Postgres, Auth, RLS, Storage
- **PDF:** `@react-pdf/renderer`
- **Charts:** Recharts
- **Icons:** Lucide React
- **Deployment:** Vercel

## Main Features

- Passwordless Supabase authentication
- Business onboarding guard
- Multi-tenant database model with RLS
- Product, category, unit, and stock management
- Trigger-based stock deduction on sales
- Trigger-based stock addition on purchases
- Stock movement audit log
- Low-stock dashboard alerts
- Client ledger with running due balance
- Quick-sale cart
- Credit sale tracking
- Invoice creation and invoice detail pages
- Bangla PDF invoice generation
- Business settings with payment numbers
- Purchase/restocking module
- Dashboard metrics and revenue chart

## Database Schema

Run the full Supabase SQL seed before using the application. The schema creates 13 tables, helper functions, triggers, views, indexes, and RLS policies.

### Tables

| Table | Purpose |
| --- | --- |
| `businesses` | Main tenant/shop record |
| `profiles` | Supabase user profile linked to a business |
| `categories` | Product categories per business |
| `products` | Inventory items and live stock count |
| `stock_movements` | Audit log for stock changes |
| `clients` | Customer records and total due balance |
| `sales` | Sale transactions |
| `sale_items` | Products sold in each sale |
| `invoices` | Invoice records |
| `invoice_items` | Line items per invoice |
| `payments` | Payment records |
| `purchases` | Restocking purchase records |
| `purchase_items` | Products added in each purchase |

### Views

| View | Purpose |
| --- | --- |
| `low_stock_products` | Active products where `stock_qty <= low_stock_threshold` |
| `client_invoice_summary` | Total billed, paid, due, and invoice count per client |
| `daily_sales_summary` | Daily sales, revenue, collected amount, and due amount |
| `product_profit_summary` | Product-level sold quantity, revenue, cost, and profit |

### Functions and Triggers

| Function / Trigger | Purpose |
| --- | --- |
| `get_business_id()` | Resolves the current user's `business_id` from `profiles` |
| `deduct_stock_on_sale()` / `trigger_deduct_stock` | Deducts product stock after inserting `sale_items` |
| `add_stock_on_purchase()` / `trigger_add_stock` | Adds product stock after inserting `purchase_items` |
| `update_invoice_due_on_payment()` / `trigger_update_invoice_due` | Updates invoice paid/due amounts after inserting `payments` |
| `set_updated_at()` / update triggers | Maintains `updated_at` on products and invoices |
| `handle_new_user()` / `on_auth_user_created` | Creates a profile row after Supabase Auth signup |
| `mark_overdue_invoices()` | Marks sent invoices overdue when `due_date < current_date` |

## Important Business Logic Rules

Do not bypass these rules in frontend or server code:

- Never update `products.stock_qty` manually from the app.
- Always insert into `sale_items` to deduct stock.
- Always insert into `purchase_items` to add stock.
- Never update `invoices.paid_amount` or `invoices.due_amount` manually.
- Always insert into `payments` so the payment trigger updates invoice balances.
- Never pass trusted `business_id` values from the frontend when RLS can derive tenant access from `get_business_id()`.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

## Supabase Setup

1. Create a new Supabase project.
2. Go to **SQL Editor**.
3. Paste and run the full Dokan Hisab SQL seed.
4. Confirm that all 13 tables appear in **Table Editor**.
5. Confirm that Row Level Security is enabled on all tables.
6. Enable Supabase Auth provider:
   - Email OTP for passwordless login, or
   - Phone OTP if an SMS provider is configured.
7. Create a public Supabase Storage bucket:

```text
business-logos
```

8. If you use the demo seed block, replace this placeholder with your real Supabase Auth user ID:

```sql
00000000-0000-0000-0000-000000000000
```

You can find the user ID in **Supabase Dashboard -> Authentication -> Users**.

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Only use `SUPABASE_SERVICE_ROLE_KEY` in server-only code such as API routes, route handlers, cron jobs, or server actions.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Recommended First-Run Checklist

After configuring Supabase and `.env.local`, test this flow:

1. Sign up or sign in.
2. Complete business setup.
3. Add a category.
4. Add a product with initial stock.
5. Create a client.
6. Record a sale with one or more products.
7. Confirm the product stock decreased.
8. Confirm `stock_movements` contains a sale entry.
9. Generate an invoice from the sale.
10. Record a partial or full payment.
11. Confirm invoice paid/due amounts updated.
12. Confirm client due balance updated.
13. Export or open the invoice PDF.

## Deployment

Recommended deployment target: Vercel.

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add all environment variables in Vercel project settings.
4. Confirm the same Supabase SQL seed has been run in the production Supabase project.
5. Create the `business-logos` storage bucket in production.
6. Deploy.
7. Test the complete flow on a real mobile device.

## Cron / Overdue Invoices

The SQL seed includes:

```sql
mark_overdue_invoices()
```

Schedule this function to run daily using Supabase cron, a Supabase Edge Function, or a Vercel cron route.

Example expected behavior:

- Invoice status is `sent`
- `due_date` is before today
- Function updates status to `overdue`

## Mobile-First Product Notes

The primary users are shop owners who may use the app from Android phones. Keep these rules when extending the UI:

- Forms should stack on small screens.
- Touch targets should be at least 44px tall.
- Sales entry should be fast and low-friction.
- PDF preview should open in a new tab on mobile.
- Bangla UI text should remain readable and unclipped.

## Current Verification Notes

This merged package includes the latest app files, the full Supabase SQL seed, the project README, an `.env.example`, and the original project document in `docs/`.

The package was build-checked with placeholder Supabase environment variables:

```bash
npm run build
```

Build status: passes when `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are present.

Remaining cleanup for a future hardening pass:

- `npm run lint` still reports existing `any`, unused import, and React hook dependency issues.
- `middleware.ts` works but Next.js 16 warns that the file convention is deprecated in favor of `proxy.ts`.
- `tsconfig.json` uses `strict: false` because the inherited codebase has many untyped UI handlers and Supabase response shapes.

## License

Private project. Add a license before publishing publicly.
