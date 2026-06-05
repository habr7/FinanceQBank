/** CFA Level I exam structure and study-mode presets (no copyrighted content). */

export const EXAM = {
  level: "I",
  optionLabels: ["A", "B", "C"] as const,
  optionsPerQuestion: 3,
  totalQuestions: 180,
  sessions: 2,
  questionsPerSession: 90,
  sessionMinutes: 135,
  secondsPerQuestion: 90,
  equalWeight: true,
  wrongAnswerPenalty: false,
} as const;

export type OptionLabel = (typeof EXAM.optionLabels)[number];

export type Difficulty = "easy" | "medium" | "hard";

/** Default difficulty mix for free-practice sessions (sums to 1). */
export const PRACTICE_DIFFICULTY_MIX: Record<Difficulty, number> = {
  easy: 0.3,
  medium: 0.5,
  hard: 0.2,
};

export type MockType = "mini" | "half" | "full";

export interface MockPreset {
  type: MockType;
  questions: number;
  timeLimitSeconds: number;
  sessions: number;
}

export const MOCK_PRESETS: Record<MockType, MockPreset> = {
  mini: {
    type: "mini",
    questions: 30,
    timeLimitSeconds: 30 * EXAM.secondsPerQuestion,
    sessions: 1,
  },
  half: { type: "half", questions: 90, timeLimitSeconds: 135 * 60, sessions: 1 },
  full: { type: "full", questions: 180, timeLimitSeconds: 270 * 60, sessions: 2 },
};
