Review the codebase for design pattern usage.

Identify and evaluate:

1. CREATIONAL PATTERNS
   - Singleton usage (database connections, logger)
   - Factory pattern (object creation)
   - Builder pattern (complex object construction)
   - Are they implemented correctly?

2. STRUCTURAL PATTERNS  
   - Adapter pattern (third-party integrations)
   - Facade pattern (simplified interfaces)
   - Decorator pattern (middleware)
   - Proxy pattern (caching, lazy loading)

3. BEHAVIORAL PATTERNS
   - Strategy pattern (payment processing, auth methods)
   - Observer pattern (event handling)
   - Chain of responsibility (middleware chain)
   - Command pattern (task queuing)

4. DOMAIN PATTERNS
   - Repository pattern (data access)
   - Service layer pattern
   - DTO/Value objects
   - Domain model pattern

For each pattern found:
- Is it appropriate for the use case?
- Is it implemented correctly?
- Could a simpler solution work?
- Are there missing patterns that would improve the code?

Recommend pattern improvements with code examples.

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