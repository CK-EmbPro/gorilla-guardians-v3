---
name: Booking system
description: Gorilla Guardians booking system design — refs, QR codes, guides, check-in, history.
---

## Booking Reference Format
`GG-` + `randomBytes(4).toString("hex").toUpperCase()` → e.g. `GG-A1B2C3D4`

## QR Code Data
Stored in `qrCodeData` column as full URL: `${APP_URL}/booking-verify?ref=${bookingReference}`
Rendered client-side via `qrcode.react` v4 (`import { QRCodeSVG } from "qrcode.react"`).

## New DB Tables (added to schema)
- `guidesTable` — tour guide profiles (name, photo, biography, languages[], experienceLevel, available, specialties[], rating, reviewCount, phone, email, userId)
- `bookingHistoryTable` — audit log per booking (bookingId, status, note, changedBy, createdAt)

## New Columns on bookingsTable
- `bookingReference` (text, unique) — GG-XXXXXXXX
- `guideId` (int FK → guides.id)
- `checkinAt` (timestamp) — set on QR check-in
- `qrCodeData` (text) — full verify URL
- `cancellationReason` (text)
- `rescheduledFrom` (int FK → bookings.id)

## New Status
`checked_in` added alongside: pending, approved, confirmed, cancelled, completed.

## Key API Endpoints (all under /api)
- `GET /bookings/capacity?experienceId=&date=` — capacity check
- `GET /bookings/ref/:ref` — lookup by GG-XXXXXXXX reference
- `POST /bookings/verify` — body: `{ref}` — verification endpoint
- `POST /bookings/:id/checkin` — QR check-in (sets checkinAt, status=checked_in)
- `POST /bookings/:id/reschedule` — body: `{date, participants?, reason?}`
- `PATCH /bookings/:id/guide` — body: `{guideId}` — assign/unassign guide
- `GET /bookings/:id/ticket` — rich ticket data including QR + guide + customer

## Frontend Pages Added
- `/bookings/:id` — BookingDetailPage (full detail, QR, timeline, reschedule modal)
- `/booking-ticket/:id` — BookingTicketPage (printable digital ticket with QR code)
- `/booking-verify` — BookingVerifyPage (staff check-in, lookup by reference)
- `/admin/guides` — AdminGuidesPage (CRUD for tour guides)

## API URL Pattern
Frontend uses relative `/api/...` URLs — Replit proxy routes these to port 8080.
No setBaseUrl needed for web; api-client-react handles it the same way.
