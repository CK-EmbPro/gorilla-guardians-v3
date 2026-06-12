Examine all the code in our application.

Identify and analyze code duplication in our project. Look for similar looking functions.

Check for:

1. EXACT DUPLICATES
   - Copy-pasted code blocks
   - Identical functions in different files

2. NEAR DUPLICATES
   - Similar logic with different variable names
   - Slightly modified algorithms

3. STRUCTURAL DUPLICATES
   - Similar patterns repeated
   - Boilerplate code

4. DATA DUPLICATION
   - Repeated constants
   - Configuration duplication
   - Schema duplication

For each duplication found:
- Calculate duplication percentage
- Suggest extraction method (function, class, module)
- Provide DRY (Don't Repeat Yourself) solution
- Estimate refactoring effort

Create a utilities module for common functions.

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