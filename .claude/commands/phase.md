---
description: Execute a project phase from PROJECT_BRIEF.md
argument-hint: [phase-number]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

Read PROJECT_BRIEF.md and IMPLEMENTATION_PLAN.md and execute Phase $0 only.
Before editing, summarize the phase goals and acceptance criteria.
After editing, run lint, typecheck, and relevant tests.
Update docs if architecture or commands changed.
Do not move to the next phase unless all acceptance criteria pass.
