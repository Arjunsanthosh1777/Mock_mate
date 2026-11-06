import OpenAI from 'openai';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import { z } from 'zod';
import {
  DIFFICULTY_LEVELS,
  EXPERIENCE_LEVELS,
  FREE_GEMINI_MODELS,
  INTERVIEW_TYPES,
  JOB_ROLES,
  type AIHealthStatus,
  type DifficultyLevel,
  type ExperienceLevel,
  type FreeGeminiModel,
  type InterviewType,
  type JobRole,
  type SessionQuestionItem,
  type SessionSummary,
} from '../../src/types/interview.ts';
import {
  getPreferences,
  type GeneratedQuestionInput,
  type SaveEvaluationInput,
} from '../db/database.ts';
import {
  INTERVIEWER_SYSTEM_INSTRUCTION,
  buildAnswerEvaluationPrompt,
  buildQuestionBatchPrompt,
  buildSessionSummaryPrompt,
  buildSingleQuestionPrompt,
} from './prompts.ts';

export class AIServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'AI_SERVICE_ERROR') {
    super(message);
    this.name = 'AIServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const SingleQuestionSchema = z.object({
  questionText: z.string().min(10),
  topicTag: z.string().min(2),
  interviewerIntent: z.string().min(5),
  expectedSignals: z.array(z.string().min(2)).min(2).max(7),
});

const QuestionBatchSchema = z.object({
  questions: z.array(SingleQuestionSchema).min(1),
});

const StarBreakdownSchema = z.object({
  situation: z
    .string()
    .optional()
    .default('Context was partially established in the response.'),
  task: z
    .string()
    .optional()
    .default('Responsibility and goal could be articulated more explicitly.'),
  action: z
    .string()
    .optional()
    .default('Specific individual actions should be detailed step by step.'),
  result: z
    .string()
    .optional()
    .default('Quantifiable or observable outcomes should be highlighted.'),
});

const AnswerEvaluationSchema = z.object({
  scores: z.object({
    relevance: z.number().min(1).max(10),
    clarity: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    structure: z.number().min(1).max(10),
    technicalAccuracy: z.number().min(1).max(10),
    communicationQuality: z.number().min(1).max(10),
  }),
  overallRating: z.number().min(1).max(10),
  ratingLabel: z.string().min(2),
  ratingExplanation: z.string().min(10),
  strengths: z.array(z.string().min(2)).min(1),
  weaknesses: z.array(z.string().min(2)).min(1),
  missingPoints: z.array(z.string().min(2)).min(1),
  improvementTips: z.array(z.string().min(2)).min(1),
  exampleImprovedAnswer: z.string().min(15),
  starBreakdown: StarBreakdownSchema.nullable().optional(),
  technicalReasoning: z.string().nullable().optional(),
  coachingDisclaimer: z.string().min(10),
});

const SessionSummarySchema = z.object({
  overallFeedback: z.string().min(15),
  strongestAnswers: z.array(z.string().min(2)).min(1),
  areasNeedingImprovement: z.array(z.string().min(2)).min(1),
  recommendedTopics: z.array(z.string().min(2)).min(1),
  suggestedNextPracticeSession: z.object({
    jobRole: z.enum(JOB_ROLES),
    customRole: z.string().optional(),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    interviewType: z.enum(INTERVIEW_TYPES),
    difficulty: z.enum(DIFFICULTY_LEVELS),
    rationale: z.string().min(5),
  }),
});

interface ResolvedProvider {
  provider: 'openai' | 'gemini';
  model: string;
}

function getOrderedGeminiModels(): FreeGeminiModel[] {
  let primary: FreeGeminiModel = 'gemini-3.1-flash-lite';
  try {
    const prefs = getPreferences();
    if (
      prefs?.preferredGeminiModel &&
      (FREE_GEMINI_MODELS as readonly string[]).includes(
        prefs.preferredGeminiModel
      )
    ) {
      primary = prefs.preferredGeminiModel;
    }
  } catch {
    // Fallback to env or default if DB is unavailable
  }

  const envModel = process.env.GEMINI_MODEL?.trim();
  if (
    primary === 'gemini-3.1-flash-lite' &&
    envModel &&
    (FREE_GEMINI_MODELS as readonly string[]).includes(envModel)
  ) {
    primary = envModel as FreeGeminiModel;
  }

  const secondary = FREE_GEMINI_MODELS.filter((m) => m !== primary);
  return [primary, ...secondary];
}

function resolveProvider(): ResolvedProvider | null {
  const preferred = (process.env.AI_PROVIDER || 'auto').toLowerCase();
  const hasOpenAI = Boolean(
    process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0
  );
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );
  const primaryGeminiModel = getOrderedGeminiModels()[0];

  if (preferred === 'openai') {
    if (hasOpenAI) {
      return {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      };
    }
    if (hasGemini) {
      return {
        provider: 'gemini',
        model: primaryGeminiModel,
      };
    }
    return null;
  }

  if (preferred === 'gemini') {
    if (hasGemini) {
      return {
        provider: 'gemini',
        model: primaryGeminiModel,
      };
    }
    if (hasOpenAI) {
      return {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      };
    }
    return null;
  }

  // Default "auto": prefer OpenAI if OPENAI_API_KEY is explicitly configured, else Gemini
  if (hasOpenAI) {
    return {
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }
  if (hasGemini) {
    return {
      provider: 'gemini',
      model: primaryGeminiModel,
    };
  }
  return null;
}

export function getAIHealthStatus(): AIHealthStatus {
  const resolved = resolveProvider();
  if (!resolved) {
    return {
      configured: false,
      activeProvider: 'unconfigured',
      model: 'none',
      message:
        'No server-side AI API key is configured. Set GEMINI_API_KEY or OPENAI_API_KEY in the server environment or Secrets panel.',
    };
  }

  return {
    configured: true,
    activeProvider: resolved.provider,
    model: resolved.model,
    message:
      resolved.provider === 'openai'
        ? `Connected via backend OpenAI API (${resolved.model}).`
        : `Connected via backend Gemini API (${resolved.model} — Free Tier).`,
  };
}

function stripMarkdownFences(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  return trimmed;
}

function extractReadableErrorMessage(rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        error?: { message?: string };
        message?: string;
      };
      if (parsed?.error?.message) return parsed.error.message;
      if (parsed?.message) return parsed.message;
    } catch {
      // fall through
    }
  }
  return rawMessage;
}

function isTransientError(err: unknown): boolean {
  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : 0;
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('UNAVAILABLE') ||
    lower.includes('rate limit') ||
    lower.includes('high demand') ||
    lower.includes('timeout') ||
    lower.includes('econnreset')
  );
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === maxRetries) {
        break;
      }
      const delayMs = 600 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function normalizeProviderError(err: unknown): AIServiceError {
  if (err instanceof AIServiceError) {
    return err;
  }

  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : 0;
  const rawMessage = err instanceof Error ? err.message : String(err);
  const cleanMessage = extractReadableErrorMessage(rawMessage);
  const lower = cleanMessage.toLowerCase();

  if (
    status === 429 ||
    rawMessage.includes('429') ||
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    lower.includes('rate limit')
  ) {
    return new AIServiceError(
      'AI rate limit reached. Please wait a few seconds and retry your request.',
      429,
      'RATE_LIMITED'
    );
  }

  if (
    status === 503 ||
    rawMessage.includes('503') ||
    rawMessage.includes('UNAVAILABLE') ||
    lower.includes('high demand')
  ) {
    return new AIServiceError(
      'The AI service is temporarily experiencing high demand. Please retry in a moment.',
      503,
      'AI_TEMPORARILY_UNAVAILABLE'
    );
  }

  if (
    status === 401 ||
    status === 403 ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('PERMISSION_DENIED') ||
    lower.includes('incorrect api key')
  ) {
    return new AIServiceError(
      'Server AI API key was rejected by the provider. Please verify your configured API key in Settings > Secrets or .env.',
      403,
      'INVALID_API_KEY'
    );
  }

  return new AIServiceError(
    `AI evaluation service encountered an error: ${cleanMessage}`,
    502,
    'AI_UPSTREAM_ERROR'
  );
}

async function callGeminiWithFallback(params: {
  prompt: string;
  geminiSchema: Record<string, unknown>;
}): Promise<{ text: string; modelUsed: string }> {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      timeout: 30000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const orderedModels = getOrderedGeminiModels();
  let lastErr: unknown;
  for (const modelName of orderedModels) {
    try {
      const startMs = Date.now();
      const config: Record<string, unknown> = {
        systemInstruction: INTERVIEWER_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: params.geminiSchema,
      };
      if (modelName === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (modelName === 'gemini-3.1-flash-lite') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }

      const response: GenerateContentResponse =
        await ai.models.generateContent({
          model: modelName,
          contents: params.prompt,
          config,
        });

      console.log(
        `[MOCKMATE AI] ${modelName} responded in ${Date.now() - startMs}ms`
      );

      const text = response.text;
      if (!text) {
        throw new Error(`Gemini model ${modelName} returned an empty response.`);
      }
      return { text, modelUsed: modelName };
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err)) {
        throw err;
      }
      console.warn(
        `[MOCKMATE AI] Transient error on ${modelName}, trying next fallback model...`
      );
    }
  }
  throw lastErr;
}

async function callStructuredAI<T>(params: {
  prompt: string;
  schema: z.ZodType<T>;
  geminiSchema: Record<string, unknown>;
}): Promise<{ data: T; providerLabel: string }> {
  const resolved = resolveProvider();
  if (!resolved) {
    throw new AIServiceError(
      'No server-side AI API key configured. Please add OPENAI_API_KEY or GEMINI_API_KEY in the Secrets panel or .env file.',
      503,
      'AI_NOT_CONFIGURED'
    );
  }

  try {
    let rawText = '';
    let providerLabel = `${resolved.provider}:${resolved.model}`;

    if (resolved.provider === 'openai') {
      rawText = await withRetry(async () => {
        const client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_BASE_URL || undefined,
          timeout: 45000,
        });

        const completion = await client.chat.completions.create({
          model: resolved.model,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `${INTERVIEWER_SYSTEM_INSTRUCTION}\nRespond ONLY with a valid JSON object matching the requested fields.`,
            },
            {
              role: 'user',
              content: params.prompt,
            },
          ],
          temperature: 0.4,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('OpenAI returned an empty response.');
        }
        return content;
      });
    } else {
      const geminiRes = await withRetry(
        () =>
          callGeminiWithFallback({
            prompt: params.prompt,
            geminiSchema: params.geminiSchema,
          }),
        1
      );
      rawText = geminiRes.text;
      providerLabel = `gemini:${geminiRes.modelUsed}`;
    }

    const cleaned = stripMarkdownFences(rawText);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      throw new AIServiceError(
        'AI response was not valid JSON. Please retry.',
        502,
        'INVALID_AI_JSON'
      );
    }

    const validated = params.schema.safeParse(parsedJson);
    if (!validated.success) {
      throw new AIServiceError(
        `AI response failed structural validation: ${validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join(', ')}`,
        502,
        'SCHEMA_VALIDATION_FAILED'
      );
    }

    return {
      data: validated.data,
      providerLabel,
    };
  } catch (err) {
    throw normalizeProviderError(err);
  }
}

const GeminiSingleQuestionSchema = {
  type: Type.OBJECT,
  properties: {
    questionText: { type: Type.STRING },
    topicTag: { type: Type.STRING },
    interviewerIntent: { type: Type.STRING },
    expectedSignals: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'questionText',
    'topicTag',
    'interviewerIntent',
    'expectedSignals',
  ],
};

export async function generateInterviewQuestions(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  count: number;
  focusContext: string;
}): Promise<{ questions: GeneratedQuestionInput[]; providerLabel: string }> {
  const prompt = buildQuestionBatchPrompt(params);
  const { data, providerLabel } = await callStructuredAI({
    prompt,
    schema: QuestionBatchSchema,
    geminiSchema: {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          items: GeminiSingleQuestionSchema,
        },
      },
      required: ['questions'],
    },
  });

  // Deduplicate by normalized question text
  const seen = new Set<string>();
  const uniqueQuestions: GeneratedQuestionInput[] = [];
  for (const q of data.questions) {
    const key = q.questionText.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueQuestions.push(q);
    }
  }

  return {
    questions: uniqueQuestions.slice(0, params.count),
    providerLabel,
  };
}

export async function generateNextQuestion(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  focusContext: string;
  existingQuestions: string[];
}): Promise<{ question: GeneratedQuestionInput; providerLabel: string }> {
  const prompt = buildSingleQuestionPrompt(params);
  const { data, providerLabel } = await callStructuredAI({
    prompt,
    schema: SingleQuestionSchema,
    geminiSchema: GeminiSingleQuestionSchema,
  });

  return {
    question: data,
    providerLabel,
  };
}

export async function evaluateCandidateAnswer(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  questionText: string;
  expectedSignals: string[];
  answerText: string;
}): Promise<{ evaluation: SaveEvaluationInput; providerLabel: string }> {
  const prompt = buildAnswerEvaluationPrompt(params);
  const isBehavioralOrHr =
    params.interviewType === 'Behavioral' || params.interviewType === 'HR';

  const { data, providerLabel } = await callStructuredAI({
    prompt,
    schema: AnswerEvaluationSchema,
    geminiSchema: {
      type: Type.OBJECT,
      properties: {
        scores: {
          type: Type.OBJECT,
          properties: {
            relevance: { type: Type.NUMBER },
            clarity: { type: Type.NUMBER },
            completeness: { type: Type.NUMBER },
            structure: { type: Type.NUMBER },
            technicalAccuracy: { type: Type.NUMBER },
            communicationQuality: { type: Type.NUMBER },
          },
          required: [
            'relevance',
            'clarity',
            'completeness',
            'structure',
            'technicalAccuracy',
            'communicationQuality',
          ],
        },
        overallRating: { type: Type.NUMBER },
        ratingLabel: { type: Type.STRING },
        ratingExplanation: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvementTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        exampleImprovedAnswer: { type: Type.STRING },
        starBreakdown: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            situation: { type: Type.STRING },
            task: { type: Type.STRING },
            action: { type: Type.STRING },
            result: { type: Type.STRING },
          },
          required: ['situation', 'task', 'action', 'result'],
        },
        technicalReasoning: {
          type: Type.STRING,
          nullable: true,
        },
        coachingDisclaimer: { type: Type.STRING },
      },
      required: [
        'scores',
        'overallRating',
        'ratingLabel',
        'ratingExplanation',
        'strengths',
        'weaknesses',
        'missingPoints',
        'improvementTips',
        'exampleImprovedAnswer',
        'coachingDisclaimer',
      ],
    },
  });

  const round1 = (v: number) => Math.round(v * 10) / 10;

  return {
    evaluation: {
      scores: {
        relevance: round1(data.scores.relevance),
        clarity: round1(data.scores.clarity),
        completeness: round1(data.scores.completeness),
        structure: round1(data.scores.structure),
        technicalAccuracy: round1(data.scores.technicalAccuracy),
        communicationQuality: round1(data.scores.communicationQuality),
      },
      overallRating: round1(data.overallRating),
      ratingLabel: data.ratingLabel,
      ratingExplanation: data.ratingExplanation,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      missingPoints: data.missingPoints,
      improvementTips: data.improvementTips,
      exampleImprovedAnswer: data.exampleImprovedAnswer,
      starBreakdown: data.starBreakdown
        ? data.starBreakdown
        : isBehavioralOrHr
        ? {
            situation: 'Context was partially established in the response.',
            task: 'Responsibility could be stated more explicitly.',
            action: 'Concrete personal actions should be highlighted.',
            result: 'Include measurable or observable outcomes where possible.',
          }
        : null,
      technicalReasoning: data.technicalReasoning ?? null,
      coachingDisclaimer: data.coachingDisclaimer,
    },
    providerLabel,
  };
}

export async function generateSessionSummary(params: {
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  items: SessionQuestionItem[];
}): Promise<{ summary: SessionSummary; providerLabel: string }> {
  const prompt = buildSessionSummaryPrompt(params);
  const { data, providerLabel } = await callStructuredAI({
    prompt,
    schema: SessionSummarySchema,
    geminiSchema: {
      type: Type.OBJECT,
      properties: {
        overallFeedback: { type: Type.STRING },
        strongestAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
        areasNeedingImprovement: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        recommendedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedNextPracticeSession: {
          type: Type.OBJECT,
          properties: {
            jobRole: { type: Type.STRING },
            customRole: { type: Type.STRING },
            experienceLevel: { type: Type.STRING },
            interviewType: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            rationale: { type: Type.STRING },
          },
          required: [
            'jobRole',
            'experienceLevel',
            'interviewType',
            'difficulty',
            'rationale',
          ],
        },
      },
      required: [
        'overallFeedback',
        'strongestAnswers',
        'areasNeedingImprovement',
        'recommendedTopics',
        'suggestedNextPracticeSession',
      ],
    },
  });

  return {
    summary: {
      overallFeedback: data.overallFeedback,
      strongestAnswers: data.strongestAnswers,
      areasNeedingImprovement: data.areasNeedingImprovement,
      recommendedTopics: data.recommendedTopics,
      suggestedNextPracticeSession: {
        jobRole: data.suggestedNextPracticeSession.jobRole as JobRole,
        customRole: data.suggestedNextPracticeSession.customRole || '',
        experienceLevel: data.suggestedNextPracticeSession
          .experienceLevel as ExperienceLevel,
        interviewType: data.suggestedNextPracticeSession
          .interviewType as InterviewType,
        difficulty: data.suggestedNextPracticeSession
          .difficulty as DifficultyLevel,
        rationale: data.suggestedNextPracticeSession.rationale,
      },
    },
    providerLabel,
  };
}
