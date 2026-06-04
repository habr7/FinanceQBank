import { APP_NAME, FREE_QUESTION_LIMIT, LEGAL_DISCLAIMER, TOPICS } from "@charterbank/shared";

import { Button } from "@/components/ui/button";

const VALUE_PROPS = [
  {
    title: "Original questions",
    body: "Thousands of independent CFA Level I practice questions — never copied from official material.",
  },
  {
    title: "Clear explanations",
    body: "Every answer explains why the correct option is right and why each distractor is wrong.",
  },
  {
    title: "Per-topic dashboard",
    body: "See exactly where you are weak and turn practice into a focused study plan.",
  },
  {
    title: "Timed mocks",
    body: "Half and full mocks that mirror Level I timing and pressure, with a detailed breakdown.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-20 px-6 py-16">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold">{APP_NAME}</span>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <a href="#pricing">Pricing</a>
          </Button>
          <Button size="sm" asChild>
            <a href="#start">Start free</a>
          </Button>
        </nav>
      </header>

      <section className="flex flex-col gap-6">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Affordable CFA Level I practice. Clear explanations. Smarter review.
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          An independent Q-Bank for CFA Level I candidates: original questions, step-by-step
          explanations, a per-topic dashboard, and timed mocks — without the premium price tag.
        </p>
        <div id="start" className="flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <a href="#start">Start free — no card required</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#pricing">See pricing</a>
          </Button>
        </div>
        <p className="text-sm text-muted">
          Free plan includes {FREE_QUESTION_LIMIT} questions and a basic dashboard.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        {VALUE_PROPS.map((prop) => (
          <article key={prop.title} className="rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold">{prop.title}</h2>
            <p className="mt-2 text-sm text-muted">{prop.body}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Every Level I topic, weighted like the exam</h2>
        <ul className="flex flex-wrap gap-2">
          {TOPICS.map((topic) => (
            <li
              key={topic.code}
              className="rounded-full border border-border px-3 py-1 text-sm text-muted"
            >
              {topic.name} · {topic.weight}%
            </li>
          ))}
        </ul>
      </section>

      <section id="pricing" className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Simple, honest pricing</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <article className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Free</h3>
            <p className="mt-2 text-sm text-muted">
              {FREE_QUESTION_LIMIT} questions and a basic dashboard. No card required.
            </p>
          </article>
          <article className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Monthly</h3>
            <p className="mt-2 text-sm text-muted">
              Unlimited practice, full mocks, smart review, bookmarks, and notes.
            </p>
          </article>
          <article className="rounded-lg border border-border p-6">
            <h3 className="font-semibold">Annual</h3>
            <p className="mt-2 text-sm text-muted">
              Everything in Monthly at a discount for committed candidates.
            </p>
          </article>
        </div>
      </section>

      <footer className="border-t border-border pt-8 text-xs leading-relaxed text-muted">
        <p>{LEGAL_DISCLAIMER}</p>
        <p className="mt-2">
          © {new Date().getFullYear()} {APP_NAME}. An independent exam-preparation tool.
        </p>
      </footer>
    </main>
  );
}
