# NextRide Logistics — Full Build Plan

Brand: refined navy (#0B1E3F) + orange (#F27321), better typography, spacing, and motion than the mockup — same structure and iconography.

## 1. Database (Supabase migrations)

Tables (all with GRANTs + RLS):

- `profiles` (id → auth.users, full_name, phone, address, avatar_url)
- `user_roles` (user_id, role enum: admin | customer | driver) + `has_role()` security-definer fn
- `drivers` (user_id, vehicle, plate, status: available/busy/offline, current_lat/lng)
- `packages` (tracking_id NXR-xxxx, customer_id, driver_id, sender_{name,phone,address}, receiver_{name,phone,address}, package_type, weight_kg, description, pickup_option, pickup_at, estimated_delivery, fee_ngn, distance_km, status enum: pending | assigned | picked_up | in_transit | out_for_delivery | delivered | cancelled)
- `package_events` (package_id, status, note, actor_id, created_at) — powers tracking timeline
- `proof_of_delivery` (package_id, photo_url, signature_url, receiver_name, delivered_at)
- Storage buckets: `avatars`, `proof-of-delivery` (with RLS)

Trigger: on `auth.users` insert → create profile + assign default role from signup metadata.

## 2. Auth

- Email/password + Google (Lovable broker)
- `/auth` public page with role selector at signup (Customer / Driver; Admin seeded manually)
- Role-based redirect after login: admin → `/admin`, customer → `/app`, driver → `/driver`
- Password reset at `/reset-password`

## 3. Public marketing site

- `/` landing — hero, services grid (Same-day, Package Pickup, Business Logistics, Door-to-door), how-it-works, CTA, footer
- `/services`, `/about`, `/contact` (own head/SEO)
- `/track` — public tracking by NXR ID → timeline + status

## 4. Customer app (`/_authenticated/app/*`)

- `app/` dashboard: recent orders, quick actions
- `app/book` — Book a Package wizard (sender/receiver/package/pickup) → auto-calc fee, create package
- `app/packages` — list + filters
- `app/packages/$id` — details, live status timeline, contact support
- `app/profile`

## 5. Admin dashboard (`/_authenticated/admin/*`, role=admin)

- Overview: totals, pending, in transit, delivered, revenue, delivery donut chart (Recharts)
- Packages CRUD + assign driver
- Customers, Drivers, Pickups, Tracking, Reports (basic), Settings
- Sidebar layout matching mockup, refined

## 6. Driver PWA (`/_authenticated/driver/*`, role=driver) — mobile-first

- Bottom tab nav: Home / Packages / Profile
- Assigned Packages list → Accept / Reject
- Pickup screen → "I've Picked Up" + Call Customer
- In-Transit screen with route map placeholder → Start Delivery
- Proof of Delivery: photo upload + signature pad + receiver name → mark delivered
- Today's earnings
- Installable PWA (manifest + icons, home-screen install)

## 7. Realtime + shared

- Supabase Realtime on `packages` + `package_events` so customer and admin see driver progress live
- Toast notifications on status changes
- Shared status badge, tracking timeline, package card components

## 8. Design system

- Tokens in `src/styles.css`: navy primary, orange accent, success/warn/danger, refined radii + shadows
- Typography: Sora (display) + Inter (body) via `<link>` in `__root.tsx`
- Motion: subtle Framer Motion on hero, cards, page transitions
- Fully responsive; driver routes locked mobile-first

## Technical notes

- TanStack Start routes under `src/routes/`, `_authenticated/` gate is integration-managed
- Server functions in `src/lib/*.functions.ts` using `requireSupabaseAuth`; admin ops verify role via `has_role`
- Fee calc: base ₦1,500 + ₦100/km (placeholder; editable)
- Tracking IDs: `NXR` + 6 digits, unique
- PWA: manifest-only (no service worker) for install support

## Rollout order

1. Migrations + auth + roles + role-based redirect
2. Design system + marketing site + `/track`
3. Customer book/list/detail
4. Admin dashboard + assign driver
5. Driver mobile PWA + proof of delivery + realtime
6. Polish, empty states, seed demo data via migration
7. Admin panel should be accessible with password NRL nothing else mo email or password auth 
8. Driver panel should be accessible with NRL drivers 
9. This site should be building extremely well with the knowledge of multiple research of how the site should work professionally 