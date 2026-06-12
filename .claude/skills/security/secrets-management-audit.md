## Secrets Management Audit

Scan entire codebase for exposed secrets

Check for:
1. Hardcoded secrets
   - API keys
   - Database passwords
   - JWT secrets
   - Encryption keys

2. Environment variable usage
   - All secrets in env vars
   - .env file not in git
   - Production vs development configs

3. Secret rotation capability
   - Database password rotation
   - API key rotation
   - Certificate updates

4. Encryption key management
   - Key derivation functions
   - Salt usage
   - Key storage

Flag any hardcoded secrets as CRITICAL.

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
   "Approve these fixes? (Yes / No / Modify specific items)"

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