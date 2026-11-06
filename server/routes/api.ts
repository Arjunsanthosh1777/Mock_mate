import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  DIFFICULTY_LEVELS,
  EXPERIENCE_LEVELS,
  FREE_GEMINI_MODELS,
  INTERVIEW_TYPES,
  JOB_ROLES,
} from '../../src/types/interview.ts';
import {
  addQuestionToSession,
  compareSessions,
  completeSessionWithSummary,
  createSessionWithQuestions,
  deleteSession,
  getDashboardData,
  getPreferences,
  getSessionDetail,
  listSessions,
  markQuestionSkipped,
  saveAnswerAndFeedback,
  updatePreferences,
} from '../db/database.ts';
import {
  AIServiceError,
  evaluateCandidateAnswer,
  generateInterviewQuestions,
  generateNextQuestion,
  generateSessionSummary,
  getAIHealthStatus,
} from '../services/aiService.ts';

export const apiRouter = express.Router();

const UpdatePreferencesSchema = z.object({
  candidateName: z.string().trim().min(1).max(80).optional(),
  targetHeadline: z.string().trim().min(1).max(120).optional(),
  defaultJobRole: z.enum(JOB_ROLES).optional(),
  customJobRole: z.string().trim().max(80).optional(),
  defaultExperience: z.enum(EXPERIENCE_LEVELS).optional(),
  defaultInterviewType: z.enum(INTERVIEW_TYPES).optional(),
  defaultDifficulty: z.enum(DIFFICULTY_LEVELS).optional(),
  defaultQuestionCount: z.number().int().min(1).max(15).optional(),
  preferredGeminiModel: z.enum(FREE_GEMINI_MODELS).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  focusNotes: z.string().trim().max(1000).optional(),
});

const CreateSessionSchema = z.object({
  jobRole: z.enum(JOB_ROLES),
  customRole: z.string().trim().max(80).optional().default(''),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  interviewType: z.enum(INTERVIEW_TYPES),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  questionCount: z.number().int().min(1).max(12).default(5),
  focusContext: z.string().trim().max(1000).optional().default(''),
});

const SubmitAnswerSchema = z.object({
  answerText: z
    .string()
    .trim()
    .min(10, 'Please write a more complete answer (at least 10 characters) before submitting for AI evaluation.')
    .max(12000, 'Answer exceeds maximum length of 12,000 characters.'),
});

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

apiRouter.get('/health', (_req: Request, res: Response) => {
  const aiStatus = getAIHealthStatus();
  res.json({
    ok: true,
    database: 'sqlite',
    ai: aiStatus,
  });
});

apiRouter.get('/preferences', (_req: Request, res: Response) => {
  const prefs = getPreferences();
  res.json(prefs);
});

apiRouter.put('/preferences', (req: Request, res: Response) => {
  const parsed = UpdatePreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues.map((i) => i.message).join(' '),
      code: 'VALIDATION_ERROR',
    });
    return;
  }
  const updated = updatePreferences(parsed.data);
  res.json(updated);
});

apiRouter.get('/dashboard', (_req: Request, res: Response) => {
  const data = getDashboardData();
  res.json(data);
});

apiRouter.get('/sessions', (_req: Request, res: Response) => {
  const sessions = listSessions();
  res.json({ sessions });
});

apiRouter.get('/sessions/compare', (req: Request, res: Response) => {
  const rawIds = String(req.query.ids || '');
  const ids = rawIds
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (ids.length < 2) {
    res.status(400).json({
      error: 'Please select at least 2 interview sessions to compare.',
      code: 'VALIDATION_ERROR',
    });
    return;
  }

  const sessions = compareSessions(ids);
  res.json({ sessions });
});

apiRouter.post(
  '/sessions',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = CreateSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues.map((i) => i.message).join(' '),
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const {
      jobRole,
      customRole,
      experienceLevel,
      interviewType,
      difficulty,
      questionCount,
      focusContext,
    } = parsed.data;

    if (jobRole === 'Other' && !customRole.trim()) {
      res.status(400).json({
        error: 'Please specify a custom job role name when "Other" is selected.',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const effectiveRole =
      jobRole === 'Other' ? customRole.trim() : jobRole;

    const { questions, providerLabel } = await generateInterviewQuestions({
      effectiveRole,
      experienceLevel,
      interviewType,
      difficulty,
      count: questionCount,
      focusContext,
    });

    const detail = createSessionWithQuestions({
      jobRole,
      customRole: jobRole === 'Other' ? customRole.trim() : '',
      effectiveRole,
      experienceLevel,
      interviewType,
      difficulty,
      targetQuestionCount: questions.length,
      focusContext,
      aiProviderUsed: providerLabel,
      questions,
    });

    res.status(201).json(detail);
  })
);

apiRouter.get('/sessions/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const detail = getSessionDetail(id);
  if (!detail) {
    res.status(404).json({
      error: 'Interview session not found.',
      code: 'NOT_FOUND',
    });
    return;
  }
  res.json(detail);
});

apiRouter.post(
  '/sessions/:id/questions/next',
  asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const detail = getSessionDetail(id);
    if (!detail) {
      res.status(404).json({
        error: 'Interview session not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const existingQuestions = detail.items.map(
      (item) => item.question.questionText
    );

    const { question } = await generateNextQuestion({
      effectiveRole: detail.session.effectiveRole,
      experienceLevel: detail.session.experienceLevel,
      interviewType: detail.session.interviewType,
      difficulty: detail.session.difficulty,
      focusContext: detail.session.focusContext,
      existingQuestions,
    });

    const updated = addQuestionToSession(id, question);
    res.status(201).json(updated);
  })
);

apiRouter.post(
  '/sessions/:id/questions/:questionId/skip',
  (req: Request, res: Response) => {
    const id = String(req.params.id);
    const questionId = String(req.params.questionId);
    const detail = getSessionDetail(id);
    if (!detail) {
      res.status(404).json({
        error: 'Interview session not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const updated = markQuestionSkipped(id, questionId);
    res.json(updated);
  }
);

apiRouter.post(
  '/sessions/:id/questions/:questionId/answer',
  asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const questionId = String(req.params.questionId);

    const parsed = SubmitAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues.map((i) => i.message).join(' '),
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const detail = getSessionDetail(id);
    if (!detail) {
      res.status(404).json({
        error: 'Interview session not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const targetItem = detail.items.find((i) => i.question.id === questionId);
    if (!targetItem) {
      res.status(404).json({
        error: 'Question not found in this session.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const { evaluation } = await evaluateCandidateAnswer({
      effectiveRole: detail.session.effectiveRole,
      experienceLevel: detail.session.experienceLevel,
      interviewType: detail.session.interviewType,
      difficulty: detail.session.difficulty,
      questionText: targetItem.question.questionText,
      expectedSignals: targetItem.question.expectedSignals,
      answerText: parsed.data.answerText,
    });

    const updated = saveAnswerAndFeedback(
      id,
      questionId,
      parsed.data.answerText,
      evaluation
    );

    res.json(updated);
  })
);

apiRouter.post(
  '/sessions/:id/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const detail = getSessionDetail(id);
    if (!detail) {
      res.status(404).json({
        error: 'Interview session not found.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const attemptedCount = detail.items.filter(
      (i) => i.question.status === 'answered'
    ).length;

    if (attemptedCount === 0) {
      res.status(400).json({
        error:
          'Please answer at least one question before completing the session so the AI can generate meaningful feedback.',
        code: 'NO_ANSWERS_SUBMITTED',
      });
      return;
    }

    const { summary } = await generateSessionSummary({
      effectiveRole: detail.session.effectiveRole,
      experienceLevel: detail.session.experienceLevel,
      interviewType: detail.session.interviewType,
      difficulty: detail.session.difficulty,
      items: detail.items,
    });

    const updated = completeSessionWithSummary(id, summary);
    res.json(updated);
  })
);

apiRouter.delete('/sessions/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = deleteSession(id);
  if (!deleted) {
    res.status(404).json({
      error: 'Interview session not found.',
      code: 'NOT_FOUND',
    });
    return;
  }
  res.json({ deleted: true, id });
});

apiRouter.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AIServiceError) {
      res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    const message =
      err instanceof Error ? err.message : 'An unexpected server error occurred.';
    console.error('[MOCKMATE API Error]', err);
    res.status(500).json({
      error: message,
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
);
