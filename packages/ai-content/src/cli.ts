import type { Difficulty } from "./schemas";
import {
  auditBatch,
  createPipelineContext,
  generateBatch,
  planBatch,
  publishBatch,
  quarantineQuestion,
} from "./runners";

type Flags = Record<string, string | boolean>;

function parseFlags(argv: string[]): Flags {
  const out: Flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg || !arg.startsWith("--")) continue;
    const body = arg.slice(2);
    if (body.includes("=")) {
      const idx = body.indexOf("=");
      out[body.slice(0, idx)] = body.slice(idx + 1);
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        out[body] = next;
        i += 1;
      } else {
        out[body] = true;
      }
    }
  }
  return out;
}

function str(value: string | boolean | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const USAGE = `charterbank content pipeline
  plan        --curriculum=2026-L1 --target=1000
  generate    --topic=QM --count=3 --difficulty=medium [--flaw-every=N]
  audit       --batch=<batchId>
  publish     --batch=<batchId> [--require-human-review=true|false]
  quarantine  --question=<questionId> --reason="..."`;

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);
  const flags = parseFlags(rest);
  const ctx = createPipelineContext();

  switch (command) {
    case "plan": {
      const result = planBatch({
        curriculum: str(flags.curriculum, "2026-L1"),
        target: Number(str(flags.target, "1000")),
      });
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }
    case "generate": {
      if (!flags.topic) {
        console.error("generate requires --topic");
        return 1;
      }
      const result = await generateBatch(ctx, {
        topic: str(flags.topic),
        count: Number(str(flags.count, "5")),
        difficulty: str(flags.difficulty, "medium") as Difficulty,
        flawEvery: flags["flaw-every"] ? Number(str(flags["flaw-every"])) : 0,
      });
      console.log(`Generated batch ${result.batchId} with ${result.questionIds.length} draft(s).`);
      return 0;
    }
    case "audit": {
      if (!flags.batch) {
        console.error("audit requires --batch");
        return 1;
      }
      const outcomes = await auditBatch(ctx, str(flags.batch));
      const validated = outcomes.filter((o) => o.status === "ai_validated").length;
      const quarantined = outcomes.filter((o) => o.status === "quarantined").length;
      for (const o of outcomes) {
        console.log(
          `  ${o.questionId} -> ${o.status} (quality ${o.qualityScore}, conf ${o.aiConfidence}, ip ${o.ipRiskScore})` +
            (o.decision.pass ? "" : ` [${o.decision.reasons.join("; ")}]`),
        );
      }
      console.log(
        `Audited ${outcomes.length}: ${validated} validated, ${quarantined} quarantined.`,
      );
      return 0;
    }
    case "publish": {
      if (!flags.batch) {
        console.error("publish requires --batch");
        return 1;
      }
      const requireHumanReview = str(flags["require-human-review"], "true") !== "false";
      const result = await publishBatch(ctx, str(flags.batch), { requireHumanReview });
      console.log(
        `Published ${result.published.length}, queued for review ${result.queuedForReview.length}, skipped ${result.skipped.length}.`,
      );
      return 0;
    }
    case "quarantine": {
      if (!flags.question) {
        console.error("quarantine requires --question");
        return 1;
      }
      await quarantineQuestion(ctx, str(flags.question), str(flags.reason, "manual"));
      console.log(`Quarantined ${str(flags.question)}.`);
      return 0;
    }
    default:
      console.log(USAGE);
      return command ? 1 : 0;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
