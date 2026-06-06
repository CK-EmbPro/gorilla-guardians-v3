---
name: Express route ordering
description: Static/named routes must be registered before parameterized :id routes in Express, or they get captured by the param handler.
---

In Express, route matching is first-match. If `GET /bookings/:id` is registered before `GET /bookings/capacity`, a request to `/bookings/capacity` will match `:id` with the value `"capacity"`, resulting in `parseInt("capacity") = NaN` and a 400 error.

**Rule:** Always register specific named sub-paths before their parameterized siblings:
- `GET /bookings/capacity` → before `GET /bookings/:id`
- `GET /bookings/ref/:ref` → before `GET /bookings/:id`
- `POST /bookings/verify` → before `POST /bookings/:id/checkin`

**Why:** Express routing is purely order-dependent. There's no specificity score like in some other frameworks.

**How to apply:** Any time you add a new named route under a resource that already has `/:id`, scroll up to check registration order and insert the named route before the param route.
