import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";

const connectionString = process.env.TEST_DATABASE_URL;

// These tests require a real Postgres cluster with the migrations + compat layer
// applied. The `pnpm --filter @charterbank/db test:db` script boots one and sets
// TEST_DATABASE_URL. Without it (e.g. a plain `pnpm test`), the suite is skipped.
const describeDb = connectionString ? describe : describe.skip;

describeDb("Row Level Security", () => {
  const pool = new Pool({ connectionString });

  const userA = randomUUID();
  const userB = randomUUID();
  const adminId = randomUUID();
  let publishedQuestionId = "";
  let draftQuestionId = "";
  let activeObjectiveId = "";
  let draftObjectiveId = "";
  let sessionAId = "";
  let reportBId = "";

  /** Run `fn` inside a transaction acting as a given role, always rolling back. */
  async function asUser<T>(
    userId: string | null,
    fn: (client: PoolClient) => Promise<T>,
    role: "authenticated" | "anon" | "service_role" = "authenticated",
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(`set local role ${role}`);
      await client.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify(userId ? { sub: userId, role } : { role }),
      ]);
      return await fn(client);
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }
  }

  beforeAll(async () => {
    const admin = await pool.connect();
    try {
      // Provision auth users -> profiles created by the on_auth_user_created trigger.
      for (const [id, email] of [
        [userA, "a@example.com"],
        [userB, "b@example.com"],
        [adminId, "admin@example.com"],
      ] as const) {
        await admin.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
      }

      // Promote the admin profile (must run as service_role to pass the guard trigger).
      try {
        await admin.query("set role service_role");
        await admin.query("update public.profiles set role = 'admin' where id = $1", [adminId]);
      } finally {
        await admin.query("reset role");
      }

      const versionId = (
        await admin.query("select id from public.curriculum_versions where year = 2026 limit 1")
      ).rows[0].id as string;

      const insertQuestion = async (status: string) =>
        (
          await admin.query(
            `insert into public.questions
               (curriculum_version_id, topic_code, difficulty, stem, correct_option, explanation_md, status)
             values ($1, 'QM', 'medium', $2, 'B', 'Because B.', $3)
             returning id`,
            [versionId, `Stem (${status})`, status],
          )
        ).rows[0].id as string;

      publishedQuestionId = await insertQuestion("published");
      draftQuestionId = await insertQuestion("draft");

      const insertObjective = async (status: string) =>
        (
          await admin.query(
            `insert into public.learning_objectives
               (curriculum_version_id, topic_code, module_name, objective_code, internal_objective, status)
             values ($1, 'QM', 'Module', $2, 'Internal objective.', $3)
             returning id`,
            [versionId, `QM-OBJ-${status}`, status],
          )
        ).rows[0].id as string;

      activeObjectiveId = await insertObjective("active");
      draftObjectiveId = await insertObjective("draft");

      // Attempts owned by each student, and a report filed by user B.
      for (const uid of [userA, userB]) {
        await admin.query(
          `insert into public.attempts (user_id, question_id, is_correct) values ($1, $2, true)`,
          [uid, publishedQuestionId],
        );
      }
      reportBId = (
        await admin.query(
          `insert into public.question_reports (user_id, question_id, report_type, message)
           values ($1, $2, 'typo', 'typo in stem') returning id`,
          [userB, publishedQuestionId],
        )
      ).rows[0].id as string;

      sessionAId = (
        await admin.query(
          `insert into public.practice_sessions (user_id, mode, total_questions, question_ids)
           values ($1, 'practice', 1, $2) returning id`,
          [userA, [publishedQuestionId]],
        )
      ).rows[0].id as string;
    } finally {
      admin.release();
    }
  });

  afterAll(async () => {
    const cleanup = await pool.connect();
    try {
      await cleanup.query("reset role");
      // Removing the auth users cascades to profiles and all owned study data.
      await cleanup.query("delete from auth.users where id = any($1::uuid[])", [
        [userA, userB, adminId],
      ]);
      await cleanup.query("delete from public.questions where id = any($1::uuid[])", [
        [publishedQuestionId, draftQuestionId],
      ]);
      await cleanup.query("delete from public.learning_objectives where id = any($1::uuid[])", [
        [activeObjectiveId, draftObjectiveId],
      ]);
    } finally {
      cleanup.release();
    }
    await pool.end();
  });

  it("creates a profile automatically for each new auth user", async () => {
    const { rows } = await pool.query(
      "select count(*)::int as n from public.profiles where id = $1",
      [userA],
    );
    expect(rows[0].n).toBe(1);
  });

  it("a student cannot read another student's attempts", async () => {
    const visibleToA = await asUser(userA, (c) => c.query("select user_id from public.attempts"));
    expect(visibleToA.rows.every((r) => r.user_id === userA)).toBe(true);
    expect(visibleToA.rows.some((r) => r.user_id === userB)).toBe(false);
  });

  it("a student cannot read another student's profile", async () => {
    const res = await asUser(userA, (c) =>
      c.query("select id from public.profiles where id = $1", [userB]),
    );
    expect(res.rowCount).toBe(0);
  });

  it("a student cannot read a draft question but can read a published one", async () => {
    const draft = await asUser(userA, (c) =>
      c.query("select id from public.questions where id = $1", [draftQuestionId]),
    );
    const published = await asUser(userA, (c) =>
      c.query("select id from public.questions where id = $1", [publishedQuestionId]),
    );
    expect(draft.rowCount).toBe(0);
    expect(published.rowCount).toBe(1);
  });

  it("a user cannot change their own subscription_status", async () => {
    await expect(
      asUser(userA, (c) =>
        c.query("update public.profiles set subscription_status = 'active' where id = $1", [userA]),
      ),
    ).rejects.toThrow(/privileged profile columns/);
  });

  it("a user cannot change their own role", async () => {
    await expect(
      asUser(userA, (c) =>
        c.query("update public.profiles set role = 'admin' where id = $1", [userA]),
      ),
    ).rejects.toThrow(/privileged profile columns/);
  });

  it("an admin can read draft questions and all reports", async () => {
    const draft = await asUser(adminId, (c) =>
      c.query("select id from public.questions where id = $1", [draftQuestionId]),
    );
    const reports = await asUser(adminId, (c) => c.query("select id from public.question_reports"));
    expect(draft.rowCount).toBe(1);
    expect((reports.rowCount ?? 0) >= 1).toBe(true);
  });

  it("a student sees only their own reports", async () => {
    const reportsForA = await asUser(userA, (c) =>
      c.query("select user_id from public.question_reports"),
    );
    expect(reportsForA.rows.every((r) => r.user_id === userA)).toBe(true);
  });

  it("anonymous users can read topics but not questions", async () => {
    const topics = await asUser(null, (c) => c.query("select code from public.topics"), "anon");
    expect(topics.rowCount ?? 0).toBeGreaterThanOrEqual(10);

    await expect(
      asUser(null, (c) => c.query("select id from public.questions"), "anon"),
    ).rejects.toThrow();
  });

  it("students cannot read the answer key (correct_option column)", async () => {
    await expect(
      asUser(userA, (c) =>
        c.query("select correct_option from public.questions where id = $1", [publishedQuestionId]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("computes is_correct server-side, ignoring a client-supplied value", async () => {
    const wrong = await asUser(userA, (c) =>
      c.query(
        `insert into public.attempts (user_id, question_id, chosen_option, is_correct)
         values ($1, $2, 'A', true) returning is_correct`,
        [userA, publishedQuestionId],
      ),
    );
    const right = await asUser(userA, (c) =>
      c.query(
        `insert into public.attempts (user_id, question_id, chosen_option, is_correct)
         values ($1, $2, 'B', false) returning is_correct`,
        [userA, publishedQuestionId],
      ),
    );
    // correct_option is 'B', so the server overrides the lying client values.
    expect(wrong.rows[0].is_correct).toBe(false);
    expect(right.rows[0].is_correct).toBe(true);
  });

  it("students cannot insert content-pipeline jobs", async () => {
    await expect(
      asUser(userA, (c) =>
        c.query("insert into public.content_jobs (job_type) values ('generate_question')"),
      ),
    ).rejects.toThrow();
  });

  it("students cannot bookmark on behalf of another user", async () => {
    await expect(
      asUser(userA, (c) =>
        c.query("insert into public.bookmarks (user_id, question_id) values ($1, $2)", [
          userB,
          publishedQuestionId,
        ]),
      ),
    ).rejects.toThrow();
  });

  it("students see only active learning objectives, not drafts", async () => {
    const visible = await asUser(userA, (c) =>
      c.query("select id, status from public.learning_objectives where id = any($1::uuid[])", [
        [activeObjectiveId, draftObjectiveId],
      ]),
    );
    expect(visible.rows.map((r) => r.id)).toEqual([activeObjectiveId]);
  });

  it("owns its practice session (question_ids round-trip) and hides it from others", async () => {
    const own = await asUser(userA, (c) =>
      c.query("select question_ids from public.practice_sessions where id = $1", [sessionAId]),
    );
    expect(own.rows[0].question_ids).toEqual([publishedQuestionId]);

    const other = await asUser(userB, (c) =>
      c.query("select id from public.practice_sessions where id = $1", [sessionAId]),
    );
    expect(other.rowCount).toBe(0);
  });

  it("lets an admin change a question's status but not a student", async () => {
    const asStudent = await asUser(userA, (c) =>
      c.query("update public.questions set status = 'published' where id = $1", [draftQuestionId]),
    );
    expect(asStudent.rowCount).toBe(0);

    const asAdmin = await asUser(adminId, (c) =>
      c.query("update public.questions set status = 'published' where id = $1", [draftQuestionId]),
    );
    expect(asAdmin.rowCount).toBe(1);
  });

  it("lets an admin triage a report but not a student", async () => {
    const asStudent = await asUser(userA, (c) =>
      c.query("update public.question_reports set status = 'triaged' where id = $1", [reportBId]),
    );
    expect(asStudent.rowCount).toBe(0);

    const asAdmin = await asUser(adminId, (c) =>
      c.query("update public.question_reports set status = 'triaged' where id = $1", [reportBId]),
    );
    expect(asAdmin.rowCount).toBe(1);
  });

  it("accepts the mock session modes", async () => {
    for (const mode of ["mock_mini", "mock_half", "mock_full"]) {
      const res = await asUser(userA, (c) =>
        c.query(
          "insert into public.practice_sessions (user_id, mode, total_questions) values ($1, $2, 1) returning id",
          [userA, mode],
        ),
      );
      expect(res.rowCount).toBe(1);
    }
  });

  it("hides the stripe_events idempotency log from students", async () => {
    await expect(
      asUser(userA, (c) => c.query("select id from public.stripe_events")),
    ).rejects.toThrow();
  });

  it("rejects a duplicate stripe event id (webhook idempotency)", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("insert into public.stripe_events (id, type) values ('evt_dup', 'x')");
      await expect(
        client.query("insert into public.stripe_events (id, type) values ('evt_dup', 'x')"),
      ).rejects.toThrow();
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }
  });

  it("enforces a unique stripe_customer_id across profiles", async () => {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("set local role service_role");
      await client.query(
        "update public.profiles set stripe_customer_id = 'cus_dup' where id = $1",
        [userA],
      );
      await expect(
        client.query("update public.profiles set stripe_customer_id = 'cus_dup' where id = $1", [
          userB,
        ]),
      ).rejects.toThrow();
    } finally {
      await client.query("rollback").catch(() => undefined);
      client.release();
    }
  });

  it("service_role may update a subscription (the Stripe webhook path)", async () => {
    const result = await asUser(
      null,
      (c) =>
        c.query(
          "update public.profiles set subscription_status = 'active' where id = $1 returning subscription_status",
          [userA],
        ),
      "service_role",
    );
    expect(result.rows[0].subscription_status).toBe("active");
  });
});
