export const JOB_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'Python Developer',
  'Data Analyst',
  'Software Tester',
  'Other',
] as const;

export type JobRole = (typeof JOB_ROLES)[number];

export const EXPERIENCE_LEVELS = [
  'Fresher',
  'Beginner',
  'Intermediate',
  'Experienced',
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const INTERVIEW_TYPES = [
  'HR',
  'Technical',
  'Behavioral',
  'General',
] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const FREE_GEMINI_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
] as const;

export type FreeGeminiModel = (typeof FREE_GEMINI_MODELS)[number];

export type ThemeMode = 'light' | 'dark';

export interface UserPreferences {
  id: number;
  candidateName: string;
  targetHeadline: string;
  defaultJobRole: JobRole;
  customJobRole: string;
  defaultExperience: ExperienceLevel;
  defaultInterviewType: InterviewType;
  defaultDifficulty: DifficultyLevel;
  defaultQuestionCount: number;
  preferredGeminiModel: FreeGeminiModel;
  theme: ThemeMode;
  focusNotes: string;
  updatedAt: string;
}

export interface DimensionScores {
  relevance: number;
  clarity: number;
  completeness: number;
  structure: number;
  technicalAccuracy: number;
  communicationQuality: number;
}

export interface StarBreakdown {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface AnswerFeedback {
  id: string;
  sessionId: string;
  questionId: string;
  answerId: string;
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
  createdAt: string;
}

export interface SubmittedAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  characterCount: number;
  wordCount: number;
  submittedAt: string;
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionOrder: number;
  questionText: string;
  topicTag: string;
  interviewerIntent: string;
  expectedSignals: string[];
  status: 'unanswered' | 'answered' | 'skipped';
  createdAt: string;
}

export interface SessionQuestionItem {
  question: InterviewQuestion;
  answer: SubmittedAnswer | null;
  feedback: AnswerFeedback | null;
}

export interface SuggestedPracticeSession {
  jobRole: JobRole;
  customRole?: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  rationale: string;
}

export interface SessionSummary {
  overallFeedback: string;
  strongestAnswers: string[];
  areasNeedingImprovement: string[];
  recommendedTopics: string[];
  suggestedNextPracticeSession: SuggestedPracticeSession;
}

export interface SessionStatistics {
  sessionId: string;
  questionsGenerated: number;
  questionsAttempted: number;
  questionsSkipped: number;
  averageRating: number;
  avgRelevance: number;
  avgClarity: number;
  avgCompleteness: number;
  avgStructure: number;
  avgTechnicalAccuracy: number;
  avgCommunication: number;
  summary: SessionSummary | null;
  updatedAt: string;
}

export interface InterviewSession {
  id: string;
  jobRole: JobRole;
  customRole: string;
  effectiveRole: string;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: DifficultyLevel;
  targetQuestionCount: number;
  focusContext: string;
  status: 'in_progress' | 'completed';
  currentQuestionIndex: number;
  aiProviderUsed: string;
  createdAt: string;
  completedAt: string | null;
}

export interface FullSessionDetail {
  session: InterviewSession;
  items: SessionQuestionItem[];
  statistics: SessionStatistics;
}

export interface SessionListItem {
  session: InterviewSession;
  statistics: SessionStatistics;
}

export interface TrendPoint {
  sessionId: string;
  label: string;
  date: string;
  effectiveRole: string;
  interviewType: InterviewType;
  averageRating: number;
  questionsAttempted: number;
  questionsGenerated: number;
}

export interface DashboardData {
  totalSessions: number;
  completedSessions: number;
  totalQuestionsAnswered: number;
  totalQuestionsSkipped: number;
  overallAverageRating: number;
  completionRate: number;
  competencyAverages: DimensionScores;
  recentSessions: SessionListItem[];
  trendPoints: TrendPoint[];
}

export interface SessionComparisonResult {
  sessions: SessionListItem[];
}

export interface AIHealthStatus {
  configured: boolean;
  activeProvider: 'openai' | 'gemini' | 'unconfigured';
  model: string;
  message: string;
}
