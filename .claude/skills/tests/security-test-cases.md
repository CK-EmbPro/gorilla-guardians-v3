# Security Test Cases

Domain-expert test skill. Derives concrete, executable test cases from every security skill domain.
Called by `.claude/hooks/test-hook.md`. Do NOT invoke directly.

For each test case produced, include:
- **Test ID** (e.g., `SEC-AUTH-001`)
- **Domain** (skill it maps to)
- **Type**: Unit | Component | Integration | E2E | Manual | Automated-CI
- **Setup**: preconditions, fixtures, seed data needed
- **Action**: exact request / operation / code path to exercise
- **Expected Result**: precise assertion (status code, rendered output, store state, log entry)
- **Failure Means**: what security property is broken if this test fails

---

## 1. Authentication (→ `authentication-flow-review.md`)

### SEC-AUTH-001 — Expired Supabase session redirects to /auth
Type: E2E / Integration
Setup: Sign in as a valid user. Manually expire or delete the Supabase session token in browser storage.
Action: Navigate directly to `/dashboard`.
Expected: App redirects to `/auth`; no dashboard content rendered; no user data exposed.
Failure means: Session expiry not enforced — stale session grants access to protected routes.

### SEC-AUTH-002 — Tampered Supabase token is rejected
Type: Integration
Setup: Obtain a valid Supabase JWT. Decode payload, change `role` to `"service_role"`, re-sign with a wrong secret.
Action: Set the tampered token in localStorage and navigate to `/dashboard`.
Expected: Supabase client rejects the token; `useAuth` returns `null` user; redirect to `/auth`.
Failure means: Token tampering grants elevated Supabase privileges.

### SEC-AUTH-003 — Password stored via Supabase Auth — no plaintext in client
Type: Automated-CI / Code review
Setup: Grep `src/` for any password-related localStorage writes or log statements.
Action: `grep -rn "password" src/ --include="*.ts" --include="*.tsx"`
Expected: No occurrences of `localStorage.setItem` or `console.log` with a `password` variable.
Failure means: Plaintext credential stored or logged client-side.

### SEC-AUTH-004 — Login form rate limiting awareness
Type: Manual
Setup: Open the `/auth` page. Attempt login with wrong credentials 10+ times rapidly.
Action: Monitor Supabase error responses after repeated failures.
Expected: Supabase returns rate-limit or lockout response after threshold; app surfaces a user-friendly message (not a raw error or stack trace).
Failure means: Credential stuffing and brute-force attacks not surfaced or mitigated.

### SEC-AUTH-005 — Unknown email vs wrong password produce identical UX
Type: Component / Integration
Setup: One registered user (`user@test.com`). One non-existent email (`ghost@test.com`).
Action: Submit login form with (a) wrong password for real user; (b) unknown email.
Expected: Same error message displayed for both cases; no hint that the email does or does not exist.
Failure means: Email enumeration via differing error messages.

### SEC-AUTH-006 — Password reset flow is single-use
Type: Integration / Manual
Setup: Trigger Supabase password reset for a registered user; capture the reset link.
Action: Use the link to reset the password. Attempt to use the same link again.
Expected: Second use returns an error or renders an "invalid/expired link" message; password not reset again.
Failure means: Replay of reset link allows account takeover.

### SEC-AUTH-007 — Logout clears Supabase session and local state
Type: Component / Integration
Setup: Log in as a valid user; verify `useAuth` returns a user object.
Action: Call the logout action (Supabase `auth.signOut()`). Navigate to `/dashboard`.
Expected: `useAuth` returns `null`; redirect to `/auth`; no cached user data accessible.
Failure means: Session persists after logout — account takeover if device shared.

---

## 2. Session & Cookie (→ `session-cookie-security.md`)

### SEC-SESS-001 — Supabase auth cookie has secure attributes
Type: Manual / E2E
Setup: Perform a successful login on a production-like HTTPS environment.
Action: Inspect browser DevTools → Application → Cookies for the Supabase domain.
Expected: Auth cookies have `HttpOnly`, `Secure`, and `SameSite=Lax` (or Strict) attributes set.
Failure means: Cookies accessible via JavaScript (XSS steals session); sent over HTTP.

### SEC-SESS-002 — CSRF: state-changing Supabase operations require authenticated session
Type: Integration
Setup: No active session.
Action: Attempt to call a Supabase write operation (e.g., update user profile) directly without a session token.
Expected: Supabase returns a permissions error (RLS violation); no data mutated.
Failure means: Unauthenticated writes succeed due to missing RLS or missing session check.

### SEC-SESS-003 — localStorage does not contain raw Supabase service-role key
Type: Automated-CI / Code review
Setup: Search `src/` for any usage of service-role key patterns.
Action: `grep -rn "service_role" src/ --include="*.ts" --include="*.tsx"`
Expected: Zero matches — service-role key never referenced in client-side code.
Failure means: Service-role key exposed client-side bypasses all RLS.

---

## 3. Authorization (→ `authorization-implmentation.md`)

### SEC-AUTHZ-001 — Unauthenticated user cannot access /dashboard
Type: E2E / Component
Setup: No active Supabase session.
Action: Navigate directly to `/dashboard`.
Expected: Redirect to `/auth`; no dashboard content rendered.
Failure means: Route guard missing — protected page visible without login.

### SEC-AUTHZ-002 — useUserRole cannot be self-escalated via client-side mutation
Type: Unit / Component
Setup: Mock `useAuth` to return a regular user. Render a component that reads `useUserRole`.
Action: Attempt to mutate the role value in localStorage or React state and re-render.
Expected: Role is always derived from the Supabase session server-side; client-side mutation has no effect.
Failure means: Mass assignment or client-side role escalation.

### SEC-AUTHZ-003 — Supabase RLS prevents cross-user data access
Type: Integration
Setup: Create two Supabase test users (A and B). User B creates a record.
Action: Authenticated as User A, query the table directly via Supabase client.
Expected: User A's query returns only User A's rows; User B's record absent.
Failure means: Missing RLS policy — horizontal privilege escalation across users.

### SEC-AUTHZ-004 — Admin-only Supabase operations fail for regular users
Type: Integration
Setup: Authenticated as a non-admin Supabase user.
Action: Attempt to call any Supabase operation that requires elevated role (e.g., delete another user's record).
Expected: Supabase returns a permissions error; no data mutated.
Failure means: Broken function-level authorization.

---

## 4. Input Validation (→ `input-validation.md`)

### SEC-INPUT-001 — XSS payload stored via Supabase is rendered safely
Type: Integration / Component
Setup: Any form that stores a string value in Supabase (e.g., user profile name, booking notes).
Action: Submit `<script>alert(1)</script>` as the field value. Retrieve and render it.
Expected: React renders it as escaped text (`&lt;script&gt;`); no script executes. React's JSX escaping must not be bypassed with `dangerouslySetInnerHTML`.
Failure means: Stored XSS via Supabase data.

### SEC-INPUT-002 — Zod schema rejects out-of-range values
Type: Unit
Setup: Zod schema for any form (e.g., booking quantity, contact form fields).
Action: Pass boundary inputs: empty string, null, negative number, string > max length, malformed email.
Expected: `schema.safeParse()` returns `success: false` with a descriptive error for each invalid input.
Failure means: Invalid data reaches Supabase or Shopify unchecked.

### SEC-INPUT-003 — Shopify GraphQL variables use parameterised inputs — no string interpolation
Type: Automated-CI / Code review
Setup: Read `src/lib/shopify.ts`.
Action: Verify all GraphQL queries use `variables` object passed separately — never string-interpolated user input into the query template.
Expected: Zero instances of `\`...${userInput}...\`` inside GraphQL query strings.
Failure means: GraphQL injection via template literal concatenation.

### SEC-INPUT-004 — Oversized form payloads are rejected client-side before submission
Type: Component
Setup: Any text input or textarea with a defined `maxLength`.
Action: Attempt to submit a value exceeding the defined limit.
Expected: Zod validation error shown; form not submitted; Supabase/Shopify not called.
Failure means: Unbounded input sent to backend — DoS or truncation data corruption.

---

## 5. SSRF & Open Redirect (→ `ssrf-and-open-redirect.md`)

### SEC-SSRF-001 — Shopify checkout URL is validated before redirect
Type: Component / Integration
Setup: `cartStore.ts` checkout flow that generates a Shopify checkout URL.
Action: Inspect the checkout URL returned by Shopify before the user is redirected.
Expected: URL hostname matches the configured Shopify store domain (`*.myshopify.com` or custom domain); no redirect to an arbitrary external URL.
Failure means: Open redirect via a manipulated Shopify checkout URL.

### SEC-SSRF-002 — No user-supplied URL passed to outbound fetch
Type: Automated-CI / Code review
Setup: Search `src/` for `fetch(`, `axios(`, or similar with a variable as the URL.
Action: Verify all outbound fetch calls use hardcoded or env-var-derived base URLs, never a URL constructed from user input.
Expected: Zero instances of `fetch(userSuppliedUrl)` or `fetch(\`${userInput}/...\`)`.
Failure means: SSRF via user-controlled URL in client-side fetch.

---

## 6. Database Security (→ `database-security.md`)

### SEC-DB-001 — Supabase queries filter by authenticated user ID server-side (RLS)
Type: Integration
Setup: Supabase table with RLS enabled. Two users with separate records.
Action: Query the table as User A without a manual `.eq('user_id', userId)` filter.
Expected: RLS automatically restricts results to User A's rows; no explicit client-side filter needed (but double-checked if present).
Failure means: Missing RLS — data leakage between users.

### SEC-DB-002 — No Supabase service-role key used in client-side code
Type: Automated-CI
Setup: `src/integrations/supabase/client.ts`.
Action: Verify the Supabase client is initialised with the anon/publishable key only.
Expected: `createClient(url, VITE_SUPABASE_PUBLISHABLE_KEY)` — never the service-role key.
Failure means: Service-role key in client bypasses all RLS.

### SEC-DB-003 — Supabase `.from()` calls do not concatenate user input into table or column names
Type: Code review / Automated-CI
Setup: Search `src/` for `.from(`, `.select(`, `.eq(`.
Action: Verify all table names and column names are string literals, not variables derived from user input.
Expected: Zero dynamic table/column name constructions using user data.
Failure means: Injection or privilege escalation via dynamic query construction.

---

## 7. Secrets Management (→ `secrets-management-audit.md`)

### SEC-SEC-001 — Shopify access token not hardcoded in source
Type: Automated-CI
Setup: `src/lib/shopify.ts`.
Action: Check that `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (or equivalent) is read from `import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN`, not a string literal.
Expected: No string literal matching an API token pattern in source.
Failure means: Shopify access token committed to version control — credential exposure.

### SEC-SEC-002 — `.env.local` is not committed to git
Type: Automated-CI
Setup: Check git-tracked files.
Action: `git ls-files .env .env.local .env.production`
Expected: Empty output — no `.env*` files tracked in git.
Failure means: Production secrets committed to version control.

### SEC-SEC-003 — Vite build output does not contain raw API credentials
Type: Automated-CI
Setup: Run `npm run build`. Inspect `dist/` output.
Action: `grep -rn "VITE_SHOPIFY_ACCESS_TOKEN\|supabase.*service_role" dist/`
Expected: Zero matches — env var keys replaced by their values only where explicitly used; service-role key absent entirely.
Failure means: Secret key names or values leaked into the public bundle.

---

## 8. Security Misconfiguration (→ `security-misconfiguration.md`)

### SEC-CONF-001 — Production build does not expose source maps
Type: Automated-CI
Setup: `vite.config.ts` production settings.
Action: Run `npm run build`. Check `dist/assets/` for `.map` files.
Expected: No `.map` files in production output (or `sourcemap: false` confirmed in config).
Failure means: Source maps expose full application source to attackers in production.

### SEC-CONF-002 — Vite dev server not accidentally exposed in production
Type: Manual / Config review
Setup: `vite.config.ts`.
Action: Verify `server.host` is not set to `'0.0.0.0'` without intentional justification; confirm production is built with `npm run build`, not `npm run dev`.
Expected: Dev server config is development-only; production serves static files.
Failure means: Vite dev server (with HMR and file-system access) exposed publicly.

### SEC-CONF-003 — React strict mode enabled
Type: Code review
Setup: `src/main.tsx`.
Action: Confirm `<React.StrictMode>` wraps the root app.
Expected: `<React.StrictMode><App /></React.StrictMode>` present.
Failure means: Strict mode warnings suppressed — side-effect bugs and deprecated API use go undetected.

---

## 9. Logging & Monitoring (→ `logging-monitoring.md`)

### SEC-LOG-001 — Supabase credentials and tokens never appear in console logs
Type: Manual / Component
Setup: Enable browser console. Perform login, logout, and a Shopify checkout.
Action: Monitor all console output during these flows.
Expected: Zero occurrences of token values, `password`, Supabase JWT, or Shopify access token in console output.
Failure means: Credential leakage via browser console — visible to users with DevTools open.

### SEC-LOG-002 — Failed auth attempts produce a console warning (not a raw Supabase error object)
Type: Component / Integration
Setup: Attempt login with wrong credentials.
Action: Capture `console.error` / `console.warn` output during the failed attempt.
Expected: A sanitised, user-facing message logged if at all; no raw Supabase error object with internal details dumped.
Failure means: Internal Supabase error structure exposed in logs.

---

## 10. Business Logic (→ `business-logic-vulnerabilities.md`)

### SEC-BL-001 — Cart quantity cannot be set to zero or negative
Type: Unit / Component
Setup: Render `CartDrawer` with an item in the Zustand cart store.
Action: Attempt to set quantity to `0`, `-1`, or a non-integer value via the quantity control.
Expected: Quantity clamped to minimum of `1`; store state never contains `quantity <= 0`.
Failure means: Zero or negative quantity sent to Shopify checkout — pricing manipulation.

### SEC-BL-002 — Race condition: simultaneous add-to-cart for the same variant
Type: Integration
Setup: Shopify product with limited inventory. Two rapid `addToCart` calls for the same variant.
Action: Fire two simultaneous cart-add operations.
Expected: Cart reflects a single consistent state; no duplicate line items with doubled quantities beyond intent.
Failure means: Race condition creates inconsistent cart state sent to Shopify.

### SEC-BL-003 — Shopify checkout URL is generated server-side and not manipulable
Type: Integration / Manual
Setup: Complete cart with items. Initiate checkout.
Action: Inspect the Shopify checkout URL before redirect. Attempt to modify line item prices or quantities in the URL.
Expected: Shopify ignores client-side price parameters; final price computed server-side by Shopify.
Failure means: Price manipulation via modified checkout URL parameters.

---

## 11. API & Infrastructure (→ `api-and-infrastructure.md`)

### SEC-API-001 — Shopify Storefront API errors are handled and not re-thrown raw to the UI
Type: Component / Integration
Setup: Mock the Shopify Storefront API `fetch` to return a 500 error or a GraphQL error object.
Action: Render a component that triggers a Shopify API call (e.g., `ProductGrid`).
Expected: Error boundary or React Query `error` state shown; no raw API error object or stack trace rendered to the user.
Failure means: Internal Shopify API error structure exposed in the UI.

### SEC-API-002 — Supabase anon key CORS: requests only originate from allowed domains
Type: Manual / Config review
Setup: Supabase project → Authentication → URL Configuration.
Action: Verify `Site URL` and `Additional Redirect URLs` list only the production domain and `localhost` for development.
Expected: No wildcard `*` in allowed redirect URLs for production.
Failure means: OAuth redirect hijacking via overly permissive CORS/redirect config.

---

## 12. File Handling (→ `file-handling-business-logic.md`)

### SEC-FILE-001 — No file upload functionality exists without validation (N/A if no uploads)
Type: Code review
Setup: Search `src/` for `<input type="file"` or `FormData` usage.
Action: If file upload exists, verify MIME type validation and file size limit are enforced before upload.
Expected: Either no file upload exists, or every upload validates: allowed MIME types, max file size, and sanitised filename before sending to Supabase Storage.
Failure means: Unrestricted file upload — malicious file stored or served.

### SEC-FILE-002 — Supabase Storage bucket is not publicly writable without auth
Type: Manual / Config review
Setup: Supabase Storage → Bucket policies.
Action: Verify upload policy requires an authenticated user; anonymous uploads are disallowed.
Expected: Bucket `INSERT` policy requires `auth.uid() IS NOT NULL`.
Failure means: Unauthenticated users can upload files to public storage.

---

## 13. Dependency & Supply Chain (→ `dependency-supply-chain.md`)

### SEC-DEP-001 — No Critical/High CVEs in npm dependencies
Type: Automated-CI
Setup: CI pipeline or local environment.
Action: `npm audit --audit-level=high`
Expected: Zero Critical or High severity vulnerabilities reported.
Failure means: Known exploitable vulnerability ships to production.

### SEC-DEP-002 — Lock file matches manifest
Type: Automated-CI
Action: `npm ci` (exits non-zero if `package-lock.json` is out of sync with `package.json`).
Expected: Exit code 0.
Failure means: Inconsistent dependency resolution across environments.

### SEC-DEP-003 — No unexpected packages added to package.json
Type: Automated-CI / Code review
Setup: `git diff main -- package.json` on any PR.
Action: Review each added dependency for legitimacy; check name for typosquatting patterns.
Expected: All new packages are intentional, well-maintained, and name-verified against the npm registry.
Failure means: Typosquatting or supply-chain compromise via malicious package.
