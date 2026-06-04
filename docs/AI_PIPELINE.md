# AI Content Pipeline (overview)

> Implemented in `packages/ai-content` starting in Phase 4. Questions are **never** generated
> in real time for students. Everything is batch-generated, audited, versioned, and published
> only after passing the gates.

## State machine

```
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

## Agents

| #   | Agent                  | Role                                                                 |
| --- | ---------------------- | -------------------------------------------------------------------- |
| 0   | Curriculum Mapper      | Permitted sources → internal paraphrased objectives.                 |
| 1   | Blueprint Planner      | Plan one-concept question + distractor strategy (no final text yet). |
| 2   | Question Generator     | Original question, 3 options, explanation (Zod-validated).           |
| 3   | Independent Solver     | Solve from stem+options only, no access to the answer key.           |
| 4   | Validator / Corrector  | Compare solver vs key; pass/warning/fail/corrected.                  |
| 5   | Adversarial Reviewer   | Hunt ambiguity, multiple answers, unfair tricks; severity rating.    |
| 6   | IP / Copyright Checker | n-gram/fuzzy similarity vs sources; risk score.                      |
| 7   | Difficulty Calibrator  | Heuristic first, then data-driven from attempts.                     |

## Publish gates

A question may reach `published` only if: 3 options; exactly one correct; explanation with
rationale for all 3 options; validator agrees with the key; no critical adversarial finding;
IP similarity below threshold; no forbidden option text; topic & difficulty tagged;
`quality_score >= 85`; `ai_confidence >= 0.85`. MVP requires human review for the first 500 questions.

## Observability (per LLM call)

`job_id`, `question_id`, `agent_name`, `model`, `prompt_version`, `input_tokens`,
`output_tokens`, `cost_estimate_usd`, `latency_ms`, `result`.

## CLI

```bash
pnpm content:plan -- --curriculum=2026-L1 --target=1000
pnpm content:generate -- --topic=FSA --count=25 --difficulty=medium
pnpm content:audit -- --batch=<job_id>
pnpm content:publish -- --batch=<job_id> --require-human-review=true
pnpm content:quarantine -- --question=<question_id> --reason="..."
```

## Deterministic validators

`validateThreeOptions`, `validateSingleCorrectAnswer`, `validateForbiddenOptionText`,
`validateNumericalOrdering`, `validateExplanationCompleteness`, `validateNoOfficialClaims`,
`validateTopicWeightDistribution`, `validateMarkdownMath`.
