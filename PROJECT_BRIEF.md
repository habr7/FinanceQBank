# AI-Powered CFA Level I Q-Bank SaaS — Master Prompt para Claude Code

> **Objetivo deste arquivo:** ser usado como briefing principal no Claude Code para construir, do zero até produção, um SaaS de Q-Bank acessível para candidatos do CFA Level I, com geração assistida por IA, validação técnica em lote, boa experiência de estudo, escalabilidade e governança de conteúdo.
>
> **Como usar:** copie este arquivo para a raiz do repositório como `PROJECT_BRIEF.md`. Em seguida, inicie Claude Code no diretório e peça: `Leia PROJECT_BRIEF.md, crie CLAUDE.md, gere o plano de implementação por fases e comece pela Fase 0 sem pular testes.`

---

## 0. Contexto do Produto

A proposta é criar um Q-Bank de CFA Level I com assinatura mensal acessível, milhares de questões inéditas e explicações claras, resolvendo a dor de candidatos que acham os Q-Banks tradicionais caros.

O produto **não** deve tentar substituir o CFA Institute, o currículo oficial ou provedores licenciados. O produto deve ser um **material complementar**, com conteúdo original, auditável e com forte governança para evitar erro conceitual, alucinação, violação de direitos autorais, uso indevido de marca ou promessa enganosa de aprovação.

### Posicionamento sugerido

- Nome interno do projeto: `charterbank`.
- Nome comercial temporário: `CharterBank` ou `AnalystPrep QBank`.
- Descrição: Q-Bank independente e acessível para candidatos do CFA Level I, com prática adaptativa, simulados cronometrados, explicações passo a passo e revisão inteligente por tópicos.
- Evitar nomes que pareçam oficiais do CFA Institute.
- Exibir disclaimer no footer e no onboarding: `CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute. This product is an independent exam preparation tool and is not endorsed by, affiliated with, or sponsored by CFA Institute.`

### Regras de compliance e propriedade intelectual

**Obrigatório:**

1. Não copiar questões, exemplos, explicações, EOC questions, mock exams ou textos do CFA Institute Learning Ecosystem.
2. Não usar logo do CFA Institute.
3. Não afirmar aprovação, endosso, parceria ou status de Approved Prep Provider se isso não existir formalmente.
4. Não prometer taxa de aprovação ou “pass guarantee”.
5. Não dizer “perguntas oficiais”, “questões reais”, “mesmos autores do exame” ou equivalente.
6. Manter registro de origem de cada conceito usado para gerar questão.
7. Tratar LOS oficiais como material sensível. Apenas CFA Institute Prep Providers podem usar LOS em seus materiais. Enquanto o produto não tiver licença/aprovação, usar internamente um mapeamento de `learning_objectives` próprio, paraphraseado e baseado em tópicos/conceitos, não em reprodução textual de LOS.
8. Ter campo de `source_license` e `source_type` para todo conteúdo fonte.

**Fontes permitidas para MVP:**

- Conteúdo autoral do fundador.
- Notas próprias escritas do zero.
- Materiais licenciados para uso comercial.
- Estrutura pública de tópicos e pesos, sem copiar texto protegido além de referências gerais.
- Fórmulas financeiras padronizadas e conhecimento técnico geral, desde que as explicações sejam originais.

**Fontes proibidas sem licença explícita:**

- PDFs oficiais do currículo comprados pelo candidato.
- Learning Ecosystem.
- Mock exams oficiais.
- Practice Pack oficial.
- Questões de terceiros protegidas por copyright.
- Dumps de prova ou conteúdo vazado.

---

## 1. Objetivo Final do Produto

Construir um SaaS responsivo com:

1. Autenticação por e-mail, Google e magic link.
2. Plano gratuito sem cartão com acesso limitado a 20 questões iniciais + revisão do dashboard.
3. Assinatura mensal via Stripe para acesso ilimitado.
4. Q-Bank com questões por tópico, dificuldade, objetivo de aprendizagem, status de domínio e tipo de erro.
5. Modo prática livre.
6. Modo simulado cronometrado, com 90 segundos por questão e sessões no estilo Level I.
7. Dashboard de performance por tópico.
8. Modo revisão dos erros.
9. Bookmarks, notas pessoais e report de erro em questão.
10. Painel admin para curadoria, publicação, despublicação e auditoria de questões.
11. Pipeline offline/batch de geração e validação de questões por agentes de IA.
12. Banco de dados versionado por ano de currículo.
13. Observabilidade de uso, qualidade, erros reportados e desempenho por tópico.

---

## 2. Premissas Oficiais de Exame a Refletir no Produto

Para Level I:

- Questões de múltipla escolha.
- 3 alternativas por questão: A, B e C.
- 180 questões no exame completo.
- 2 sessões de 135 minutos.
- 90 questões por sessão.
- Tempo médio recomendado: 90 segundos por questão.
- Todas as questões têm peso igual.
- Não há penalidade por resposta errada.

### Pesos atuais de tópicos para Level I

Use esses pesos para criação de mocks e distribuição alvo do banco:

| Código | Tópico                             | Peso oficial | Peso médio usado no produto | Alocação alvo por 1.000 questões |
| ------ | ---------------------------------- | -----------: | --------------------------: | -------------------------------: |
| ETH    | Ethical and Professional Standards |       15–20% |                       17.5% |                              171 |
| QM     | Quantitative Methods               |         6–9% |                        7.5% |                               73 |
| ECON   | Economics                          |         6–9% |                        7.5% |                               73 |
| FSA    | Financial Statement Analysis       |       11–14% |                       12.5% |                              122 |
| CI     | Corporate Issuers                  |         6–9% |                        7.5% |                               73 |
| EQ     | Equity Investments                 |       11–14% |                       12.5% |                              122 |
| FI     | Fixed Income                       |       11–14% |                       12.5% |                              122 |
| DER    | Derivatives                        |         5–8% |                        6.5% |                               63 |
| AI     | Alternative Investments            |        7–10% |                        8.5% |                               83 |
| PM     | Portfolio Management               |        8–12% |                       10.0% |                               98 |

Total: 1.000 questões.

### Regras de estilo de questão

As questões devem seguir formato inspirado no padrão de Level I, sem copiar conteúdo oficial:

- Enunciado claro.
- Apenas um item por stem.
- 3 alternativas únicas.
- Evitar `except`, `true`, `false` e uso desnecessário de `not`.
- Usar qualificadores como `most likely`, `least likely`, `best described`, `most appropriate`, `most accurate`, `least appropriate`, `least accurate` quando fizer sentido.
- Nunca usar:
  - `all of the above`
  - `none of the above`
  - `A and B only`
  - `B and C only`
  - `A and C only`
  - `cannot determine`
  - `cannot calculate`
  - `not enough information to determine`
- Alternativas numéricas devem ser ordenadas do menor para o maior valor.
- Alternativas textuais devem ser preferencialmente ordenadas da mais curta para a mais longa, desde que isso não gere padrão óbvio.
- A explicação precisa justificar a correta e explicar por que as duas incorretas são plausíveis, mas erradas.

---

## 3. Stack Técnica Recomendada

### Frontend

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui para componentes.
- React Hook Form + Zod.
- TanStack Query para cache client-side, se necessário.
- Recharts para gráficos simples.
- KaTeX/MathJax para fórmulas.
- Zustand ou nuqs para estado leve de sessões.

### Backend

- Supabase:
  - PostgreSQL.
  - Auth.
  - Row Level Security.
  - Storage para uploads internos/licenciados, se necessário.
  - Edge Functions apenas onde fizer sentido.
- Next.js Route Handlers para API do app.
- Drizzle ORM ou Supabase SQL migrations. Preferência: **Supabase migrations + generated types** para manter RLS transparente.
- Stripe Billing para assinatura.
- Trigger.dev ou Inngest para jobs assíncronos do pipeline de conteúdo.
- PostHog para analytics de produto.
- Sentry para erros.
- LangSmith, Langfuse ou Helicone para tracing/custo de chamadas LLM.

### Pipeline de IA

Opção preferida para MVP solo dev: TypeScript end-to-end.

- `packages/ai-content` com:
  - Vercel AI SDK ou SDKs diretos Anthropic/OpenAI.
  - Zod schemas para structured output.
  - Prompts versionados em arquivos `.md`.
  - Runner CLI para batch generation.
  - State machine de qualidade.

Opcional em fase futura:

- Python para validadores matemáticos avançados, com SymPy/Pandas, exposto via script CLI chamado pelo pipeline.

---

## 4. Arquitetura do Repositório

Criar um monorepo simples:

```txt
charterbank/
  apps/
    web/
      app/
      components/
      lib/
      public/
      middleware.ts
      next.config.ts
      package.json
  packages/
    db/
      supabase/
        migrations/
        seed/
      src/
        types.ts
        queries.ts
        rls-tests.ts
    ai-content/
      src/
        agents/
        schemas/
        runners/
        validators/
        prompts/
        utils/
      tests/
      package.json
    shared/
      src/
        constants.ts
        topics.ts
        exam.ts
        pricing.ts
  scripts/
    setup-dev.ts
    seed-demo.ts
    reset-local-db.sh
  .claude/
    agents/
    commands/
    settings.example.json
  docs/
    PRODUCT_SPEC.md
    CONTENT_POLICY.md
    AI_PIPELINE.md
    DB_SCHEMA.md
    QA_CHECKLIST.md
    DEPLOYMENT.md
  .env.example
  package.json
  pnpm-workspace.yaml
  turbo.json
  CLAUDE.md
  PROJECT_BRIEF.md
```

### Package manager

Use `pnpm`.

### Comandos obrigatórios

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm db:reset
pnpm db:migrate
pnpm db:seed
pnpm content:plan
pnpm content:generate
pnpm content:audit
pnpm content:publish
pnpm content:quarantine
```

---

## 5. Variáveis de Ambiente

Criar `.env.example`:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=CharterBank
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_MONTHLY_ID=
STRIPE_PRICE_ANNUAL_ID=

# LLM Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
AI_DEFAULT_GENERATOR_MODEL=claude-sonnet
AI_DEFAULT_VALIDATOR_MODEL=claude-opus
AI_LOW_COST_MODEL=claude-haiku

# Observability
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=

# Jobs
TRIGGER_SECRET_KEY=
TRIGGER_PROJECT_REF=

# Admin
ADMIN_EMAILS=humbertojunior7@gmail.com
```

---

## 6. Banco de Dados — Modelo Escalável

Não usar apenas uma tabela `questions`. O banco precisa suportar versionamento curricular, auditoria, tentativa, revisão, reports e assinaturas.

### Entidades principais

#### `profiles`

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin', 'reviewer')),
  subscription_status text not null default 'free' check (subscription_status in ('free', 'trial', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `curriculum_versions`

```sql
create table curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  level text not null default 'I',
  is_active boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique(year, level)
);
```

#### `topics`

```sql
create table topics (
  code text primary key,
  name text not null,
  exam_weight_min numeric(5,2) not null,
  exam_weight_max numeric(5,2) not null,
  display_order int not null
);
```

#### `learning_objectives`

Não reproduzir LOS oficiais textualmente sem licença. Usar objetivos internos.

```sql
create table learning_objectives (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references curriculum_versions(id) on delete cascade,
  topic_code text not null references topics(code),
  module_name text not null,
  objective_code text not null,
  internal_objective text not null,
  source_policy text not null default 'internal_paraphrase',
  status text not null default 'active' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  unique(curriculum_version_id, objective_code)
);
```

#### `source_documents`

```sql
create table source_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null check (source_type in ('founder_notes', 'licensed_material', 'public_outline', 'internal_summary')),
  source_license text not null,
  storage_path text,
  checksum text,
  curriculum_version_id uuid references curriculum_versions(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
```

#### `source_chunks`

```sql
create table source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references source_documents(id) on delete cascade,
  topic_code text references topics(code),
  learning_objective_id uuid references learning_objectives(id),
  chunk_text text not null,
  chunk_hash text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);
```

Se não quiser instalar `pgvector` no MVP, deixar embedding para fase futura.

#### `questions`

```sql
create table questions (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references curriculum_versions(id),
  topic_code text not null references topics(code),
  learning_objective_id uuid references learning_objectives(id),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  cognitive_level text not null default 'application' check (cognitive_level in ('recall', 'comprehension', 'application', 'analysis')),
  stem text not null,
  vignette text,
  correct_option text not null check (correct_option in ('A', 'B', 'C')),
  explanation_md text not null,
  formula_md text,
  calculator_hint_md text,
  common_trap_md text,
  status text not null default 'draft' check (status in ('draft', 'ai_validated', 'human_review', 'published', 'quarantined', 'retired')),
  quality_score numeric(5,2),
  ai_confidence numeric(5,2),
  ip_similarity_score numeric(5,2),
  generated_by_model text,
  validated_by_model text,
  prompt_version text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `question_options`

```sql
create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null check (label in ('A', 'B', 'C')),
  option_text text not null,
  rationale_md text,
  unique(question_id, label)
);
```

#### `question_source_chunks`

```sql
create table question_source_chunks (
  question_id uuid references questions(id) on delete cascade,
  source_chunk_id uuid references source_chunks(id) on delete restrict,
  relevance_score numeric(5,2),
  primary key (question_id, source_chunk_id)
);
```

#### `question_audits`

```sql
create table question_audits (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  audit_type text not null check (audit_type in ('independent_solver', 'validator', 'adversarial_review', 'math_check', 'ip_check', 'human_review')),
  result text not null check (result in ('pass', 'warning', 'fail', 'corrected')),
  findings jsonb not null default '{}'::jsonb,
  corrected_payload jsonb,
  model text,
  reviewer_id uuid references profiles(id),
  created_at timestamptz not null default now()
);
```

#### `practice_sessions`

```sql
create table practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null check (mode in ('practice', 'review_errors', 'mock_half', 'mock_full', 'adaptive')),
  topic_filter text[],
  difficulty_filter text[],
  total_questions int not null,
  time_limit_seconds int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
```

#### `attempts`

```sql
create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  session_id uuid references practice_sessions(id) on delete set null,
  question_id uuid not null references questions(id) on delete restrict,
  chosen_option text check (chosen_option in ('A', 'B', 'C')),
  is_correct boolean not null,
  response_time_seconds int,
  confidence_rating int check (confidence_rating between 1 and 5),
  answered_at timestamptz not null default now()
);
```

#### `bookmarks`

```sql
create table bookmarks (
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, question_id)
);
```

#### `user_question_notes`

```sql
create table user_question_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  note_md text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, question_id)
);
```

#### `question_reports`

```sql
create table question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  question_id uuid not null references questions(id) on delete cascade,
  report_type text not null check (report_type in ('wrong_answer', 'ambiguous', 'typo', 'outdated', 'explanation_unclear', 'other')),
  message text,
  status text not null default 'open' check (status in ('open', 'triaged', 'fixed', 'wont_fix')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

#### `spaced_repetition_cards`

```sql
create table spaced_repetition_cards (
  user_id uuid references profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  ease_factor numeric(5,2) not null default 2.50,
  interval_days int not null default 1,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key(user_id, question_id)
);
```

---

## 7. RLS — Segurança no Supabase

### Regras mínimas

1. Usuário só lê e altera seu próprio `profile`, `attempts`, `bookmarks`, `notes`, `practice_sessions` e `spaced_repetition_cards`.
2. Usuário só lê questões com `status = 'published'`.
3. Admin/reviewer pode ler drafts, audits, reports e publicar/despublicar.
4. Service role pode executar pipeline de conteúdo.
5. Stripe webhook só altera assinatura via rota server-side com assinatura validada.

### Helpers

Criar função SQL:

```sql
create or replace function is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'reviewer')
  );
$$;
```

### Testes de RLS obrigatórios

Criar testes para:

- Aluno A não vê tentativas de aluno B.
- Aluno não vê questão draft.
- Usuário free não consegue gerar sessão com mais de 20 questões desbloqueadas.
- Admin vê reports e drafts.
- Usuário não consegue alterar `subscription_status` manualmente.

---

## 8. Produto — Jornadas e Telas

### 8.1 Landing Page

Objetivo: vender sozinho.

Seções:

1. Hero:
   - `Affordable CFA Level I practice. Clear explanations. Smarter review.`
   - CTA: `Start free — no card required`.
2. Dor:
   - Q-Banks caros.
   - Dificuldade de saber onde errar menos.
   - Falta de explicações didáticas.
3. Solução:
   - Questões originais.
   - Dashboard por tópico.
   - Simulados cronometrados.
   - Review dos erros.
4. Como funciona:
   - Practice.
   - Learn from explanations.
   - Review weak topics.
   - Simulate exam pressure.
5. Pricing:
   - Free: 20 questions.
   - Monthly: preço acessível.
   - Annual: desconto.
6. Disclaimer legal.
7. FAQ.

### 8.2 Onboarding

Fluxo:

1. Login via Google/magic link.
2. Perguntar:
   - Data estimada do exame.
   - Horas disponíveis por semana.
   - Tópicos fortes/fracos.
   - Nível de familiaridade com finanças.
3. Gerar plano inicial:
   - `Start with 20 diagnostic questions`.
   - Distribuição balanceada por tópico.
4. Mostrar baseline após responder.

### 8.3 Dashboard

Componentes:

- Overall accuracy.
- Questions answered.
- Average response time.
- Accuracy by topic.
- Radar chart por tópico.
- Weak topics below 70%.
- Due reviews today.
- Streak.
- Suggested next session.

### 8.4 Practice Mode

Filtros:

- Topic.
- Difficulty.
- New questions only.
- Incorrect only.
- Bookmarked.
- Timed/untimed.
- Number of questions.

Comportamento:

- Mostrar enunciado e alternativas.
- Após responder:
  - Mostrar correta/incorreta.
  - Explicação completa.
  - Racional por alternativa.
  - Fórmulas.
  - Botões: bookmark, report issue, add note.

### 8.5 Mock Mode

Tipos:

- Half mock: 90 questions, 135 minutes.
- Full mock: 180 questions, 270 minutes, com break opcional entre sessões.
- Mini mock: 30 questions, proporção por tópico.

Comportamento:

- Sem explicação durante o simulado.
- Timer visível.
- Navegação entre questões.
- Marcar para revisão.
- Resultado só no final.
- Review pós-simulado com breakdown por tópico e tipo de erro.

### 8.6 Admin Content Studio

Telas:

1. Lista de questões.
2. Filtros por status, tópico, dificuldade, score e reports.
3. Viewer de questão.
4. Histórico de auditoria.
5. Botão `Publish`, `Quarantine`, `Retire`.
6. Reports de usuários.
7. Batch jobs de IA.
8. Métricas de qualidade:
   - fail rate por agente.
   - reports por 100 tentativas.
   - questões com baixa discriminação.
   - questões muito fáceis/difíceis.

---

## 9. Pipeline de Conteúdo com Agentes

### Princípio central

Questões nunca são geradas em tempo real para o estudante. Todo conteúdo é criado em lote, auditado, versionado e publicado apenas após passar pelos gates.

### State machine de conteúdo

```txt
source_ingested
  -> blueprint_created
  -> generated_draft
  -> independently_solved
  -> validated
  -> adversarial_reviewed
  -> ip_checked
  -> ai_validated
  -> human_review_optional
  -> published
  -> quarantined / retired
```

### Gates de publicação

Uma questão só pode ir para `published` se:

- Possui 3 alternativas.
- Possui exatamente uma resposta correta.
- Explicação existe e tem racional das 3 alternativas.
- Validator concordou com o gabarito.
- Adversarial reviewer não encontrou ambiguidade crítica.
- IP similarity abaixo do threshold definido.
- Não contém palavras proibidas de alternativa.
- Dificuldade e tópico foram tagueados.
- `quality_score >= 85`.
- `ai_confidence >= 0.85`.

No MVP, exigir `human_review` para as primeiras 500 questões antes de publicar.

---

## 10. Agentes de Conteúdo — Desenho Completo

Implementar em `packages/ai-content/src/agents`.

### 10.1 Agent Orchestrator

Responsável por controlar jobs e transições de estado.

Ferramentas:

- Trigger.dev/Inngest para fila.
- Supabase service role para gravar drafts e audits.
- Langfuse/LangSmith para tracing.
- Zod para validar output.

Pseudo-interface:

```ts
export type ContentJobType =
  | "create_blueprint"
  | "generate_question"
  | "solve_independently"
  | "validate_question"
  | "adversarial_review"
  | "ip_similarity_check"
  | "publish_batch";

export async function runContentJob(jobId: string): Promise<void>;
export async function transitionQuestionStatus(
  questionId: string,
  nextStatus: QuestionStatus,
): Promise<void>;
```

### 10.2 Agent 0 — Curriculum Mapper

**Objetivo:** transformar fontes permitidas em mapa de tópicos, módulos e objetivos internos.

**Entrada:** documento fonte, tópico, versão curricular, regras de compliance.

**Saída JSON:**

```json
{
  "curriculum_version": "2026-L1",
  "topic_code": "FSA",
  "module_name": "Inventories",
  "internal_objectives": [
    {
      "objective_code": "FSA-INV-001",
      "internal_objective": "Explain how inventory cost flow assumptions affect COGS, ending inventory, and profitability ratios under rising and falling prices.",
      "source_policy": "internal_paraphrase",
      "risk_notes": "Do not reproduce official LOS wording."
    }
  ]
}
```

**System prompt:**

```txt
You are a curriculum architect for an independent CFA Level I exam-preparation product.
Your task is to convert permitted source material into internal learning objectives.
Never reproduce copyrighted text or official LOS verbatim. Create concise internal objectives in original wording.
Focus on testable skills, formulas, conceptual distinctions, and common candidate mistakes.
Return only valid JSON matching the schema.
```

### 10.3 Agent 1 — Question Blueprint Planner

**Objetivo:** criar blueprint antes de gerar a questão.

**Saída:** conceito testado, erro comum, fórmula, distratores planejados.

```json
{
  "topic_code": "FI",
  "objective_code": "FI-DUR-002",
  "difficulty": "medium",
  "question_type": "calculation",
  "tested_concept": "Modified duration approximation of bond price change",
  "common_mistake": "Using duration with bps as whole percent rather than decimal change",
  "distractor_strategy": {
    "A": "Wrong sign",
    "B": "Correct answer",
    "C": "Macaulay duration used directly without yield adjustment"
  },
  "requires_calculation": true,
  "formula_refs": ["%ΔP ≈ -ModDur × ΔY"]
}
```

**System prompt:**

```txt
You are a CFA Level I question blueprint planner for an independent Q-Bank.
Design a blueprint for one original multiple-choice question.
The blueprint must test one concept only.
Plan plausible distractors based on real candidate mistakes.
Do not write the final question yet.
Never copy or imitate official CFA Institute questions.
Return only JSON.
```

### 10.4 Agent 2 — Question Generator

**Objetivo:** gerar questão original com 3 alternativas e explicação.

**Schema Zod obrigatório:**

```ts
export const GeneratedQuestionSchema = z.object({
  curriculum_version: z.string(),
  topic_code: z.enum(["ETH", "QM", "ECON", "FSA", "CI", "EQ", "FI", "DER", "AI", "PM"]),
  objective_code: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  cognitive_level: z.enum(["recall", "comprehension", "application", "analysis"]),
  question_type: z.enum(["conceptual", "calculation", "mini_case"]),
  stem: z.string().min(40),
  vignette: z.string().optional().nullable(),
  options: z
    .array(
      z.object({
        label: z.enum(["A", "B", "C"]),
        text: z.string().min(1),
        rationale: z.string().min(20),
      }),
    )
    .length(3),
  correct_option: z.enum(["A", "B", "C"]),
  explanation_md: z.string().min(100),
  formula_md: z.string().optional().nullable(),
  calculator_hint_md: z.string().optional().nullable(),
  common_trap_md: z.string().optional().nullable(),
  source_chunk_ids: z.array(z.string()).optional(),
  quality_self_check: z.object({
    single_best_answer: z.boolean(),
    no_forbidden_options: z.boolean(),
    no_official_content_copied: z.boolean(),
    numerical_options_ordered: z.boolean().optional(),
    explanation_covers_all_options: z.boolean(),
  }),
});
```

**System prompt:**

```txt
You are a senior CFA charterholder-style educator and exam-prep author creating original CFA Level I practice questions for an independent Q-Bank.

Critical requirements:
- Create original content only.
- Do not copy official CFA Institute questions, examples, explanations, or wording.
- Do not reproduce official LOS wording.
- Use exactly three answer options: A, B, C.
- There must be exactly one best answer.
- Avoid cheap linguistic tricks. Test technical understanding.
- Do not use: all of the above, none of the above, A and B only, B and C only, A and C only, cannot determine, cannot calculate, not enough information to determine.
- Avoid except/true/false stems and avoid 'not' unless unavoidable.
- Prefer CFA-like qualifiers where appropriate: most likely, least likely, best described, most appropriate, most accurate, least appropriate, least accurate.
- Distractors must be plausible and based on common candidate mistakes.
- If options are numerical, order them from smallest to largest.
- Explanation must justify the correct answer and explain why the other two options are wrong.
- Use Markdown for formulas and explanations.

Return only valid JSON matching the provided schema.
```

### 10.5 Agent 3 — Independent Solver

**Objetivo:** resolver a questão sem ver gabarito nem explicação.

**Entrada:** stem + options apenas.

**Saída:** resposta independente, cálculo, confiança.

```json
{
  "independent_answer": "B",
  "confidence": 0.92,
  "solution_md": "...",
  "calculation_steps": ["..."],
  "potential_ambiguities": []
}
```

**System prompt:**

```txt
You are an independent technical solver for a CFA Level I practice question.
You will receive only the question stem, vignette if any, and answer choices.
Solve from scratch. Do not infer or assume the generator's intended answer.
Show concise reasoning in Markdown, including calculations when relevant.
Flag ambiguity if more than one option could reasonably be correct.
Return only valid JSON.
```

### 10.6 Agent 4 — Validator / Corrector

**Objetivo:** comparar a resposta independente com o gabarito do gerador e corrigir se necessário.

**Saída:** pass/warning/fail/corrected.

```json
{
  "result": "pass",
  "final_correct_option": "B",
  "confidence": 0.95,
  "findings": [],
  "corrected_question": null
}
```

**System prompt:**

```txt
You are a strict technical validator for an independent CFA Level I Q-Bank.
Compare the generated question and answer with the independent solver output.
Your job is to prevent conceptual mistakes, math errors, ambiguous items, outdated rules, and poor explanations.
If the question can be fixed without changing the tested concept, return a corrected version.
If it cannot be fixed safely, return result='fail'.
Return only valid JSON.
```

### 10.7 Agent 5 — Adversarial Reviewer

**Objetivo:** caçar problemas que os agentes anteriores podem deixar passar.

Checklist:

- Ambiguidade.
- Mais de uma resposta correta.
- Informação insuficiente.
- Enunciado que depende de regra não informada.
- Distrator absurdo.
- Fórmula mal explicada.
- Alternativa com padrão óbvio.
- Linguagem que imita conteúdo oficial.
- Questão excessivamente longa.
- Pegadinha linguística.

**System prompt:**

```txt
You are an adversarial exam-quality reviewer.
Assume the question has a hidden flaw and try to find it.
Review for ambiguity, fairness, technical accuracy, clarity, answer uniqueness, explanation quality, and IP/copyright risk.
Do not be polite. Be precise.
Return JSON with severity='none'|'minor'|'major'|'critical'.
A question with critical severity must not be published.
```

### 10.8 Agent 6 — IP Similarity / Copyright Risk Checker

**Objetivo:** reduzir risco de conteúdo copiado.

MVP:

- Similarity simples por n-gram contra fontes internas proibidas/licenciadas.
- Fuzzy matching de stems e explicações.
- Flag se stem muito parecido com fonte.

Fase futura:

- Embeddings + near-duplicate search.
- Hashes de shingles.

**System prompt:**

```txt
You are an IP-risk reviewer for an independent educational Q-Bank.
Your task is not to judge technical correctness. Your task is to flag whether the item appears copied, too closely paraphrased, or misleadingly official.
Return a risk score from 0 to 1 and concrete reasons.
If risk >= 0.35, recommend quarantine.
Return only JSON.
```

### 10.9 Agent 7 — Difficulty Calibrator

**Objetivo:** calibrar dificuldade com base em regras e dados de usuários.

Inicialmente heurístico:

- Easy: conceito direto, 1 passo, fórmula básica.
- Medium: 2–3 passos, distratores plausíveis, combinação de conceitos simples.
- Hard: múltiplos conceitos, exceções técnicas, interpretação de mini-case.

Depois usar dados:

- Se accuracy > 80%, reduzir dificuldade.
- Se accuracy < 45%, aumentar dificuldade ou revisar clareza.
- Se tempo médio muito alto e accuracy baixa, mandar para revisão.

---

## 11. Controle Operacional dos Agentes de Conteúdo

### Tabelas de jobs

Criar `content_jobs`:

```sql
create table content_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
```

### CLI de controle

Implementar:

```bash
# Cria plano de produção de conteúdo proporcional aos pesos do exame
pnpm content:plan -- --curriculum=2026-L1 --target=1000

# Gera drafts para um tópico
pnpm content:generate -- --topic=FSA --count=25 --difficulty=medium

# Roda solver + validator + adversarial + IP check em drafts
pnpm content:audit -- --batch=<job_id>

# Publica apenas questões que passaram nos gates
pnpm content:publish -- --batch=<job_id> --require-human-review=true

# Quarentena manual ou automática
pnpm content:quarantine -- --question=<question_id> --reason="Ambiguous explanation"
```

### Admin UI

No app admin:

- Botão `Generate Batch`.
- Botão `Audit Batch`.
- Botão `Publish Passing Questions`.
- Fila de revisão humana.
- Histórico por agente.
- Reexecução individual de agente.
- Custos por batch.

### Observabilidade

Logar por chamada:

- `job_id`.
- `question_id`.
- `agent_name`.
- `model`.
- `prompt_version`.
- `input_tokens`.
- `output_tokens`.
- `cost_estimate_usd`.
- `latency_ms`.
- `result`.

---

## 12. Claude Code — Como Controlar Agentes de Desenvolvimento

Claude Code deve ser usado com subagentes especializados para manter contexto limpo e acelerar desenvolvimento.

### 12.1 Criar `CLAUDE.md`

Gerar `CLAUDE.md` com:

```md
# CharterBank — Claude Code Instructions

## Product

Independent, affordable CFA Level I Q-Bank SaaS with AI-assisted batch content generation and strict validation.

## Non-negotiables

- Do not copy official CFA Institute content.
- Do not use CFA Institute logos or imply endorsement.
- All generated questions must pass Zod schemas and content quality gates.
- All database access must respect RLS.
- Never expose service role keys client-side.
- Use TypeScript strict mode.
- Prefer small, testable changes.

## Commands

- pnpm lint
- pnpm typecheck
- pnpm test
- pnpm build
- pnpm db:reset
- pnpm content:generate
- pnpm content:audit

## Development workflow

1. Plan before large changes.
2. Implement in small phases.
3. Run tests after each phase.
4. Update docs when architecture changes.
5. Ask before destructive database or git operations.

## UI principles

- Fast, readable, focused study environment.
- Mobile-first but excellent desktop mode for mock exams.
- Dark/light mode.
- Keyboard shortcuts for answers A/B/C and next.

## Security

- RLS first.
- Server-only Stripe and Supabase service role usage.
- No secrets in logs.
```

### 12.2 Subagentes Claude Code

Criar arquivos em `.claude/agents/`.

#### `.claude/agents/product-architect.md`

```md
---
name: product-architect
model: opus
color: purple
description: Use for product architecture, feature prioritization, user flows, SaaS UX, PLG, and monetization decisions.
tools: Read, Grep, Glob
---

You are a senior product architect for an exam-prep SaaS.
Focus on user outcomes, retention, activation, conversion, and simplicity.
Do not edit files. Provide clear implementation recommendations, acceptance criteria, and tradeoffs.
Always enforce the product's compliance constraints: independent product, no CFA Institute endorsement, no copied content, no pass guarantees.
```

#### `.claude/agents/database-rls-architect.md`

```md
---
name: database-rls-architect
model: sonnet
color: blue
description: Use for Supabase/Postgres schema design, migrations, indexes, RLS policies, and SQL correctness.
tools: Read, Grep, Glob, Bash
---

You are a senior Postgres and Supabase RLS architect.
Review schemas, migrations, policies, indexes, and query patterns.
Prioritize data integrity, least-privilege access, performance, and testability.
Never expose service role keys to client code.
When reviewing RLS, include concrete abuse cases and tests.
```

#### `.claude/agents/frontend-ux-engineer.md`

```md
---
name: frontend-ux-engineer
model: sonnet
color: cyan
description: Use for Next.js UI, shadcn/ui, Tailwind, study experience, accessibility, keyboard shortcuts, and responsive design.
tools: Read, Grep, Glob, Bash, Edit, Write
isolation: worktree
---

You are a senior frontend engineer and UX designer for learning products.
Build fast, accessible, responsive components.
Prioritize readability, keyboard navigation, low cognitive load, and a Prometric-like mock experience.
Use TypeScript, Tailwind, and shadcn/ui.
After changes, run relevant lint/typecheck/test commands.
```

#### `.claude/agents/ai-content-pipeline-engineer.md`

```md
---
name: ai-content-pipeline-engineer
model: opus
color: orange
description: Use for LLM content generation, structured output, Zod schemas, validation agents, prompt versioning, batch jobs, and quality gates.
tools: Read, Grep, Glob, Bash, Edit, Write
isolation: worktree
effort: high
---

You are a senior AI systems engineer building a high-accuracy educational content pipeline.
Design deterministic state machines, strict JSON schemas, retries, tracing, model routing, quality gates, and audit logs.
Never generate content directly into production tables. Draft first, validate, audit, then publish.
Prevent hallucination, ambiguity, math errors, and IP similarity risks.
```

#### `.claude/agents/cfa-domain-reviewer.md`

```md
---
name: cfa-domain-reviewer
model: opus
color: green
description: Use for reviewing CFA Level I domain logic, formulas, question quality, explanations, and topic mapping. Read-only reviewer.
tools: Read, Grep, Glob
---

You are a CFA Level I domain reviewer for an independent exam-prep product.
Review technical finance content for conceptual accuracy, mathematical correctness, clarity, and fair distractors.
You must also flag compliance risks: copied official content, official-looking claims, endorsement claims, or reproducing official LOS text.
Do not edit files. Return specific findings and suggested fixes.
```

#### `.claude/agents/security-billing-engineer.md`

```md
---
name: security-billing-engineer
model: sonnet
color: red
description: Use for Stripe integration, auth, webhook security, entitlement logic, secrets handling, abuse prevention, and secure deployment.
tools: Read, Grep, Glob, Bash
---

You are a SaaS security and billing engineer.
Review authentication, authorization, Stripe webhooks, subscription entitlement, env vars, secret handling, and abuse vectors.
Be strict. Identify anything that could leak data, allow free access to paid content, or expose service credentials.
```

#### `.claude/agents/qa-test-engineer.md`

```md
---
name: qa-test-engineer
model: sonnet
color: yellow
description: Use for unit tests, integration tests, Playwright tests, RLS tests, quality gates, and regression prevention.
tools: Read, Grep, Glob, Bash, Edit, Write
isolation: worktree
---

You are a QA automation engineer.
Create focused tests for critical user flows and backend invariants.
Prioritize auth, subscription gating, RLS, practice sessions, mock timers, and content pipeline gates.
Run tests and report failures clearly.
```

#### `.claude/agents/devops-release-engineer.md`

```md
---
name: devops-release-engineer
model: sonnet
color: pink
description: Use for deployment, CI/CD, Vercel, Supabase migrations, env setup, monitoring, and release checklists.
tools: Read, Grep, Glob, Bash, Edit, Write
isolation: worktree
---

You are a DevOps/release engineer for a one-person SaaS.
Keep infrastructure simple, safe, and observable.
Implement CI checks, deployment docs, env validation, migration safety, Sentry, and rollback steps.
Avoid overengineering.
```

### 12.3 Como usar os subagentes no Claude Code

No Claude Code:

1. Rodar `/init` no primeiro uso.
2. Criar os arquivos em `.claude/agents/`.
3. Reiniciar a sessão para carregar subagentes criados manualmente.
4. Usar `/agents` para verificar se foram detectados.
5. Durante desenvolvimento:
   - Pedir ao `product-architect` para revisar fluxo antes de criar telas grandes.
   - Pedir ao `database-rls-architect` para revisar toda migration.
   - Pedir ao `ai-content-pipeline-engineer` para construir ou revisar agentes de conteúdo.
   - Pedir ao `security-billing-engineer` antes de finalizar Stripe/Auth.
   - Pedir ao `qa-test-engineer` após cada feature.

Exemplo de pedido no Claude Code:

```txt
Use the database-rls-architect subagent to review the migrations and RLS policies for profiles, questions, attempts, subscriptions, and admin access. Return required fixes before implementation.
```

### 12.4 Custom Commands

Criar `.claude/commands/phase.md`:

```md
---
description: Execute a project phase from PROJECT_BRIEF.md
argument-hint: [phase-number]
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

Read PROJECT_BRIEF.md and execute Phase $0 only.
Before editing, summarize the phase goals and acceptance criteria.
After editing, run lint, typecheck, and relevant tests.
Update docs if architecture or commands changed.
Do not move to the next phase unless all acceptance criteria pass.
```

Criar `.claude/commands/review-content-pipeline.md`:

```md
---
description: Review the AI content pipeline for safety, quality, and publish gates
allowed-tools: Read, Grep, Glob, Bash
---

Review packages/ai-content and all content-related database tables.
Check for schema validation, prompt versioning, audit logs, retry behavior, hallucination risk, IP-risk checks, and publication gates.
Return critical, major, and minor issues with file references.
```

Criar `.claude/commands/security-pass.md`:

```md
---
description: Run a security review before deployment
allowed-tools: Read, Grep, Glob, Bash
---

Run a security pass for auth, Supabase RLS, Stripe webhook validation, environment variables, admin routes, server/client boundaries, and logging.
Do not edit. Return a prioritized checklist with exact files and fixes.
```

### 12.5 Hooks Claude Code

Criar `.claude/settings.example.json`:

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf /)",
      "Bash(rm -rf ~)",
      "Bash(git push --force*)",
      "Bash(supabase db reset --linked*)",
      "Read(.env)",
      "Read(.env.local)",
      "Read(**/*secret*)"
    ],
    "ask": [
      "Bash(git push*)",
      "Bash(supabase db reset*)",
      "Bash(supabase migration repair*)",
      "Bash(stripe*)"
    ],
    "allow": [
      "Bash(pnpm lint*)",
      "Bash(pnpm typecheck*)",
      "Bash(pnpm test*)",
      "Bash(pnpm build*)",
      "Bash(pnpm db:migrate*)",
      "Bash(pnpm db:seed*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm prettier --write $(jq -r '.tool_input.file_path') || true"
          }
        ]
      }
    ]
  }
}
```

Copiar para `.claude/settings.local.json` localmente e ajustar.

### 12.6 MCP recomendado

Usar MCP apenas quando realmente necessário, com cautela contra prompt injection.

MCPs úteis:

1. GitHub MCP: issues/PRs.
2. Supabase/Postgres MCP: consultar schema local/dev, nunca produção sem read-only.
3. Playwright MCP: testar UI real.
4. Sentry MCP: investigar erros de produção.
5. Stripe MCP: opcional, preferir CLI/API com cuidado.

Regra: MCP de banco de produção deve ser read-only por padrão.

---

## 13. Implementação por Fases no Claude Code

### Fase 0 — Bootstrap e documentação

Objetivo:

- Criar monorepo.
- Configurar Next.js, TypeScript, Tailwind, shadcn/ui.
- Criar docs iniciais.
- Criar `.env.example`.
- Criar `CLAUDE.md`.
- Criar subagentes e commands.

Prompt para Claude Code:

```txt
Leia PROJECT_BRIEF.md. Execute apenas a Fase 0.
Crie o monorepo, estrutura de pastas, configs TypeScript, lint, prettier, Tailwind, shadcn/ui, docs iniciais, CLAUDE.md, .env.example, .claude/agents e .claude/commands.
Não implemente banco nem produto ainda.
No final, rode pnpm lint, pnpm typecheck e pnpm build, corrigindo erros.
```

Acceptance criteria:

- `pnpm install` funciona.
- `pnpm dev` sobe homepage básica.
- `pnpm lint/typecheck/build` passam.
- `docs/` inicial criado.

### Fase 1 — Banco, Auth e RLS

Objetivo:

- Configurar Supabase.
- Criar migrations principais.
- Criar RLS.
- Criar auth no app.
- Criar seed inicial de tópicos/pesos.

Prompt:

```txt
Execute apenas a Fase 1 do PROJECT_BRIEF.md.
Implemente Supabase migrations para profiles, curriculum_versions, topics, learning_objectives, questions, options, attempts, sessions, bookmarks, notes, reports e audits.
Implemente RLS e testes básicos de RLS.
Crie auth com Supabase no Next.js.
Crie seed dos tópicos Level I com pesos oficiais e distribuição alvo.
Use o database-rls-architect para revisar antes de finalizar.
```

Acceptance criteria:

- Migrations rodam do zero.
- RLS impede leitura cruzada.
- Usuário loga e cria profile.
- Seed cria 10 tópicos.

### Fase 2 — UI de estudo MVP

Objetivo:

- Dashboard básico.
- Practice mode.
- Question card.
- Answer submission.
- Explicação pós-resposta.
- Bookmarks e reports.

Prompt:

```txt
Execute apenas a Fase 2.
Construa a experiência MVP de estudo: dashboard, lista de tópicos, criação de prática, card de questão, envio de resposta, explicação pós-resposta, bookmark, note e report issue.
Use frontend-ux-engineer para componentes principais e qa-test-engineer para testes.
```

Acceptance criteria:

- Usuário responde questão publicada.
- Attempt é salvo.
- Dashboard mostra accuracy por tópico.
- Usuário reporta issue.
- Testes básicos passam.

### Fase 3 — Stripe e Entitlements

Objetivo:

- Checkout mensal/anual.
- Customer portal.
- Webhook seguro.
- Gating free vs paid.

Prompt:

```txt
Execute apenas a Fase 3.
Implemente Stripe Billing com checkout, customer portal, webhook assinado, status de assinatura em profiles e gating de acesso.
Free users podem acessar apenas 20 questões. Active users têm acesso ilimitado.
Use security-billing-engineer para revisar antes de finalizar.
```

Acceptance criteria:

- Webhook valida assinatura.
- Cliente free é bloqueado após 20 questões.
- Usuário active acessa Q-Bank.
- Não há secrets no client bundle.

### Fase 4 — AI Content Pipeline MVP

Objetivo:

- Criar schemas Zod.
- Criar prompts versionados.
- Criar runner CLI.
- Criar agents generator, independent solver, validator, adversarial reviewer, IP checker.
- Criar tables/jobs/audits.
- Gerar batch demo com fontes dummy autorais.

Prompt:

```txt
Execute apenas a Fase 4.
Implemente packages/ai-content com schemas Zod, prompt templates, runner CLI, agents de blueprint, generator, independent solver, validator, adversarial reviewer, IP checker e publish gate.
Use apenas source_documents dummy autorais no seed.
Nunca publique questão sem passar pelos gates.
Use ai-content-pipeline-engineer e cfa-domain-reviewer para revisar.
```

Acceptance criteria:

- `pnpm content:generate -- --topic=QM --count=3` cria drafts.
- `pnpm content:audit` cria audits.
- `pnpm content:publish` só publica passing questions.
- Falhas entram em quarantine.
- Outputs inválidos são rejeitados por Zod.

### Fase 5 — Admin Content Studio

Objetivo:

- Admin UI.
- Listar questions por status.
- Ver audits.
- Publicar/quarentenar.
- Ver reports.
- Reexecutar audit.

Prompt:

```txt
Execute apenas a Fase 5.
Crie Admin Content Studio protegido por role admin/reviewer.
Permita visualizar questões, opções, explicações, audits, reports e status.
Permita publish, quarantine, retire e re-run audit.
Use RLS e server actions seguras.
```

Acceptance criteria:

- Student não acessa admin.
- Admin vê drafts/audits.
- Admin publica ou quarantena.
- Reports aparecem e podem ser triados.

### Fase 6 — Mock Mode e Analytics

Objetivo:

- Mock half/full.
- Timer.
- Resultado final.
- Analytics por sessão.
- Review dos erros.

Prompt:

```txt
Execute apenas a Fase 6.
Implemente mock mode com sessão de 90 ou 180 questões, timer, navegação, marcação para revisão, submissão final e resultado detalhado por tópico.
Implementar mini mock proporcional por pesos oficiais.
```

Acceptance criteria:

- Half mock com 90 questões e 135 minutos.
- Full mock com 180 questões e duas sessões.
- Resultado só aparece no final.
- Breakdown por tópico funciona.

### Fase 7 — Retenção e Adaptive Practice

Objetivo:

- Spaced repetition.
- Weak topic recommender.
- Streaks.
- Emails transacionais básicos.

Prompt:

```txt
Execute apenas a Fase 7.
Implemente spaced repetition, suggested next session, weak topic recommender, streaks e emails transacionais básicos.
Não adicione complexidade desnecessária.
```

Acceptance criteria:

- Questões erradas entram na revisão.
- Dashboard recomenda próxima sessão.
- Cards vencidos aparecem.

### Fase 8 — Produção

Objetivo:

- CI/CD.
- Deploy Vercel.
- Supabase production.
- Stripe production checklist.
- Sentry/PostHog.
- Backup e runbook.

Prompt:

```txt
Execute apenas a Fase 8.
Prepare o projeto para produção: CI, deploy docs, env validation, Sentry, PostHog, Stripe production checklist, Supabase migration checklist, backup/rollback docs e release checklist.
Use devops-release-engineer e security-billing-engineer.
```

Acceptance criteria:

- CI roda lint/typecheck/test/build.
- Deploy docs completos.
- Release checklist existe.
- Monitoramento básico integrado.

---

## 14. Seed de Conteúdo para Desenvolvimento

Criar seed com 15 questões manuais/dummy, não geradas de fontes oficiais.

Distribuição inicial:

- ETH: 2
- QM: 2
- FSA: 2
- FI: 2
- EQ: 2
- ECON: 1
- CI: 1
- DER: 1
- AI: 1
- PM: 1

Cada questão seed deve:

- Ser original.
- Ter status `published`.
- Ter explicação curta.
- Ser suficiente para testar UI.

---

## 15. Regras de Seleção de Questões

### Practice mode

Algoritmo:

1. Aplicar filtros do usuário.
2. Excluir questões já respondidas se `new_only=true`.
3. Priorizar tópicos fracos se `adaptive=true`.
4. Misturar difficulty:
   - 30% easy.
   - 50% medium.
   - 20% hard.
5. Evitar repetir questão recente.

### Mock mode

Para 180 questões:

- ETH: 31
- QM: 13
- ECON: 13
- FSA: 22
- CI: 13
- EQ: 22
- FI: 22
- DER: 11
- AI: 15
- PM: 18

Ajustar arredondamento para total exato.

Para 90 questões, dividir pela metade e ajustar soma.

---

## 16. Métricas de Produto

### Ativação

- Signup to first question answered.
- Completion of first 20 free questions.
- First explanation viewed.
- First weak topic identified.

### Retenção

- D1/D7/D30 active users.
- Questions answered per active user.
- Review sessions completed.
- Mock attempts.

### Conversão

- Free trial to paid.
- Paywall hit rate.
- Checkout conversion.
- Churn.

### Qualidade do conteúdo

- Reports per 1.000 attempts.
- Wrong answer reports by question.
- Questions quarantined.
- Validator fail rate.
- Human review override rate.
- Accuracy distribution by question.
- Discrimination proxy: performance of high-score users vs low-score users per question.

---

## 17. Pricing e Paywall

MVP:

- Free: 20 questões, dashboard básico, sem mock completo.
- Monthly: acesso ilimitado, mocks, reviews, bookmarks, notes.
- Annual: desconto.

Paywall triggers:

- Usuário respondeu 20 questões.
- Usuário tenta iniciar mock.
- Usuário tenta filtrar questões avançadas.
- Usuário tenta acessar review inteligente.

Paywall deve ser honesto e leve:

- Mostrar valor: `You found 3 weak topics. Unlock unlimited practice and full mocks.`

---

## 18. UI/UX Detalhado

### Keyboard shortcuts

- `A`, `B`, `C`: selecionar opção.
- `Enter`: confirmar.
- `N`: próxima.
- `B`: bookmark, somente se não conflitar com option B; melhor usar `M` para mark/bookmark.
- `R`: report.
- `F`: flag for review no mock.

### Question card

Estados:

1. Unanswered.
2. Selected but not submitted.
3. Submitted correct.
4. Submitted incorrect.
5. Explanation expanded.
6. Mock mode hidden explanation.

### Acessibilidade

- Contraste adequado.
- Font size confortável.
- Botões grandes no mobile.
- ARIA labels.
- Sem depender apenas de cor para correta/incorreta.

---

## 19. Validações Técnicas de Conteúdo

Criar funções determinísticas:

```ts
validateThreeOptions(question);
validateSingleCorrectAnswer(question);
validateForbiddenOptionText(question);
validateNumericalOrdering(question);
validateExplanationCompleteness(question);
validateNoOfficialClaims(question);
validateTopicWeightDistribution(batch);
validateMarkdownMath(question);
```

### Forbidden terms

```ts
const FORBIDDEN_OPTION_PATTERNS = [
  /all of the above/i,
  /none of the above/i,
  /a and b only/i,
  /b and c only/i,
  /a and c only/i,
  /cannot determine/i,
  /cannot calculate/i,
  /not enough information/i,
];
```

### Official-looking claims to block

```ts
const FORBIDDEN_MARKETING_CLAIMS = [
  /official CFA/i,
  /CFA Institute approved/i,
  /guaranteed pass/i,
  /real exam questions/i,
  /actual exam/i,
  /same authors/i,
];
```

---

## 20. Testes Obrigatórios

### Unit tests

- Topic allocation sums to requested count.
- Free gating limits at 20 questions.
- Mock generator returns exact totals.
- Question schema rejects 2 or 4 options.
- Forbidden options rejected.
- Publish gate rejects failed audit.
- Publish gate rejects high IP risk.

### Integration tests

- Auth creates profile.
- Student answers question.
- Attempt updates dashboard.
- Bookmark works.
- Report works.
- Admin quarantines question.
- Stripe webhook updates subscription.

### E2E Playwright

- Signup/login mock.
- Complete 5 practice questions.
- See explanation.
- Hit paywall after free limit.
- Admin reviews a question.

---

## 21. Segurança e Abuso

Riscos:

1. Usuário scraping do Q-Bank.
2. Compartilhamento de login.
3. Bypass do paywall por API.
4. Vazamento de service role.
5. Prompt injection em fontes de conteúdo.
6. Publicação automática de questão errada.
7. Stripe webhook spoofing.

Mitigações:

- RLS.
- Rate limits por rota.
- Paginação e não retornar respostas de questões antes do submit em practice mode, exceto admin.
- Em mock/practice, API de question deve retornar `correct_option` apenas após resposta ou término.
- Stripe webhook signature verification.
- Service role apenas server-side.
- Content source sanitization.
- Publish gates.
- Admin audit logs.

---

## 22. API Interna — Rotas Sugeridas

```txt
GET  /api/topics
GET  /api/dashboard
POST /api/practice-sessions
GET  /api/practice-sessions/:id
POST /api/questions/:id/answer
POST /api/questions/:id/bookmark
DELETE /api/questions/:id/bookmark
POST /api/questions/:id/report
POST /api/stripe/checkout
POST /api/stripe/portal
POST /api/stripe/webhook

Admin:
GET  /api/admin/questions
GET  /api/admin/questions/:id
POST /api/admin/questions/:id/publish
POST /api/admin/questions/:id/quarantine
POST /api/admin/questions/:id/retire
GET  /api/admin/content-jobs
POST /api/admin/content-jobs
POST /api/admin/content-jobs/:id/run
```

---

## 23. Critérios de Pronto para MVP Pago

Só lançar pago quando:

- Pelo menos 1.000 questões publicadas e auditadas.
- Pelo menos 100 por tópico principal ou alocação proporcional mínima.
- Menos de 5 reports críticos por 1.000 attempts no beta fechado.
- Stripe e paywall testados.
- Admin Studio funcional.
- Sentry ativo.
- Backup Supabase configurado.
- Termos, privacidade e disclaimer publicados.
- Política de conteúdo documentada.

Para beta privado, pode lançar com 300–500 questões, desde que comunique claramente `beta` e tenha preço reduzido.

---

## 24. Roadmap Pós-MVP

1. Mobile app wrapper.
2. AI tutor para explicar questões já publicadas, sem criar novas respostas não auditadas.
3. Flashcards automáticos derivados de questões validadas.
4. Study planner por data de exame.
5. Simulado adaptativo.
6. Comparação de performance com cohorts anônimos.
7. Upload de erros próprios do aluno.
8. Extensão para Level II.
9. Extensão para Level III.
10. Aplicação formal para Approved Prep Provider, se fizer sentido.

---

## 25. Prompt Mestre para Iniciar no Claude Code

Use este prompt depois de colocar o arquivo no repositório:

```txt
Você é Claude Code atuando como principal engenheiro full-stack, arquiteto de produto e coordenador de subagentes.

Leia PROJECT_BRIEF.md inteiro antes de qualquer implementação.

Objetivo: construir o SaaS CharterBank, um Q-Bank independente e acessível para CFA Level I, com Next.js, Supabase, Stripe e pipeline batch de IA para criação e validação de questões.

Regras não negociáveis:
1. Não copiar conteúdo oficial do CFA Institute nem de terceiros.
2. Não usar marca/logo do CFA Institute nem sugerir endosso.
3. Não publicar questão gerada por IA sem passar por validações e audits.
4. Não expor service role key ou segredos no client.
5. Implementar RLS e testes de segurança desde o início.
6. Fazer desenvolvimento por fases. Não pule fases.
7. Depois de cada fase, rode lint, typecheck, tests relevantes e build quando aplicável.
8. Atualize a documentação conforme implementar.

Comece pela Fase 0. Antes de editar arquivos, apresente um plano curto com estrutura de pastas, dependências e comandos. Depois implemente.
```

---

## 26. Checklist Final de Produção

### Produto

- [ ] Landing page clara.
- [ ] Onboarding sem atrito.
- [ ] Free trial sem cartão.
- [ ] Paywall transparente.
- [ ] Dashboard útil.
- [ ] Practice mode rápido.
- [ ] Mock mode confiável.
- [ ] Admin Studio funcional.

### Conteúdo

- [ ] 1.000+ questões auditadas.
- [ ] Distribuição por tópico correta.
- [ ] Explicações completas.
- [ ] Reports de beta tratados.
- [ ] Política de conteúdo publicada.
- [ ] Disclaimers legais.

### Engenharia

- [ ] CI verde.
- [ ] RLS testado.
- [ ] Stripe webhook testado.
- [ ] Sentry ativo.
- [ ] PostHog ativo.
- [ ] Backups Supabase.
- [ ] Rate limiting.
- [ ] Secrets validados.
- [ ] Logs sem PII sensível.

### Operação

- [ ] Runbook de incidentes.
- [ ] Processo de quarentena de questão.
- [ ] Processo de refund/cancelamento.
- [ ] Suporte por e-mail.
- [ ] Roadmap público simples.

---

## 27. Decisões Arquiteturais Importantes

1. **Gerar conteúdo offline:** reduz risco de alucinação para usuário final.
2. **Validar com solver independente:** evita confiar no próprio gerador.
3. **Auditar e versionar prompts:** permite rastrear por que uma questão existe.
4. **RLS desde o início:** evita reescrever auth depois.
5. **Admin Studio no MVP:** sem curadoria, o risco de qualidade fica alto.
6. **Não começar com app mobile:** web responsivo é suficiente para validar negócio.
7. **Não usar RAG em tempo real para responder aluno no MVP:** explicações devem ser preaprovadas.
8. **Não prometer aprovação:** produto melhora prática, mas não controla resultado.

---

## 28. Apêndice — Fontes Oficiais a Conferir Periodicamente

Estas referências devem ser conferidas anualmente ao atualizar o currículo:

- Página oficial do CFA Institute para Level I exam guide.
- Topic outlines do ano corrente.
- Página oficial de Prep Providers do CFA Institute.
- Página oficial de sample questions para estilo e estrutura.
- Documentação oficial do Claude Code para subagents, hooks, commands, permissions e MCP.

Ao atualizar para novo ano curricular:

1. Criar nova linha em `curriculum_versions`.
2. Atualizar `topics` se pesos mudarem.
3. Recriar `learning_objectives` internos sem copiar LOS.
4. Rodar gap analysis entre questões existentes e novos objetivos.
5. Retirar ou revisar questões obsoletas.
6. Reexecutar audits técnicos e humanos nos tópicos alterados.
