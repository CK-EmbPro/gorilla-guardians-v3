Evaluate this entire software package. 

Perform a comprehensive error handling review:

Evaluate:

1. ERROR HANDLING CONSISTENCY
   - Is there a centralized error handler?
   - Are errors handled uniformly?
   - Custom error classes vs generic errors?

2. ERROR CATEGORIES
   - Validation errors (400)
   - Authentication errors (401)
   - Authorization errors (403)
   - Not found errors (404)
   - Server errors (500)
   - Rate limit errors (429)
   - Are they properly categorized?

3. ASYNC ERROR HANDLING
   - Unhandled promise rejections
   - Async middleware wrapper usage
   - Callback error handling
   - Event emitter error handling

4. ERROR RECOVERY
   - Graceful degradation
   - Retry mechanisms
   - Circuit breakers
   - Fallback strategies

5. ERROR INFORMATION
   - Development vs production error details
   - Stack trace exposure
   - Error logging completeness
   - User-friendly error messages

Identify error handling gaps and provide improved implementation.

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