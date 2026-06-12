## API & Infrastructure Security

Review API-specific security configurations.


Check for:
1. CORS configuration
   - Not using wildcard (*) in production
   - Proper origin validation
   - Credentials handling

2. Rate Limiting
   - Implemented on all endpoints
   - Different limits for different operations
   - Distributed rate limiting for scaled apps

3. API Versioning security
   - Deprecated version handling
   - Breaking change management

4. Request size limits
   - Body parser limits
   - File upload restrictions
   - JSON depth limits

5. HTTP Security Headers
   - Helmet.js configuration
   - CSP headers
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

6. API key/token management
   - Secure storage
   - Rotation policy
   - Scope limitations

7. Error handling
   - No stack traces in production
   - Generic error messages
   - Proper status codes

## Provide:

A structured finding report with the following for each issue:

Title, Severity (Critical/High/Medium/Low), CWE (if applicable), Evidence (file, function, line ranges), and a short Why it matters.

Exploitability notes and, where safe, a minimal PoC or reproduction steps (no real secrets).

## IMPORTANT PRE-REMEDIATION STEP (Approval Gate):

Before proposing or applying any remediation:

1. List ALL detected issues with their proposed fixes in a “Proposed Fix Plan”.
2. For each issue, include:
   - What will change
   - Why the change is needed
   - Risk if NOT fixed
   - Exact code-level fix snippet (if available)

3. Ask the user explicitly:
   “Approve these fixes? (Yes / No / Modify specific items)”

4. STOP here and WAIT for user response before continuing.

Only proceed to Remediation section after explicit approval.

## After Approval → Remediation:

Remediation: precise code-level fix or config change (snippets welcome), plus defense-in-depth guidance.

A summary risk score (0–10) and top 3–5 prioritized fixes that reduce risk fastest.

A checklist diff: which items from the “Check for” list are Pass/Fail/Not Applicable.

## Constraints & style:

Be concrete and cite exact code locations and identifiers.

Prefer minimal, drop-in fix snippets over prose.

Do not invent files or functions that aren’t present; if context is missing, mark as Unable to verify and say what code would prove it.

Write this into a markdown file and place it in the audits/ folder.