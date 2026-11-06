import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type {
  AnswerFeedback,
  DashboardData,
  DifficultyLevel,
  DimensionScores,
  ExperienceLevel,
  FreeGeminiModel,
  FullSessionDetail,
  InterviewQuestion,
  InterviewSession,
  InterviewType,
  JobRole,
  SessionListItem,
  SessionQuestionItem,
  SessionStatistics,
  SessionSummary,
  StarBreakdown,
  SubmittedAnswer,
  ThemeMode,
  UserPreferences,
} from '../../src/types/interview.ts';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'mockmate.db');

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const configuredPath = process.env.SQLITE_DB_PATH
    ? path.resolve(process.cwd(), process.env.SQLITE_DB_PATH)
    : DEFAULT_DB_PATH;

  const dir = path.dirname(configuredPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(configuredPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initializeSchema(db);
  dbInstance = db;
  return db;
}

function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      candidate_name TEXT NOT NULL DEFAULT 'Alex Rivera',
      target_headline TEXT NOT NULL DEFAULT 'Software Engineer',
      default_job_role TEXT NOT NULL DEFAULT 'Full Stack Developer',
      custom_job_role TEXT NOT NULL DEFAULT '',
      default_experience TEXT NOT NULL DEFAULT 'Intermediate',
      default_interview_type TEXT NOT NULL DEFAULT 'Technical',
      default_difficulty TEXT NOT NULL DEFAULT 'Medium',
      default_question_count INTEGER NOT NULL DEFAULT 5,
      theme TEXT NOT NULL DEFAULT 'light',
      focus_notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id TEXT PRIMARY KEY,
      job_role TEXT NOT NULL,
      custom_role TEXT NOT NULL DEFAULT '',
      effective_role TEXT NOT NULL,
      experience_level TEXT NOT NULL,
      interview_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      target_question_count INTEGER NOT NULL,
      focus_context TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'in_progress',
      current_question_index INTEGER NOT NULL DEFAULT 0,
      ai_provider_used TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
      question_order INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      topic_tag TEXT NOT NULL,
      interviewer_intent TEXT NOT NULL,
      expected_signals_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unanswered',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submitted_answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL UNIQUE REFERENCES interview_questions(id) ON DELETE CASCADE,
      answer_text TEXT NOT NULL,
      character_count INTEGER NOT NULL,
      word_count INTEGER NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_feedback (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL UNIQUE REFERENCES interview_questions(id) ON DELETE CASCADE,
      answer_id TEXT NOT NULL REFERENCES submitted_answers(id) ON DELETE CASCADE,
      relevance_score REAL NOT NULL,
      clarity_score REAL NOT NULL,
      completeness_score REAL NOT NULL,
      structure_score REAL NOT NULL,
      technical_accuracy_score REAL NOT NULL,
      communication_score REAL NOT NULL,
      overall_rating REAL NOT NULL,
      rating_label TEXT NOT NULL,
      rating_explanation TEXT NOT NULL,
      strengths_json TEXT NOT NULL,
      weaknesses_json TEXT NOT NULL,
      missing_points_json TEXT NOT NULL,
      improvement_tips_json TEXT NOT NULL,
      example_improved_answer TEXT NOT NULL,
      star_situation TEXT,
      star_task TEXT,
      star_action TEXT,
      star_result TEXT,
      technical_reasoning TEXT,
      coaching_disclaimer TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_statistics (
      session_id TEXT PRIMARY KEY REFERENCES interview_sessions(id) ON DELETE CASCADE,
      questions_generated INTEGER NOT NULL DEFAULT 0,
      questions_attempted INTEGER NOT NULL DEFAULT 0,
      questions_skipped INTEGER NOT NULL DEFAULT 0,
      average_rating REAL NOT NULL DEFAULT 0,
      avg_relevance REAL NOT NULL DEFAULT 0,
      avg_clarity REAL NOT NULL DEFAULT 0,
      avg_completeness REAL NOT NULL DEFAULT 0,
      avg_structure REAL NOT NULL DEFAULT 0,
      avg_technical_accuracy REAL NOT NULL DEFAULT 0,
      avg_communication REAL NOT NULL DEFAULT 0,
      overall_feedback TEXT,
      strongest_answers_json TEXT,
      areas_needing_improvement_json TEXT,
      recommended_topics_json TEXT,
      suggested_next_session_json TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_session_order
      ON interview_questions(session_id, question_order);
    CREATE INDEX IF NOT EXISTS idx_answers_session
      ON submitted_answers(session_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_session
      ON ai_feedback(session_id);
  `);

  const prefCols = db
    .prepare('PRAGMA table_info(user_preferences)')
    .all() as Record<string, unknown>[];
  if (!prefCols.some((c) => c.name === 'preferred_gemini_model')) {
    db.exec(
      "ALTER TABLE user_preferences ADD COLUMN preferred_gemini_model TEXT NOT NULL DEFAULT 'gemini-3.1-flash-lite'"
    );
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT OR IGNORE INTO user_preferences (
      id, candidate_name, target_headline, default_job_role, custom_job_role,
      default_experience, default_interview_type, default_difficulty,
      default_question_count, preferred_gemini_model, theme, focus_notes, updated_at
    ) VALUES (
      1, 'Alex Rivera', 'Full Stack Engineer', 'Full Stack Developer', '',
      'Intermediate', 'Technical', 'Medium', 5, 'gemini-3.1-flash-lite', 'light', '', ?
    )
  `).run(now);
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function roundToOne(n: number): number {
  return Math.round(n * 10) / 10;
}

export function getPreferences(): UserPreferences {
  const db = getDatabase();
  const row = db
    .prepare('SELECT * FROM user_preferences WHERE id = 1')
    .get() as Record<string, unknown>;

  const rawModel = String(
    row.preferred_gemini_model ?? 'gemini-3.1-flash-lite'
  );
  const preferredGeminiModel: FreeGeminiModel =
    rawModel === 'gemini-3.8-flash'
      ? 'gemini-3.8-flash'
      : 'gemini-3.1-flash-lite';

  return {
    id: Number(row.id),
    candidateName: String(row.candidate_name),
    targetHeadline: String(row.target_headline),
    defaultJobRole: String(row.default_job_role) as JobRole,
    customJobRole: String(row.custom_job_role ?? ''),
    defaultExperience: String(row.default_experience) as ExperienceLevel,
    defaultInterviewType: String(row.default_interview_type) as InterviewType,
    defaultDifficulty: String(row.default_difficulty) as DifficultyLevel,
    defaultQuestionCount: Number(row.default_question_count),
    preferredGeminiModel,
    theme: (row.theme === 'dark' ? 'dark' : 'light') as ThemeMode,
    focusNotes: String(row.focus_notes ?? ''),
    updatedAt: String(row.updated_at),
  };
}

export function updatePreferences(
  input: Partial<Omit<UserPreferences, 'id' | 'updatedAt'>>
): UserPreferences {
  const db = getDatabase();
  const current = getPreferences();
  const now = new Date().toISOString();

  const next: UserPreferences = {
    ...current,
    ...input,
    id: 1,
    updatedAt: now,
  };

  db.prepare(`
    UPDATE user_preferences SET
      candidate_name = ?,
      target_headline = ?,
      default_job_role = ?,
      custom_job_role = ?,
      default_experience = ?,
      default_interview_type = ?,
      default_difficulty = ?,
      default_question_count = ?,
      preferred_gemini_model = ?,
      theme = ?,
      focus_notes = ?,
      updated_at = ?
    WHERE id = 1
  `).run(
    next.candidateName,
    next.targetHeadline,
    next.defaultJobRole,
    next.customJobRole,
    next.defaultExperience,
    next.defaultInterviewType,
    next.defaultDifficulty,
    next.defaultQuestionCount,
    next.preferredGeminiModel,
    next.theme,
    next.focusNotes,
    next.updatedAt
  );

  return next;
}

export interface GeneratedQuestionInput {
  questionText: string;
  topicTag: string;
  interviewerIntent: string;
  expectedSignals: string[];
}

export interface CreateSessionInput {
  jobRole: JobRole;
  customRole: string;
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  targetQuestionCount: number;
  focusContext: string;
  aiProviderUsed: string;
  questions: GeneratedQuestionInput[];
}

export function createSessionWithQuestions(
  input: CreateSessionInput
): FullSessionDetail {
  const db = getDatabase();
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      INSERT INTO interview_sessions (
        id, job_role, custom_role, effective_role, experience_level,
        interview_type, difficulty, target_question_count, focus_context,
        status, current_question_index, ai_provider_used, created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', 0, ?, ?, NULL)
    `).run(
      sessionId,
      input.jobRole,
      input.customRole,
      input.effectiveRole,
      input.experienceLevel,
      input.interviewType,
      input.difficulty,
      input.targetQuestionCount,
      input.focusContext,
      input.aiProviderUsed,
      now
    );

    const insertQ = db.prepare(`
      INSERT INTO interview_questions (
        id, session_id, question_order, question_text, topic_tag,
        interviewer_intent, expected_signals_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unanswered', ?)
    `);

    input.questions.forEach((q, idx) => {
      insertQ.run(
        crypto.randomUUID(),
        sessionId,
        idx + 1,
        q.questionText,
        q.topicTag,
        q.interviewerIntent,
        JSON.stringify(q.expectedSignals),
        now
      );
    });

    db.prepare(`
      INSERT INTO session_statistics (
        session_id, questions_generated, questions_attempted, questions_skipped,
        average_rating, avg_relevance, avg_clarity, avg_completeness,
        avg_structure, avg_technical_accuracy, avg_communication, updated_at
      ) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?)
    `).run(sessionId, input.questions.length, now);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const detail = getSessionDetail(sessionId);
  if (!detail) {
    throw new Error('Failed to retrieve newly created interview session.');
  }
  return detail;
}

function mapSessionRow(row: Record<string, unknown>): InterviewSession {
  return {
    id: String(row.id),
    jobRole: String(row.job_role) as JobRole,
    customRole: String(row.custom_role ?? ''),
    effectiveRole: String(row.effective_role),
    experienceLevel: String(row.experience_level) as ExperienceLevel,
    interviewType: String(row.interview_type) as InterviewType,
    difficulty: String(row.difficulty) as DifficultyLevel,
    targetQuestionCount: Number(row.target_question_count),
    focusContext: String(row.focus_context ?? ''),
    status: (row.status === 'completed' ? 'completed' : 'in_progress') as
      | 'in_progress'
      | 'completed',
    currentQuestionIndex: Number(row.current_question_index ?? 0),
    aiProviderUsed: String(row.ai_provider_used ?? ''),
    createdAt: String(row.created_at),
    completedAt: row.completed_at ? String(row.completed_at) : null,
  };
}

function mapStatisticsRow(row: Record<string, unknown>): SessionStatistics {
  const hasSummary = Boolean(row.overall_feedback);
  const summary: SessionSummary | null = hasSummary
    ? {
        overallFeedback: String(row.overall_feedback),
        strongestAnswers: safeJsonParse<string[]>(
          row.strongest_answers_json as string | null,
          []
        ),
        areasNeedingImprovement: safeJsonParse<string[]>(
          row.areas_needing_improvement_json as string | null,
          []
        ),
        recommendedTopics: safeJsonParse<string[]>(
          row.recommended_topics_json as string | null,
          []
        ),
        suggestedNextPracticeSession: safeJsonParse(
          row.suggested_next_session_json as string | null,
          {
            jobRole: 'Full Stack Developer' as JobRole,
            experienceLevel: 'Intermediate' as ExperienceLevel,
            interviewType: 'Technical' as InterviewType,
            difficulty: 'Medium' as DifficultyLevel,
            rationale: 'Continue practicing core concepts.',
          }
        ),
      }
    : null;

  return {
    sessionId: String(row.session_id),
    questionsGenerated: Number(row.questions_generated),
    questionsAttempted: Number(row.questions_attempted),
    questionsSkipped: Number(row.questions_skipped),
    averageRating: Number(row.average_rating),
    avgRelevance: Number(row.avg_relevance),
    avgClarity: Number(row.avg_clarity),
    avgCompleteness: Number(row.avg_completeness),
    avgStructure: Number(row.avg_structure),
    avgTechnicalAccuracy: Number(row.avg_technical_accuracy),
    avgCommunication: Number(row.avg_communication),
    summary,
    updatedAt: String(row.updated_at),
  };
}

function mapFeedbackRow(row: Record<string, unknown>): AnswerFeedback {
  const hasStar =
    row.star_situation !== null ||
    row.star_task !== null ||
    row.star_action !== null ||
    row.star_result !== null;

  const starBreakdown: StarBreakdown | null = hasStar
    ? {
        situation: String(row.star_situation ?? ''),
        task: String(row.star_task ?? ''),
        action: String(row.star_action ?? ''),
        result: String(row.star_result ?? ''),
      }
    : null;

  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    questionId: String(row.question_id),
    answerId: String(row.answer_id),
    scores: {
      relevance: Number(row.relevance_score),
      clarity: Number(row.clarity_score),
      completeness: Number(row.completeness_score),
      structure: Number(row.structure_score),
      technicalAccuracy: Number(row.technical_accuracy_score),
      communicationQuality: Number(row.communication_score),
    },
    overallRating: Number(row.overall_rating),
    ratingLabel: String(row.rating_label),
    ratingExplanation: String(row.rating_explanation),
    strengths: safeJsonParse<string[]>(row.strengths_json as string, []),
    weaknesses: safeJsonParse<string[]>(row.weaknesses_json as string, []),
    missingPoints: safeJsonParse<string[]>(
      row.missing_points_json as string,
      []
    ),
    improvementTips: safeJsonParse<string[]>(
      row.improvement_tips_json as string,
      []
    ),
    exampleImprovedAnswer: String(row.example_improved_answer),
    starBreakdown,
    technicalReasoning:
      row.technical_reasoning !== null ? String(row.technical_reasoning) : null,
    coachingDisclaimer: String(row.coaching_disclaimer),
    createdAt: String(row.created_at),
  };
}

export function getSessionDetail(sessionId: string): FullSessionDetail | null {
  const db = getDatabase();
  const sessionRow = db
    .prepare('SELECT * FROM interview_sessions WHERE id = ?')
    .get(sessionId) as Record<string, unknown> | undefined;

  if (!sessionRow) {
    return null;
  }

  const session = mapSessionRow(sessionRow);

  const statsRow = db
    .prepare('SELECT * FROM session_statistics WHERE session_id = ?')
    .get(sessionId) as Record<string, unknown>;

  const statistics = mapStatisticsRow(statsRow);

  const questionRows = db
    .prepare(
      'SELECT * FROM interview_questions WHERE session_id = ? ORDER BY question_order ASC'
    )
    .all(sessionId) as Record<string, unknown>[];

  const answerRows = db
    .prepare('SELECT * FROM submitted_answers WHERE session_id = ?')
    .all(sessionId) as Record<string, unknown>[];

  const feedbackRows = db
    .prepare('SELECT * FROM ai_feedback WHERE session_id = ?')
    .all(sessionId) as Record<string, unknown>[];

  const answerByQ = new Map<string, SubmittedAnswer>();
  for (const r of answerRows) {
    answerByQ.set(String(r.question_id), {
      id: String(r.id),
      sessionId: String(r.session_id),
      questionId: String(r.question_id),
      answerText: String(r.answer_text),
      characterCount: Number(r.character_count),
      wordCount: Number(r.word_count),
      submittedAt: String(r.submitted_at),
    });
  }

  const feedbackByQ = new Map<string, AnswerFeedback>();
  for (const r of feedbackRows) {
    feedbackByQ.set(String(r.question_id), mapFeedbackRow(r));
  }

  const items: SessionQuestionItem[] = questionRows.map((qRow) => {
    const qId = String(qRow.id);
    const question: InterviewQuestion = {
      id: qId,
      sessionId: String(qRow.session_id),
      questionOrder: Number(qRow.question_order),
      questionText: String(qRow.question_text),
      topicTag: String(qRow.topic_tag),
      interviewerIntent: String(qRow.interviewer_intent),
      expectedSignals: safeJsonParse<string[]>(
        qRow.expected_signals_json as string,
        []
      ),
      status: String(qRow.status) as 'unanswered' | 'answered' | 'skipped',
      createdAt: String(qRow.created_at),
    };

    return {
      question,
      answer: answerByQ.get(qId) ?? null,
      feedback: feedbackByQ.get(qId) ?? null,
    };
  });

  return {
    session,
    items,
    statistics,
  };
}

export function listSessions(): SessionListItem[] {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT s.*, st.*
       FROM interview_sessions s
       JOIN session_statistics st ON st.session_id = s.id
       ORDER BY s.created_at DESC`
    )
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    session: mapSessionRow(r),
    statistics: mapStatisticsRow(r),
  }));
}

export function addQuestionToSession(
  sessionId: string,
  q: GeneratedQuestionInput
): FullSessionDetail {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE');
  try {
    const maxRow = db
      .prepare(
        'SELECT COALESCE(MAX(question_order), 0) AS max_order FROM interview_questions WHERE session_id = ?'
      )
      .get(sessionId) as Record<string, unknown>;

    const nextOrder = Number(maxRow.max_order) + 1;

    db.prepare(`
      INSERT INTO interview_questions (
        id, session_id, question_order, question_text, topic_tag,
        interviewer_intent, expected_signals_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'unanswered', ?)
    `).run(
      crypto.randomUUID(),
      sessionId,
      nextOrder,
      q.questionText,
      q.topicTag,
      q.interviewerIntent,
      JSON.stringify(q.expectedSignals),
      now
    );

    db.prepare(`
      UPDATE interview_sessions
      SET target_question_count = MAX(target_question_count, ?),
          current_question_index = ?
      WHERE id = ?
    `).run(nextOrder, nextOrder - 1, sessionId);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  recalculateSessionStatistics(sessionId);
  const detail = getSessionDetail(sessionId);
  if (!detail) {
    throw new Error('Session not found after adding question.');
  }
  return detail;
}

export function markQuestionSkipped(
  sessionId: string,
  questionId: string
): FullSessionDetail {
  const db = getDatabase();
  const existing = db
    .prepare(
      'SELECT status FROM interview_questions WHERE id = ? AND session_id = ?'
    )
    .get(questionId, sessionId) as Record<string, unknown> | undefined;

  if (!existing) {
    throw new Error('Question not found in session.');
  }

  // Only mark skipped if not already answered
  if (existing.status !== 'answered') {
    db.prepare(
      "UPDATE interview_questions SET status = 'skipped' WHERE id = ? AND session_id = ?"
    ).run(questionId, sessionId);
  }

  recalculateSessionStatistics(sessionId);
  const detail = getSessionDetail(sessionId);
  if (!detail) {
    throw new Error('Session not found.');
  }
  return detail;
}

export interface SaveEvaluationInput {
  scores: DimensionScores;
  overallRating: number;
  ratingLabel: string;
  ratingExplanation: string;
  strengths: string[];
  weaknesses: string[];
  missingPoints: string[];
  improvementTips: string[];
  exampleImprovedAnswer: string;
  starBreakdown: StarBreakdown | null;
  technicalReasoning: string | null;
  coachingDisclaimer: string;
}

export function saveAnswerAndFeedback(
  sessionId: string,
  questionId: string,
  answerText: string,
  evaluation: SaveEvaluationInput
): FullSessionDetail {
  const db = getDatabase();
  const now = new Date().toISOString();
  const trimmed = answerText.trim();
  const characterCount = trimmed.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;

  db.exec('BEGIN IMMEDIATE');
  try {
    // Remove previous answer/feedback for this question if re-submitting
    db.prepare(
      'DELETE FROM ai_feedback WHERE question_id = ? AND session_id = ?'
    ).run(questionId, sessionId);
    db.prepare(
      'DELETE FROM submitted_answers WHERE question_id = ? AND session_id = ?'
    ).run(questionId, sessionId);

    const answerId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO submitted_answers (
        id, session_id, question_id, answer_text, character_count, word_count, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(answerId, sessionId, questionId, trimmed, characterCount, wordCount, now);

    const feedbackId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO ai_feedback (
        id, session_id, question_id, answer_id,
        relevance_score, clarity_score, completeness_score,
        structure_score, technical_accuracy_score, communication_score,
        overall_rating, rating_label, rating_explanation,
        strengths_json, weaknesses_json, missing_points_json,
        improvement_tips_json, example_improved_answer,
        star_situation, star_task, star_action, star_result,
        technical_reasoning, coaching_disclaimer, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      feedbackId,
      sessionId,
      questionId,
      answerId,
      evaluation.scores.relevance,
      evaluation.scores.clarity,
      evaluation.scores.completeness,
      evaluation.scores.structure,
      evaluation.scores.technicalAccuracy,
      evaluation.scores.communicationQuality,
      evaluation.overallRating,
      evaluation.ratingLabel,
      evaluation.ratingExplanation,
      JSON.stringify(evaluation.strengths),
      JSON.stringify(evaluation.weaknesses),
      JSON.stringify(evaluation.missingPoints),
      JSON.stringify(evaluation.improvementTips),
      evaluation.exampleImprovedAnswer,
      evaluation.starBreakdown ? evaluation.starBreakdown.situation : null,
      evaluation.starBreakdown ? evaluation.starBreakdown.task : null,
      evaluation.starBreakdown ? evaluation.starBreakdown.action : null,
      evaluation.starBreakdown ? evaluation.starBreakdown.result : null,
      evaluation.technicalReasoning,
      evaluation.coachingDisclaimer,
      now
    );

    db.prepare(
      "UPDATE interview_questions SET status = 'answered' WHERE id = ? AND session_id = ?"
    ).run(questionId, sessionId);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  recalculateSessionStatistics(sessionId);
  const detail = getSessionDetail(sessionId);
  if (!detail) {
    throw new Error('Session not found after saving feedback.');
  }
  return detail;
}

export function recalculateSessionStatistics(sessionId: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  const counts = db
    .prepare(
      `SELECT
         COUNT(*) AS total_q,
         SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered_q,
         SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) AS skipped_q
       FROM interview_questions
       WHERE session_id = ?`
    )
    .get(sessionId) as Record<string, unknown>;

  const avgs = db
    .prepare(
      `SELECT
         COALESCE(AVG(overall_rating), 0) AS avg_rating,
         COALESCE(AVG(relevance_score), 0) AS avg_rel,
         COALESCE(AVG(clarity_score), 0) AS avg_cla,
         COALESCE(AVG(completeness_score), 0) AS avg_com,
         COALESCE(AVG(structure_score), 0) AS avg_str,
         COALESCE(AVG(technical_accuracy_score), 0) AS avg_tech,
         COALESCE(AVG(communication_score), 0) AS avg_comm
       FROM ai_feedback
       WHERE session_id = ?`
    )
    .get(sessionId) as Record<string, unknown>;

  db.prepare(`
    UPDATE session_statistics SET
      questions_generated = ?,
      questions_attempted = ?,
      questions_skipped = ?,
      average_rating = ?,
      avg_relevance = ?,
      avg_clarity = ?,
      avg_completeness = ?,
      avg_structure = ?,
      avg_technical_accuracy = ?,
      avg_communication = ?,
      updated_at = ?
    WHERE session_id = ?
  `).run(
    Number(counts.total_q ?? 0),
    Number(counts.answered_q ?? 0),
    Number(counts.skipped_q ?? 0),
    roundToOne(Number(avgs.avg_rating ?? 0)),
    roundToOne(Number(avgs.avg_rel ?? 0)),
    roundToOne(Number(avgs.avg_cla ?? 0)),
    roundToOne(Number(avgs.avg_com ?? 0)),
    roundToOne(Number(avgs.avg_str ?? 0)),
    roundToOne(Number(avgs.avg_tech ?? 0)),
    roundToOne(Number(avgs.avg_comm ?? 0)),
    now,
    sessionId
  );
}

export function completeSessionWithSummary(
  sessionId: string,
  summary: SessionSummary
): FullSessionDetail {
  const db = getDatabase();
  const now = new Date().toISOString();

  recalculateSessionStatistics(sessionId);

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`
      UPDATE interview_sessions
      SET status = 'completed',
          completed_at = COALESCE(completed_at, ?)
      WHERE id = ?
    `).run(now, sessionId);

    db.prepare(`
      UPDATE session_statistics SET
        overall_feedback = ?,
        strongest_answers_json = ?,
        areas_needing_improvement_json = ?,
        recommended_topics_json = ?,
        suggested_next_session_json = ?,
        updated_at = ?
      WHERE session_id = ?
    `).run(
      summary.overallFeedback,
      JSON.stringify(summary.strongestAnswers),
      JSON.stringify(summary.areasNeedingImprovement),
      JSON.stringify(summary.recommendedTopics),
      JSON.stringify(summary.suggestedNextPracticeSession),
      now,
      sessionId
    );

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const detail = getSessionDetail(sessionId);
  if (!detail) {
    throw new Error('Session not found after completion.');
  }
  return detail;
}

export function deleteSession(sessionId: string): boolean {
  const db = getDatabase();
  const result = db
    .prepare('DELETE FROM interview_sessions WHERE id = ?')
    .run(sessionId);
  return Number(result.changes) > 0;
}

export function getDashboardData(): DashboardData {
  const db = getDatabase();
  const allSessions = listSessions();

  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter(
    (s) => s.session.status === 'completed'
  ).length;

  let totalQuestionsAnswered = 0;
  let totalQuestionsSkipped = 0;
  let totalQuestionsGenerated = 0;

  for (const item of allSessions) {
    totalQuestionsAnswered += item.statistics.questionsAttempted;
    totalQuestionsSkipped += item.statistics.questionsSkipped;
    totalQuestionsGenerated += item.statistics.questionsGenerated;
  }

  const globalAvgs = db
    .prepare(
      `SELECT
         COALESCE(AVG(overall_rating), 0) AS avg_rating,
         COALESCE(AVG(relevance_score), 0) AS avg_rel,
         COALESCE(AVG(clarity_score), 0) AS avg_cla,
         COALESCE(AVG(completeness_score), 0) AS avg_com,
         COALESCE(AVG(structure_score), 0) AS avg_str,
         COALESCE(AVG(technical_accuracy_score), 0) AS avg_tech,
         COALESCE(AVG(communication_score), 0) AS avg_comm
       FROM ai_feedback`
    )
    .get() as Record<string, unknown>;

  const completionRate =
    totalQuestionsGenerated > 0
      ? Math.round((totalQuestionsAnswered / totalQuestionsGenerated) * 100)
      : 0;

  const ratedSessions = [...allSessions]
    .filter((s) => s.statistics.questionsAttempted > 0)
    .reverse()
    .slice(-12);

  const trendPoints = ratedSessions.map((item, idx) => ({
    sessionId: item.session.id,
    label: `Session ${idx + 1}`,
    date: item.session.createdAt,
    effectiveRole: item.session.effectiveRole,
    interviewType: item.session.interviewType,
    averageRating: item.statistics.averageRating,
    questionsAttempted: item.statistics.questionsAttempted,
    questionsGenerated: item.statistics.questionsGenerated,
  }));

  return {
    totalSessions,
    completedSessions,
    totalQuestionsAnswered,
    totalQuestionsSkipped,
    overallAverageRating: roundToOne(Number(globalAvgs.avg_rating ?? 0)),
    completionRate,
    competencyAverages: {
      relevance: roundToOne(Number(globalAvgs.avg_rel ?? 0)),
      clarity: roundToOne(Number(globalAvgs.avg_cla ?? 0)),
      completeness: roundToOne(Number(globalAvgs.avg_com ?? 0)),
      structure: roundToOne(Number(globalAvgs.avg_str ?? 0)),
      technicalAccuracy: roundToOne(Number(globalAvgs.avg_tech ?? 0)),
      communicationQuality: roundToOne(Number(globalAvgs.avg_comm ?? 0)),
    },
    recentSessions: allSessions.slice(0, 6),
    trendPoints,
  };
}

export function compareSessions(sessionIds: string[]): SessionListItem[] {
  const all = listSessions();
  const idSet = new Set(sessionIds);
  return all.filter((item) => idSet.has(item.session.id));
}
