# Security Misconfiguration Audit

OWASP A05:2021 — Security Misconfiguration

Audit all application, server, framework, and infrastructure configuration for insecure defaults, unnecessary features, and hardening gaps.

---

## Check for:

### 1. HTTP Security Headers
   - `Strict-Transport-Security` (HSTS): `max-age` ≥ 31536000; `includeSubDomains`; `preload` where applicable
   - `Content-Security-Policy` (CSP): present, non-wildcard, restricts `script-src`, `object-src`, `base-uri`
   - `X-Content-Type-Options: nosniff` present
   - `X-Frame-Options: DENY` or `SAMEORIGIN` (or CSP `frame-ancestors`)
   - `Referrer-Policy`: `no-referrer` or `strict-origin-when-cross-origin`
   - `Permissions-Policy` (formerly Feature-Policy): disables unused browser features
   - `Cache-Control: no-store` on authenticated/sensitive responses
   - No `Server` or `X-Powered-By` headers leaking stack details

### 2. CORS Configuration
   - `Access-Control-Allow-Origin` not set to `*` on credentialed endpoints
   - Origin validated against an explicit allowlist, not regex with bypass risk
   - `Access-Control-Allow-Credentials: true` never paired with `*` origin
   - Preflight (`OPTIONS`) handling does not leak internal routes

### 3. Error Pages & Debug Mode
   - No stack traces, SQL error details, or file paths exposed in production error responses
   - Debug mode / verbose logging disabled in production (`NODE_ENV=production`, `DEBUG=false`)
   - Framework default error pages replaced with generic custom pages
   - API error responses return generic messages, not internal exception text

### 4. Default Credentials & Unused Features
   - No default admin credentials (admin/admin, root/root) on any service
   - Unused HTTP methods (TRACE, OPTIONS, PUT) disabled on endpoints that don't need them
   - Directory listing disabled on static file servers
   - Admin UIs (database GUIs, queue dashboards, metrics endpoints) not publicly exposed
   - Health check / metrics endpoints (`/health`, `/metrics`, `/actuator`) authenticated or network-restricted

### 5. Framework & Runtime Hardening
   - NestJS / Express: `trust proxy` set correctly for load-balancer deployments
   - `helmet()` middleware applied globally
   - Body parser size limits configured (`limit: '1mb'` or tighter)
   - JSON prototype pollution protection (e.g., `express-mongo-sanitize`, or Prisma's built-in safety)
   - Template engine auto-escaping enabled; no `{{{ }}}` or `| safe` on user input

### 6. TLS / Transport Configuration
   - TLS 1.2 minimum enforced; TLS 1.0 and 1.1 disabled
   - Weak cipher suites disabled (RC4, 3DES, NULL ciphers)
   - HTTPS enforced; HTTP redirects to HTTPS at reverse proxy level
   - Certificate expiry monitoring in place

### 7. Cloud & Container Configuration
   - No publicly accessible storage buckets/blobs with sensitive data
   - Container does not run as root
   - Unnecessary OS packages not installed in container image
   - Environment variables with secrets not baked into Docker layers
   - Kubernetes: no privileged pods; resource limits set; network policies defined

### 8. Dependency & Framework Default Config
   - Default Prisma `datasource` SSL mode set appropriately (`sslmode=require` or `verify-full`)
   - Redis/cache layer requires authentication; not bound to `0.0.0.0` without auth
   - Message queues (if any) require authentication; not publicly exposed
   - File storage (S3, GCS, local) not world-readable

### 9. CI/CD & Build Configuration
   - Secrets not in build logs, environment variable dumps, or artifact contents
   - `.env` files in `.gitignore`; no `.env.production` committed
   - Source maps not deployed to production (expose original source code)

---

## Provide:

A structured finding report with the following for each issue:

Title, Severity (Critical/High/Medium/Low), CWE (if applicable), Evidence (config file, middleware line, environment), and a short Why it matters.

Exploitability notes: describe what information is leaked or what attack surface is exposed.

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a "Proposed Fix Plan".
2. For each issue, include:
   - What will change
   - Why the change is needed
   - Risk if NOT fixed
   - Exact config change or code snippet

3. Ask the user explicitly:
   "Approve these fixes? (Yes / No / Modify specific items)"

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: precise config changes, middleware additions, environment variable updates — with snippets.

A summary risk score (0–10) and top 3–5 prioritized fixes.

A checklist diff: which items from the "Check for" list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact config files, middleware registrations, and environment names.

Do not invent configuration that isn't present; if context is missing, mark as Unable to verify and state what file is needed.

Write this into a markdown file and place it in the audits/ folder.
