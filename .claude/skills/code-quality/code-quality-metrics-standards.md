Analyze code complexity across the codebase:

Look for complex functions/methods.

Also look at functions/methods and calculate/evaluate:

1. CYCLOMATIC COMPLEXITY
   - Functions with complexity > 10
   - Nested if/else depth
   - Switch statement complexity
   - Recommend refactoring for high complexity

2. COGNITIVE COMPLEXITY
   - How hard is the code to understand?
   - Nested loops and conditions
   - Recursive calls
   - Mixed levels of abstraction

3. LINES OF CODE METRICS
   - Functions over 50 lines
   - Files over 300 lines
   - Classes over 500 lines
   - Identify candidates for splitting

4. COUPLING METRICS
   - Afferent coupling (dependencies on this module)
   - Efferent coupling (dependencies of this module)
   - Instability index
   - Identify tightly coupled modules

5. COHESION ANALYSIS
   - Are related functions grouped?
   - Single responsibility adherence
   - Module focus clarity

Provide specific refactoring recommendations for complex areas.

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