# System Design & Architecture

This document outlines the architectural decisions and design patterns used to solve core requirements in the Society Maintenance Tracker.

## 1. Complaint History Model (Audit Trail)

Instead of merely updating a single `status` column on the `Complaint` record, the system utilizes an append-only ledger pattern. 

**Database Schema:**
We use two tables: `Complaint` and `ComplaintHistory` (1-to-many relationship). Every time a status changes, we update the `Complaint.status` (for quick querying) and simultaneously insert an immutable `ComplaintHistory` record containing:
- `previousStatus`
- `newStatus`
- `actorId` (who made the change)
- `note` (optional admin comment)
- `createdAt` (timestamp)

**Why this approach?**
1. **Auditability:** We maintain a flawless historical timeline. Residents can see exactly when and why their complaint status changed.
2. **Immutability:** History records are never edited or deleted, ensuring trust in the system.
3. **Data Integrity:** Status transitions are validated server-side. For instance, a complaint cannot bypass `IN_PROGRESS` and jump straight from `OPEN` to `RESOLVED`. If a violation occurs, the API rejects the transition before writing to the database.

## 2. Overdue Detection (Dynamic Derivation)

A common pitfall in task-tracking systems is using a boolean `isOverdue` column and relying on fragile cron jobs to flip the boolean every night. We avoided this entirely by calculating the overdue state dynamically at query time.

**How it works:**
The "overdue threshold" (e.g., 14 days) is stored in the `Setting` table, allowing admins to adjust it globally without a code deployment. When fetching complaints, the system calculates a dynamic `overdueDate` variable (`now - thresholdDays`).

A complaint is flagged as overdue if:
1. Its `createdAt` date is older than the `overdueDate`.
2. Its `status` is NOT `RESOLVED`.

**Why this approach?**
1. **No Stale Data:** Overdue statuses are mathematically guaranteed to be accurate up to the millisecond.
2. **Instant Reflection:** If an admin changes the threshold from 14 days to 7 days, all applicable complaints immediately surface as overdue on the next page load without requiring a batch database migration.
3. **Scalability:** It eliminates the need for expensive background polling services.

## 3. Photo Handling (Serverless Blob Storage)

Storing large binary image files directly in PostgreSQL is an anti-pattern that bloats database size and destroys query performance. Instead, we delegate file storage to Cloudinary (a specialized CDN).

**Upload Flow:**
1. **Client-side:** The user selects an image. The UI immediately restricts file types (JPG/PNG/WEBP) and sizes (<5MB).
2. **Server-side Validation:** The image is posted to the Next.js `/api/upload` endpoint. The server re-validates the size and type to prevent malicious bypassing of frontend constraints.
3. **Streaming:** The server converts the file into a memory buffer and streams it directly to Cloudinary using `cloudinary.uploader.upload_stream`.
4. **Database:** Cloudinary returns a secure URL (`https://res.cloudinary.com/...`). We return this URL to the client, which then submits it along with the complaint text. Only the lightweight URL string is saved in PostgreSQL.

**Why this approach?**
This keeps the database incredibly lean and fast. It also ensures that images are served globally via Cloudinary's high-performance edge network, rather than bottlenecking our Next.js application server.

## 4. Notification Flow (Asynchronous Dispatch)

The system needs to notify users when a complaint status changes or when an important notice is published. This is handled using the Resend email API.

**Event-Driven Design:**
Email dispatching is decoupled from the primary database transaction. For example, when an admin updates a complaint status:
1. The database transaction (updating the complaint and writing the history) is executed and `await`ed.
2. The `sendStatusUpdateEmail()` function is called.
3. The API route returns a `200 OK` success response to the client *immediately*.

**Error Handling & Batching:**
- **Non-blocking:** If the third-party email API goes down or takes 5 seconds to respond, it will not block the user interface. The admin will immediately see a success toast, while the email goes out in the background. Errors are caught and logged silently on the server.
- **Batching:** When an important notice is published, we may need to email 500+ residents. The system chunks the recipients into batches (e.g., 50 per batch) and fires them via `Promise.all` to avoid hitting Resend rate limits or running into serverless function timeouts.
