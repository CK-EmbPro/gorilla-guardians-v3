# SSRF & Open Redirect Security

OWASP A10:2021 — Server-Side Request Forgery (SSRF)

Audit all outbound HTTP requests and redirect logic for server-side forgery and open redirect vulnerabilities.

---

## Check for:

### 1. Server-Side Request Forgery (SSRF)
   - Any endpoint that accepts a URL, URI, hostname, or IP address from user input and fetches it server-side
   - HTTP client calls (`axios`, `fetch`, `got`, `http.request`, `Dio`) where the target URL is derived from user-controlled data
   - Webhooks, import-by-URL features, avatar-by-URL, PDF generators, URL preview features
   - Image proxy or media fetching endpoints with user-supplied URLs
   - Internal metadata service access: check if cloud provider metadata endpoints (169.254.169.254, fd00:ec2::254) are reachable from the server

### 2. SSRF Bypass Techniques to Check Against
   - DNS rebinding: URLs resolving to private IP ranges after initial validation
   - IPv6 / decimal / hex / octal IP encoding bypasses (e.g., `http://0x7f000001/`)
   - URL redirection chains that land on internal services
   - Protocol smuggling: `file://`, `dict://`, `gopher://`, `ftp://` scheme abuse
   - Partial URL injection in string-concatenated request targets

### 3. URL Allowlist / Denylist Enforcement
   - Outbound HTTP allowed only to explicitly allowlisted domains/IPs (allowlist preferred over denylist)
   - Private/reserved IP ranges blocked: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, 169.254.0.0/16, ::1
   - Scheme restricted to `https://` only for user-supplied URLs; other schemes rejected
   - DNS resolution performed server-side after allowlist check (prevent rebinding)

### 4. Open Redirect
   - Any `redirect`, `next`, `returnUrl`, `goto`, `url`, `target`, `destination` parameter in routes
   - Post-login / post-logout redirect parameters not validated against an allowlist of safe paths/origins
   - `res.redirect(req.query.next)` patterns without validation
   - Fragment-based redirects (`#`) that could mislead users
   - JavaScript-based redirects (`window.location = userInput`) on server-rendered pages

### 5. Header Injection via Redirect
   - CRLF injection in redirect Location header values (`\r\n` in user input)
   - User input in `Location`, `Refresh`, or any other response header must be encoded/validated

### 6. Webhook & Callback URL Validation
   - Webhook URLs registered by users validated against SSRF allowlist before storage
   - Webhook delivery retries do not allow target URL modification mid-flight
   - Response content from webhook target not echoed back to the registering user in sensitive form

### 7. PDF / Screenshot / HTML-to-image Services
   - If server-side rendering is used (Puppeteer, wkhtmltopdf, PhantomJS), user-supplied HTML/URLs must be sandboxed
   - JavaScript execution disabled in rendering context where user content is involved

---

## Provide:

A structured finding report with the following for each issue:

Title, Severity (Critical/High/Medium/Low), CWE (CWE-918 for SSRF, CWE-601 for Open Redirect), Evidence (file, function, line ranges), and a short Why it matters.

Exploitability notes: describe the internal service reachable or phishing impact — no working exploit payloads.

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a "Proposed Fix Plan".
2. For each issue, include:
   - What will change
   - Why the change is needed
   - Risk if NOT fixed
   - Exact code-level fix snippet (if available)

3. Ask the user explicitly:
   "Approve these fixes? (Yes / No / Modify specific items)"

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: allowlist implementation, URL validation library usage, IP range blocking middleware — with code snippets.

A summary risk score (0–10) and top 3–5 prioritized fixes.

A checklist diff: which items from the "Check for" list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact code locations and identifiers.

Prefer minimal, drop-in fix snippets over prose.

Do not invent files or functions that aren't present; if context is missing, mark as Unable to verify and say what code would prove it.

Write this into a markdown file and place it in the audits/ folder.
