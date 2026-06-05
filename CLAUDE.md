# CharterBank — Claude Code Instructions

## Product

Independent, affordable **CFA Level I Q-Bank SaaS** with AI-assisted batch content
generation and strict validation. Web-first (Next.js + Supabase + Stripe). Questions
are generated offline in audited batches and only served to students after passing
quality and compliance gates.

The single source of truth for scope is [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md).
The phased build plan lives in [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

## Non-negotiables

- Do **not** copy official CFA Institute content (questions, examples, explanations,
  mock exams, EOC items, or LOS wording). All content is original.
- Do **not** use CFA Institute logos or imply endorsement, affiliation, or sponsorship.
- Do **not** promise a pass rate or "pass guarantee", or claim "official/real exam questions".
- All generated questions must pass Zod schemas **and** content quality + IP gates before publish.
- All database access must respect Row Level Security (RLS).
- Never expose the Supabase service role key or any secret to client code or logs.
- Use TypeScript **strict** mode. Prefer small, testable changes.
- Always keep the legal disclaimer present in the footer and onboarding:
  > CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.
  > This product is an independent exam preparation tool and is not endorsed by, affiliated
  > with, or sponsored by CFA Institute.

## Repository layout

```
apps/web            Next.js App Router front end + app API (Route Handlers)
packages/shared     Pure config/domain: topics, exam rules, pricing, constants (no I/O)
packages/db         Supabase migrations, seed, generated types, RLS tests (Phase 1+)
packages/ai-content Batch content pipeline: schemas, prompts, agents, runners (Phase 4+)
scripts             Dev/setup/seed scripts
docs                Product, content policy, AI pipeline, DB schema, QA, deployment docs
.claude             Subagents, custom commands, example settings
```

Package manager: **pnpm** (workspaces + Turborepo). Package scope: `@charterbank/*`.

## Commands

```bash
pnpm install        # install workspace deps
pnpm dev            # run the web app (and any dev tasks)
pnpm build          # build all packages/apps
pnpm lint           # ESLint (flat config, monorepo-wide)
pnpm typecheck      # tsc --noEmit per package
pnpm test           # vitest (unit/integration)
pnpm test:e2e       # Playwright (later phase)
pnpm format         # prettier write

# Database (Phase 1):
pnpm db:test                                         # boot throwaway Postgres, apply migrations + seed, run RLS suite
pnpm db:reset | db:migrate | db:seed                 # via Supabase CLI (supabase db reset / push)

# Content pipeline (Phase 4). Writes to Postgres when SUPABASE_DB_URL is set, else a local JSON store:
pnpm content:plan | content:generate | content:audit
pnpm content:publish | content:quarantine
```

The content pipeline store: `SUPABASE_DB_URL` → Postgres (Phase 1 tables, read by the Admin
Content Studio); otherwise an offline JSON store under `.charterbank-content/`.

## Development workflow

1. Plan before large changes; summarize phase goals + acceptance criteria first.
2. Implement in small phases — **do not skip phases** and **do not skip tests**.
3. After each phase run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` when applicable. Fix failures before moving on.
4. Update `docs/` and this file when architecture or commands change.
5. Ask before destructive database or git operations.

## UI principles

- Fast, readable, focused study environment. Mobile-first, excellent desktop mode for mocks.
- Dark/light mode. Keyboard shortcuts for answers A/B/C and next.
- Accessibility: sufficient contrast, ARIA labels, never rely on color alone for correct/incorrect.

## Security

- RLS first. Server-only Stripe and Supabase service role usage.
- In practice/mock APIs, never return `correct_option` before submit/finish (except admin).
- Validate Stripe webhook signatures server-side. No secrets in logs.

## Compliance reminders for AI content

- Draft → independently solve → validate → adversarially review → IP-check → (human review) → publish.
- Never generate content directly into production tables; never publish on a failed/critical audit.
- Exactly 3 options (A/B/C), exactly one correct answer; no forbidden option text
  (`all/none of the above`, `A and B only`, `cannot determine`, etc.).

## Subagents (see `.claude/agents/`)

`product-architect`, `database-rls-architect`, `frontend-ux-engineer`,
`ai-content-pipeline-engineer`, `cfa-domain-reviewer`, `security-billing-engineer`,
`qa-test-engineer`, `devops-release-engineer`. Use the relevant reviewer before
finalizing migrations (RLS), Stripe/auth, the content pipeline, and each feature.
