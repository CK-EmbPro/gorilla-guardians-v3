Evaluate our code for readability and naming.

Review:

1. NAMING CONVENTIONS
   - Variables: descriptive vs cryptic (e.g., 'u' vs 'user')
   - Functions: verb-based, clear intent
   - Classes: noun-based, single responsibility
   - Constants: UPPER_CASE consistency
   - Private methods: underscore convention

2. NAMING CONSISTENCY
   - camelCase vs snake_case mixing
   - Abbreviation consistency
   - Domain terminology usage
   - British vs American spelling

3. CODE READABILITY
   - Self-documenting code
   - Need for comments (too many = code smell)
   - Magic numbers/strings
   - Complex boolean expressions
   - Ternary operator abuse

4. FUNCTION SIGNATURES
   - Parameter count (>3 is a smell)
   - Boolean parameters (avoid)
   - Optional parameter handling
   - Return type clarity

Create a naming convention guide based on findings.

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