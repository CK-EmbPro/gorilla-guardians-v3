## Input Validation

Review all input validation across the application.

Check for:
1. SQL Injection vulnerabilities
   - Raw SQL queries without parameterization
   - Dynamic query building
   - Stored procedure calls

2. NoSQL Injection (if using MongoDB)
   - Unvalidated query operators ($where, $ne, $gt)
   - JavaScript execution in queries

3. Command Injection
   - Child process spawning
   - System command execution

4. XSS Prevention
   - Input sanitization
   - Output encoding
   - Content-Type headers

5. XXE (XML External Entity) attacks
   - XML parsing configuration
   - File upload handling

6. Path Traversal
   - File system operations
   - Directory listing prevention

7. Request validation
   - Body size limits
   - Parameter pollution
   - Type checking
   - Required field validation

Create a validation matrix showing each endpoint and its validation status.

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