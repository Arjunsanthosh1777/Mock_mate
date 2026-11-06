import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  HelpCircle,
  Loader2,
  RefreshCw,
  Send,
  SkipForward,
} from 'lucide-react';
import type { FullSessionDetail } from '../types/interview.ts';
import type { AppView } from './Navbar.tsx';

interface InterviewPracticePageProps {
  sessionDetail: FullSessionDetail | null;
  activeQuestionIndex: number;
  onSelectQuestionIndex: (index: number) => void;
  submittingAnswer: boolean;
  generatingNextQuestion: boolean;
  completingSession: boolean;
  error: string | null;
  onClearError: () => void;
  onSubmitAnswer: (questionId: string, answerText: string) => Promise<void>;
  onSkipQuestion: (questionId: string) => Promise<void>;
  onRequestAnotherQuestion: () => Promise<void>;
  onCompleteSession: () => Promise<void>;
  onNavigate: (view: AppView) => void;
}

export const InterviewPracticePage: React.FC<InterviewPracticePageProps> = ({
  sessionDetail,
  activeQuestionIndex,
  onSelectQuestionIndex,
  submittingAnswer,
  generatingNextQuestion,
  completingSession,
  error,
  onClearError,
  onSubmitAnswer,
  onSkipQuestion,
  onRequestAnotherQuestion,
  onCompleteSession,
  onNavigate,
}) => {
  const [answerDraft, setAnswerDraft] = useState('');
  const [localValidation, setLocalValidation] = useState<string | null>(null);
  const [showIntent, setShowIntent] = useState(false);

  const items = sessionDetail?.items ?? [];
  const safeIndex = Math.max(
    0,
    Math.min(activeQuestionIndex, Math.max(0, items.length - 1))
  );
  const currentItem = items[safeIndex] ?? null;

  useEffect(() => {
    if (currentItem) {
      setAnswerDraft(currentItem.answer?.answerText ?? '');
      setLocalValidation(null);
    }
  }, [currentItem?.question.id, currentItem?.answer?.answerText]);

  if (!sessionDetail || !currentItem) {
    return (
      <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          No Active Interview Session Selected
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Configure a new interview session or resume a saved session from your
          interview history to practice answering questions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('setup')}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            Configure New Session
          </button>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            Browse Saved History
          </button>
        </div>
      </div>
    );
  }

  const { session, statistics } = sessionDetail;
  const { question, feedback } = currentItem;
  const totalCount = items.length;
  const addressedCount =
    statistics.questionsAttempted + statistics.questionsSkipped;
  const progressPercent = Math.round(
    (addressedCount / Math.max(1, totalCount)) * 100
  );
  const allAddressed = totalCount > 0 && addressedCount >= totalCount;

  const trimmedLength = answerDraft.trim().length;
  const wordCount = answerDraft.trim()
    ? answerDraft.trim().split(/\s+/).length
    : 0;

  const isBusy =
    submittingAnswer || generatingNextQuestion || completingSession;

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    if (trimmedLength < 10) {
      setLocalValidation(
        'Please enter a substantive answer (at least 10 characters) before submitting for AI evaluation.'
      );
      return;
    }

    setLocalValidation(null);
    await onSubmitAnswer(question.id, answerDraft);
  };

  const activeError = localValidation || error;

  return (
    <div className="space-y-6">
      {/* Top Session Progress Bar */}
      <div className="p-5 sm:p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>{session.effectiveRole}</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>{session.experienceLevel}</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>{session.interviewType}</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>{session.difficulty}</span>
            </div>
            <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              Question {safeIndex + 1} of {totalCount}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              {statistics.questionsAttempted} answered ·{' '}
              {statistics.questionsSkipped} skipped
            </div>
            {statistics.questionsAttempted > 0 && (
              <button
                type="button"
                disabled={isBusy}
                onClick={onCompleteSession}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {completingSession ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Summarizing...</span>
                  </>
                ) : (
                  <span>Finish & View Summary</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Linear Progress Meter */}
        <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Stepper Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {items.map((item, idx) => {
            const isCurrent = idx === safeIndex;
            const status = item.question.status;
            return (
              <button
                key={item.question.id}
                type="button"
                disabled={isBusy}
                onClick={() => onSelectQuestionIndex(idx)}
                className={`px-3 py-1.5 text-xs font-mono tabular-nums font-medium rounded-md border transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border-blue-700 dark:border-blue-500 bg-blue-700 text-white dark:bg-blue-600'
                    : status === 'answered'
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : status === 'skipped'
                    ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 line-through'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Q{idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {activeError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3 text-sm text-red-800 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{activeError}</div>
        </div>
      )}

      {allAddressed && (
        <div className="p-5 rounded-xl bg-white dark:bg-[#0D1320] border border-blue-300 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              All {totalCount} questions in this session have been addressed
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {statistics.questionsAttempted > 0
                ? 'Generate your holistic end-of-session summary, or request another question to keep practicing.'
                : 'You skipped all prompts so far. Answer at least one question or request another question to generate a session summary.'}
            </p>
          </div>
          {statistics.questionsAttempted > 0 && (
            <button
              type="button"
              disabled={isBusy}
              onClick={onCompleteSession}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {completingSession ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Results...</span>
                </>
              ) : (
                <span>
                  {session.status === 'completed'
                    ? 'View Session Results'
                    : 'Complete & View Results'}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              {question.topicTag}
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              Status:{' '}
              {question.status === 'answered'
                ? 'Answered'
                : question.status === 'skipped'
                ? 'Skipped'
                : 'Awaiting Response'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowIntent((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showIntent ? 'Hide Focus Hint' : 'Interviewer Focus'}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={onRequestAnotherQuestion}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline disabled:opacity-50 cursor-pointer"
            >
              {generatingNextQuestion ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Question...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request Another Question</span>
                </>
              )}
            </button>
          </div>
        </div>

        <h2
          className="mt-4 font-display text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-snug"
          style={{ textWrap: 'balance' }}
        >
          {question.questionText}
        </h2>

        {showIntent && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <p>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                What this assesses:{' '}
              </span>
              {question.interviewerIntent}
            </p>
            {question.expectedSignals.length > 0 && (
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Key signals to consider:{' '}
                </span>
                <span>{question.expectedSignals.join(' · ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Already Evaluated Banner if revisiting */}
      {feedback && (
        <div className="p-4 sm:p-5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                Evaluated ({feedback.overallRating.toFixed(1)} / 10 —{' '}
                {feedback.ratingLabel})
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                You can inspect the full six-dimension rubric breakdown or edit
                your answer below and re-submit.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('feedback')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-blue-800 dark:text-blue-200 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Answer Feedback</span>
          </button>
        </div>
      )}

      {/* Answer Editor Form */}
      <form
        onSubmit={handleAnswerSubmit}
        className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-5"
      >
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="interview-answer-editor"
            className="font-display text-sm font-semibold text-slate-900 dark:text-white"
          >
            Your Response
          </label>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {trimmedLength} chars · {wordCount} words
          </div>
        </div>

        <textarea
          id="interview-answer-editor"
          rows={9}
          disabled={isBusy}
          value={answerDraft}
          onChange={(e) => {
            setAnswerDraft(e.target.value);
            if (localValidation) setLocalValidation(null);
          }}
          placeholder={
            session.interviewType === 'Behavioral' ||
            session.interviewType === 'HR'
              ? 'Structure your response using STAR: describe the Situation, your specific Task, the Actions you took, and the measurable Result...'
              : 'Explain your reasoning clearly, cover core architecture or concepts, mention edge cases and trade-offs, and give concrete examples...'
          }
          className="w-full px-4 py-3.5 text-sm sm:text-[15px] leading-relaxed rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
        />

        {/* Controls Footer */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBusy || safeIndex === 0}
              onClick={() => onSelectQuestionIndex(safeIndex - 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous Question</span>
            </button>

            <button
              type="button"
              disabled={isBusy || safeIndex >= totalCount - 1}
              onClick={() => onSelectQuestionIndex(safeIndex + 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Next Question</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onSkipQuestion(question.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SkipForward className="w-4 h-4 shrink-0" />
              <span>Skip Question</span>
            </button>

            <button
              type="submit"
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submittingAnswer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Evaluating Answer...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 shrink-0" />
                  <span>
                    {feedback ? 'Re-Evaluate Answer' : 'Submit Answer'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
