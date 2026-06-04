# Content & Compliance Policy

CharterBank is an **independent** CFA Level I exam-prep product. It must never present
itself as official, endorsed, or affiliated with CFA Institute.

## Mandatory rules

1. Do not copy questions, examples, explanations, EOC questions, mock exams, or text from
   the CFA Institute Learning Ecosystem or any third-party copyrighted material.
2. Do not use the CFA Institute logo.
3. Do not claim approval, endorsement, partnership, or Approved Prep Provider status that
   does not formally exist.
4. Do not promise a pass rate or "pass guarantee".
5. Do not say "official questions", "real exam questions", "same exam authors", or equivalent.
6. Keep a record of the origin of each concept used to generate a question.
7. Treat official LOS as sensitive. Use internal, paraphrased `learning_objectives` based on
   topics/concepts — never reproduce LOS text — until/unless formally licensed.
8. Every source has `source_type` and `source_license` recorded.

## Permitted sources (MVP)

- Founder's own authored content and notes written from scratch.
- Materials licensed for commercial use.
- Public topic/weight outlines (general references only, no protected text).
- Standardized financial formulas and general technical knowledge, with original explanations.

## Prohibited sources (without explicit license)

Official curriculum PDFs, Learning Ecosystem, official mock exams / practice packs,
third-party copyrighted questions, exam dumps or leaked content.

## Question style rules

- Clear stem; one item per stem; 3 unique options.
- Avoid `except`, `true`, `false`, and unnecessary `not`.
- Prefer qualifiers: most likely, least likely, best described, most appropriate/accurate,
  least appropriate/accurate.
- Forbidden option text: `all of the above`, `none of the above`, `A and B only`,
  `B and C only`, `A and C only`, `cannot determine`, `cannot calculate`,
  `not enough information to determine`.
- Numerical options ordered smallest → largest; text options generally shortest → longest
  (without creating an obvious pattern).
- Explanation justifies the correct answer and explains why each distractor is plausible but wrong.

## Forbidden marketing claims

`official CFA`, `CFA Institute approved`, `guaranteed pass`, `real exam questions`,
`actual exam`, `same authors`. These are blocked by deterministic validators in `packages/ai-content`.
