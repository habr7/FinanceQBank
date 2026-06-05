# Product Spec — CharterBank

> Independent, affordable CFA Level I Q-Bank. Complementary study material, original
> content, strong governance. Not affiliated with CFA Institute. See `CONTENT_POLICY.md`.

## Positioning

- Working name: **CharterBank**. Avoid official-sounding names.
- Value: original questions, clear step-by-step explanations, per-topic dashboard,
  timed mocks, smart review of mistakes — at an affordable monthly price.
- Disclaimer (footer + onboarding): _CFA® and Chartered Financial Analyst® are registered
  trademarks owned by CFA Institute. This product is an independent exam preparation tool
  and is not endorsed by, affiliated with, or sponsored by CFA Institute._

## Exam model reflected in product (Level I)

- Multiple choice, **3 options (A/B/C)**, exactly one best answer.
- 180 questions total; 2 sessions × 135 min; 90 questions/session; ~90s/question; equal weight; no wrong-answer penalty.

## Topic weights (target allocation per 1,000 questions)

| Code | Topic                            | Weight | Per 1,000 |
| ---- | -------------------------------- | -----: | --------: |
| ETH  | Ethical & Professional Standards |  17.5% |       171 |
| QM   | Quantitative Methods             |   7.5% |        73 |
| ECON | Economics                        |   7.5% |        73 |
| FSA  | Financial Statement Analysis     |  12.5% |       122 |
| CI   | Corporate Issuers                |   7.5% |        73 |
| EQ   | Equity Investments               |  12.5% |       122 |
| FI   | Fixed Income                     |  12.5% |       122 |
| DER  | Derivatives                      |   6.5% |        63 |
| AI   | Alternative Investments          |   8.5% |        83 |
| PM   | Portfolio Management             |  10.0% |        98 |

These are encoded in `packages/shared` (`topics.ts`) and covered by unit tests.

## Core journeys / screens

Landing → Onboarding (exam date, hours/week, strong/weak topics, 20 diagnostic questions) →
Dashboard (accuracy, per-topic radar, weak topics, due reviews, streak, suggested session) →
Practice (filters, answer, explanation, bookmark/note/report) → Mock (half/full/mini, timer,
flag, final results) → Admin Content Studio (curation, audits, publish/quarantine/retire).

## Pricing & paywall

- Free: 20 questions, basic dashboard, no full mock.
- Monthly: unlimited practice, mocks, reviews, bookmarks, notes.
- Annual: discount.
- Paywall triggers: 20-question limit reached, starting a mock, advanced filters, smart review.
- Honest, light paywall messaging that shows value (e.g. weak topics found).
