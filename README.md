# EventFlow — Event Registration & Check-in System

A full-stack Next.js application for managing event registrations, on-site check-ins, and badge printing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB + Mongoose |
| Styling | Tailwind CSS |
| Auth | NextAuth.js (Magic Link / Email) |
| Email | Resend |
| Data Fetching | SWR |
| Forms | React Hook Form + Zod |
| QR Codes | qrcode.react |
| QR Scanner | html5-qrcode |

---

## Project Structure

```
eventflow/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   ├── registrations/        # CRUD for registrations
│   │   │   └── [id]/             # Single registration ops
│   │   ├── forms/                # Fetch dynamic form schema
│   │   ├── email/send/           # Send confirmation email
│   │   ├── badge/[id]/           # Badge data endpoint
│   │   └── admin/
│   │       ├── stats/            # Dashboard counts
│   │       ├── export/           # CSV export
│   │       └── seed/             # Seed default form (dev)
│   ├── badge/[id]/               # Badge print page
│   ├── dashboard/                # Admin dashboard (protected)
│   ├── login/                    # Magic link login
│   ├── register/                 # Public pre-registration
│   ├── layout.tsx
│   ├── page.tsx                  # Redirects to /register
│   └── globals.css
├── components/
│   ├── ui/                       # Base UI primitives
│   ├── forms/
│   │   └── DynamicForm.tsx       # Renders form from DB schema
│   └── dashboard/
│       ├── StatsCards.tsx
│       ├── RegistrationsTable.tsx
│       ├── AddRegistrationDialog.tsx
│       ├── QRScanner.tsx
│       └── DashboardNav.tsx
├── lib/
│   ├── db.ts                     # MongoDB connection
│   ├── auth.ts                   # NextAuth config
│   └── utils.ts                  # Helpers + CSV export
├── models/
│   ├── Registration.ts           # Registrant schema
│   └── FormSchema.ts             # Dynamic form config
├── scripts/
│   └── seed.ts                   # Seed default form fields
├── middleware.ts                 # Protect /dashboard/*
└── .env.local.example
```

---

## Quick Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd eventflow
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# MongoDB — local or Atlas
MONGODB_URI=mongodb://localhost:27017/eventflow

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>

# Resend — get free API key at resend.com
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com

# Comma-separated admin emails
ADMIN_EMAILS=you@example.com

# Public vars
NEXT_PUBLIC_APP_NAME=EventFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start MongoDB (if local)

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or with Docker (single line)
docker run -d -p 27017:27017 mongo
```

### 4. Seed the Default Form

```bash
npm run dev
```

Then open: **http://localhost:3000/api/admin/seed**

This creates the default pre-registration form in MongoDB. You only need to do this once.

### 5. Open the App

| URL | Description |
|---|---|
| http://localhost:3000/register | Public registration form |
| http://localhost:3000/login | Admin magic link login |
| http://localhost:3000/dashboard | Admin dashboard (protected) |

---

## How It Works

### Magic Link Auth
1. Admin visits `/login`, enters their email
2. NextAuth sends a magic link via Resend
3. Admin clicks the link → session created via JWT
4. Only emails in `ADMIN_EMAILS` can sign in

### Dynamic Forms
- Form fields are stored in MongoDB (`FormSchema` collection)
- The registration page fetches fields from `/api/forms?slug=pre-registration`
- Zod validation schema is built at runtime from field definitions
- To add/remove fields: update the MongoDB document directly or extend the seed script

### Badge Printing
1. Admin clicks **Print Badge** for any registrant
2. A new window opens at `/badge/[id]`
3. Page fetches registrant data, renders badge with QR code
4. `window.print()` fires automatically after 600ms
5. Badge is credit-card sized (3.375 × 2.125 inches)
6. QR code encodes the badge URL for scanner verification

### QR Check-in
1. Admin clicks **Scan QR** button in dashboard
2. Browser opens camera (mobile-friendly)
3. Scan a printed badge QR code
4. System updates status to `checked_in` instantly

### CSV Export
- Click the download icon in the table toolbar
- Exports all visible registrations (respects current status filter)
- Custom fields are flattened as `custom_<fieldId>` columns

---

## Customizing Form Fields

Edit `scripts/seed.ts` and change the `fields` array, then re-run seed.
Or update directly in MongoDB:

```js
// MongoDB shell
db.formschemas.updateOne(
  { slug: "pre-registration" },
  { $push: { fields: {
    id: "dietary",
    label: "Dietary Requirements",
    type: "select",
    required: false,
    options: ["None", "Vegetarian", "Vegan", "Halal", "Kosher"],
    order: 8
  }}}
)
```

Supported field types: `text`, `email`, `phone`, `select`, `checkbox`, `textarea`

---

## Deployment (Vercel)

```bash
npm run build  # verify build passes locally first
```

1. Push to GitHub
2. Import in Vercel
3. Add all environment variables from `.env.local`
4. Deploy

For `NEXTAUTH_URL`, use your production domain: `https://your-app.vercel.app`

---

## Assumptions

- One event per deployment (multi-event support can be added via `eventId` field already in schema)
- Admin whitelist is env-var based (no UI for managing admins — intentional for MVP)
- Resend free tier (100 emails/day) is sufficient for most events; swap to Nodemailer if needed
- Badge size is standard credit-card (3.375 × 2.125 in); adjust `@page` in `globals.css` for other sizes
- `ADMIN_EMAILS` is empty in dev → all emails can sign in (safe for local testing)
