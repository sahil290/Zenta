# Agently — AI Agent Platform for Freelancers

AI-powered business operations agent for freelancers and small agencies.
Automates invoicing, lead follow-up, client onboarding, proposals, and CRM.

## Tech Stack
- **Frontend**: Next.js 14 + Tailwind CSS
- **Database + Auth**: Supabase (free tier)
- **AI**: Claude API (pay per use)
- **Payments**: Stripe
- **Email**: Resend (free tier)
- **Background jobs**: Inngest (free tier)
- **Hosting**: Vercel (free tier)

## Total cost to launch: $0

---

## Setup (step by step)

### 1. Clone and install
```bash
git clone <your-repo>
cd agently
npm install
```

### 2. Set up Supabase
1. Go to supabase.com → create free project
2. Go to SQL Editor → paste entire contents of `lib/supabase/schema.sql` → run it
3. Go to Settings → API → copy your URL and anon key

### 3. Set up environment variables
```bash
cp .env.example .env.local
# Fill in all values from each service
```

### 4. Set up Stripe
1. Go to stripe.com → create account (free)
2. Create 3 products: Starter ($49), Pro ($99), Agency ($199)
3. Copy the price IDs into .env.local

### 5. Set up Resend
1. Go to resend.com → create free account
2. Copy API key into .env.local

### 6. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 7. Deploy to Vercel
```bash
npm i -g vercel
vercel
# Add all env variables in Vercel dashboard
```

---

## Project Structure

```
agently/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── dashboard/
│   │   ├── page.tsx        # Main dashboard
│   │   ├── settings/       # Account settings
│   │   ├── billing/        # Subscription management
│   │   └── integrations/   # Connect Gmail, Notion etc.
│   └── api/
│       ├── agent/          # POST /api/agent — runs AI agent
│       ├── webhooks/       # Stripe webhooks
│       └── auth/           # Auth callbacks
├── components/
│   ├── ui/                 # Base UI components
│   ├── agent/              # Agent task components
│   ├── dashboard/          # Dashboard widgets
│   └── layout/             # Nav, sidebar, header
├── lib/
│   ├── agent/
│   │   └── runner.ts       # Core AI agent logic
│   ├── supabase/
│   │   ├── client.ts       # Browser client
│   │   ├── server.ts       # Server client
│   │   └── schema.sql      # Database schema
│   ├── stripe/             # Stripe helpers
│   └── utils/              # Shared utilities
├── types/
│   └── index.ts            # All TypeScript types
├── hooks/                  # Custom React hooks
├── config/                 # App config
└── middleware.ts           # Auth middleware
```

---

## What the agent can do

| Task | Description |
|------|-------------|
| `invoice_send` | Generate and send an invoice to a client |
| `invoice_chase` | Follow up on overdue invoices |
| `lead_followup` | Send follow-up emails to leads |
| `client_onboard` | Welcome new clients, send onboarding steps |
| `proposal_draft` | Draft a project proposal |
| `crm_sync` | Update contact records |
| `weekly_report` | Generate a business summary |

---

## Pricing
| Plan | Price | Tasks/month |
|------|-------|-------------|
| Free | $0 | 10 |
| Starter | $49/mo | 200 |
| Pro | $99/mo | 1,000 |
| Agency | $199/mo | Unlimited |
