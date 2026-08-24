# Society Maintenance Tracker

A full-stack apartment/residential society maintenance complaint management system built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## 🌐 Live Demo

**[https://soc-manager.netlify.app](https://soc-manager.netlify.app)**

| Role | Email | Password |
|---|---|---|
| Admin | admin@greenparkresidency.com | Admin@123 |
| Resident | priya.sharma@email.com | Resident@123 |

---

## Features

### For Residents
- Register and log in securely
- Submit maintenance complaints with optional photo attachments
- Track complaint status in real time (Open → In Progress → Resolved)
- View full complaint history timeline
- Read society notices and announcements
- Receive email notifications when complaint status changes

### For Administrators
- View all complaints from all residents
- Search, filter, and paginate complaints
- Set and update complaint priority (High / Medium / Low)
- Change complaint status with an optional admin note
- Detect and surface overdue complaints (configurable threshold)
- Publish, edit, and delete society notices
- Mark notices as important (pinned to top + email notification)
- View dashboard statistics and category breakdown
- Configure the overdue complaint threshold

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth | NextAuth.js v5 (Credentials + JWT) |
| ORM | Prisma |
| Database | PostgreSQL (Neon serverless) |
| File Storage | Cloudinary |
| Email | Resend |
| Deployment | Vercel |

---

## Architecture

```
Browser (React + Tailwind)
    ↓
Next.js App Router
    ↓
Next.js API Routes (REST)
    ↓
NextAuth.js (JWT sessions + role-based middleware)
    ↓
Prisma ORM (type-safe queries)
    ↓
PostgreSQL (Neon)
    ↓
Cloudinary (photo storage)
    ↓
Resend (email notifications)
```

---

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Steps

```bash
# Clone repository
git clone <repo-url>
cd society-maintenance-tracker

# Install dependencies
npm install

# Copy environment file and fill in values
cp .env.example .env.local
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the following values:

```env
# PostgreSQL database URL (from Neon, Railway, Supabase, etc.)
DATABASE_URL=postgresql://...

# NextAuth — can be any long random string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here

# Cloudinary (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Resend (https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## External Service Setup

### 1. Neon PostgreSQL (Database)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the **Connection string** (starts with `postgresql://`)
4. Paste it as `DATABASE_URL` in `.env.local`

### 2. Cloudinary (Photo Storage)

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. From your dashboard, copy:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### 3. Resend (Email)

1. Go to [resend.com](https://resend.com) and create a free account
2. Create an API key from the dashboard
3. Paste it as `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to an email address using your verified domain
5. For local development: add your own email as a test recipient in Resend settings

---

## Database Setup

```bash
# Push schema to database (creates tables)
npm run db:push

# OR use migrations (recommended for production)
npm run db:migrate

# Seed with realistic demo data
npm run db:seed
```

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@greenparkresidency.com | Admin@123 |
| Resident | priya.sharma@email.com | Resident@123 |
| Resident | anil.mehta@email.com | Resident@123 |
| Resident | sunita.patel@email.com | Resident@123 |
| Resident | vikram.singh@email.com | Resident@123 |
| Resident | deepa.nair@email.com | Resident@123 |

---

## Production Deployment (Vercel)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables from `.env.example` in Vercel project settings
4. Change `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. Deploy

After deployment, run the database migration and seed if needed.

---

## API Documentation

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new resident |
| POST | `/api/auth/[...nextauth]` | Login / logout (NextAuth) |
| GET | `/api/auth/session` | Get current session |

**Register body:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "MyPass@123",
  "flatNumber": "A-203",
  "phone": "+91 98765 43210"
}
```

---

### Resident Complaints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/complaints` | RESIDENT | Create a complaint |
| GET | `/api/complaints/my` | RESIDENT | List own complaints |
| GET | `/api/complaints/:id` | RESIDENT | Get complaint detail |

**Create complaint body:**
```json
{
  "title": "Water leakage in bedroom",
  "description": "Water is dripping from the ceiling...",
  "category": "PLUMBING",
  "photoUrl": "https://res.cloudinary.com/..."
}
```

**Categories:** `PLUMBING`, `ELECTRICAL`, `LIFT_ELEVATOR`, `CLEANING`, `SECURITY`, `WATER_SUPPLY`, `PARKING`, `COMMON_AREA`, `OTHER`

---

### Admin Complaints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/complaints` | ADMIN | All complaints with filters |
| PATCH | `/api/admin/complaints/:id/status` | ADMIN | Update status |
| PATCH | `/api/admin/complaints/:id/priority` | ADMIN | Update priority |

**Query parameters for GET `/api/admin/complaints`:**
- `search` — search by title, resident name, ID
- `status` — `OPEN`, `IN_PROGRESS`, `RESOLVED`
- `category` — any valid category
- `priority` — `LOW`, `MEDIUM`, `HIGH`
- `overdue` — `true` to show only overdue
- `page` — page number (default: 1)
- `limit` — results per page (default: 20)

**Update status body:**
```json
{
  "status": "IN_PROGRESS",
  "note": "Assigned to maintenance team"
}
```

**Valid status transitions:**
- `OPEN` → `IN_PROGRESS`
- `IN_PROGRESS` → `RESOLVED` or `OPEN`
- `RESOLVED` → (no further transitions)

---

### Notices

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notices` | Any | Get all notices |
| GET | `/api/admin/notices` | ADMIN | Get all notices |
| POST | `/api/admin/notices` | ADMIN | Create notice |
| PATCH | `/api/admin/notices/:id` | ADMIN | Update notice |
| DELETE | `/api/admin/notices/:id` | ADMIN | Delete notice |

---

### Dashboard & Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/dashboard` | ADMIN | Dashboard statistics |
| GET | `/api/admin/settings` | ADMIN | Get settings |
| PATCH | `/api/admin/settings` | ADMIN | Update settings |

---

### File Upload

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload` | Any | Upload image to Cloudinary |

**Form data:** `file` (File) — JPG, PNG, or WEBP, max 5MB

---

## Database Schema

### User
```
id           String   (CUID)
name         String
email        String   (unique)
passwordHash String
role         RESIDENT | ADMIN
flatNumber   String?
phone        String?
createdAt    DateTime
updatedAt    DateTime
```

### Complaint
```
id           String   (CUID)
title        String
description  String
category     Category (enum)
status       OPEN | IN_PROGRESS | RESOLVED
priority     LOW | MEDIUM | HIGH
photoUrl     String?
residentId   String   (FK → User)
createdAt    DateTime
updatedAt    DateTime
resolvedAt   DateTime?
```

### ComplaintHistory
```
id             String   (CUID)
complaintId    String   (FK → Complaint)
previousStatus ComplaintStatus?
newStatus      ComplaintStatus
note           String?
actorId        String   (FK → User)
createdAt      DateTime
```

### Notice
```
id          String   (CUID)
title       String
content     String
isImportant Boolean
createdAt   DateTime
updatedAt   DateTime
createdById String   (FK → User)
```

### Setting
```
id        String (CUID)
key       String (unique)
value     String
createdAt DateTime
updatedAt DateTime
```

---

## Security Notes

- Passwords are hashed with bcrypt (cost factor 12)
- JWT sessions with 30-day expiry
- All API routes validate session and role server-side
- Residents can only access their own complaints — validated on the server
- File upload validates type and size before Cloudinary upload
- All user input is validated with Zod on the server
- Environment variables are never committed to source control

---

## System Design

### Complaint History Model
Every status change creates an immutable `ComplaintHistory` record containing the previous status, new status, actor, timestamp, and optional note. This creates a complete audit trail viewable as a chronological timeline.

### Status Lifecycle
Complaints follow a strict transition graph: `OPEN → IN_PROGRESS → RESOLVED`. The `IN_PROGRESS → OPEN` revert is allowed. Resolved complaints are closed and cannot transition further.

### Overdue Detection
Overdue status is derived at query time from timestamps and a configurable threshold, not stored as a boolean. The formula is: `(now - createdAt) > thresholdDays` AND `status ≠ RESOLVED`. This ensures the calculation is always accurate when the threshold is changed.

### Photo Storage
Photos are uploaded to Cloudinary via the `/api/upload` route. Only the resulting URL is stored in the database, keeping the database lean and delegating storage to a purpose-built CDN.

### Email Notifications
Email sending uses Resend. It is triggered asynchronously (without `await`) on status changes and important notice creation, so email failures never block the primary request. Failed emails are logged but do not return errors to the client.

### Authentication
NextAuth.js v5 with the credentials provider handles authentication. JWT tokens carry the user ID, role, and flat number. The `middleware.ts` enforces route protection and role-based redirects at the edge. All sensitive API routes perform an additional server-side session check.
