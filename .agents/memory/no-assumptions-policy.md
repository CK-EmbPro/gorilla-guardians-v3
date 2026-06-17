---
name: No Assumptions Policy
description: Claude must not assume unclear or missing requirements — always ask the user for clarification before making any change.
---

## Rule

When a user request or prompt has unclear, incomplete, or ambiguous requirements for a change, do NOT assume intent, fill gaps with a "best guess," or silently pick a default. Stop and ask a clarifying question before writing or modifying any code, config, hook, or skill file.

This applies to:
- Vague scope ("update the checkout flow" without saying what should change)
- Missing detail on edge cases or backward-compatibility expectations
- Ambiguity about which file/role/locale/integration is affected (this app has 3 languages, 5 roles, and 2 external integrations — Shopify and Supabase — so "fix the form" or "update the dashboard" is rarely unambiguous)
- Conflicting or partially-cut-off instructions

**Why:** This codebase has documented technical debt (hardcoded Shopify/Supabase credentials, no error boundaries, stale cart validation — see Known Issues in `.claude/CLAUDE.md`) plus multi-role routing and multi-language UI. Guessing intent on an unclear request risks breaking backward compatibility, silently regressing another role/locale, or compounding existing known issues instead of fixing them.

**How to apply:** Before implementing any requested change, confirm the request specifies: (1) which file(s)/component(s)/role(s)/locale(s) are affected, (2) the exact desired behavior including edge cases, and (3) any backward-compatibility constraints. If any of these are missing or ambiguous, ask the user directly — do not proceed and do not pick a "reasonable default" on their behalf. This check applies during Phase 1 (Pre-Analysis, see `.claude/hooks/pre-hook.md`) and before any Phase 2 code generation begins.
