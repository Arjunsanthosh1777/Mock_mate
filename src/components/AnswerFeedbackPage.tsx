import React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react';
import type { DimensionScores, FullSessionDetail } from '../types/interview.ts';
import type { AppView } from './Navbar.tsx';

interface AnswerFeedbackPageProps {
  sessionDetail: FullSessionDetail | null;
  activeQuestionIndex: number;
  onSelectQuestionIndex: (index: number) => void;
  completingSession: boolean;
  onCompleteSession: () => Promise<void>;
  onNavigate: (view: AppView) => void;
}

const RUBRIC_ITEMS: { key: keyof DimensionScores; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'structure', label: 'Structure' },
  { key: 'technicalAccuracy', label: 'Technical Accuracy' },
  { key: 'communicationQuality', label: 'Communication Quality' },
];

export const AnswerFeedbackPage: React.FC<AnswerFeedbackPageProps> = ({
  sessionDetail,
  activeQuestionIndex,
  onSelectQuestionIndex,
  completingSession,
  onCompleteSession,
  onNavigate,
}) => {
  if (!sessionDetail) {
    return (
      <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          No Session Loaded for Answer Feedback
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Start a practice session and submit an answer, or select any saved
          session from Interview History to inspect detailed AI evaluations.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('setup')}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            Start New Session
          </button>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            Open History
          </button>
        </div>
      </div>
    );
  }

  const { session, items, statistics } = sessionDetail;
  const safeIdx = Math.max(
    0,
    Math.min(activeQuestionIndex, Math.max(0, items.length - 1))
  );
  const currentItem = items[safeIdx];

  if (!currentItem || !currentItem.feedback || !currentItem.answer) {
    const firstEvaluatedIdx = items.findIndex((i) => Boolean(i.feedback));
    return (
      <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Question {safeIdx + 1} Has Not Been Evaluated Yet
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Submit a response for this prompt in the Practice Studio to generate
          six-dimension rubric scores and improvement coaching.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            Answer in Practice Studio
          </button>
          {firstEvaluatedIdx >= 0 && (
            <button
              type="button"
              onClick={() => onSelectQuestionIndex(firstEvaluatedIdx)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Jump to Question {firstEvaluatedIdx + 1} Feedback
            </button>
          )}
        </div>
      </div>
    );
  }

  const { question, answer, feedback } = currentItem;

  return (
    <div className="space-y-8">
      {/* Top Question Selector & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <span>{question.topicTag}</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">
            Question {safeIdx + 1} Evaluation
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((item, idx) => {
            const hasFb = Boolean(item.feedback);
            const active = idx === safeIdx;
            return (
              <button
                key={item.question.id}
                type="button"
                onClick={() => onSelectQuestionIndex(idx)}
                className={`px-3 py-1.5 text-xs font-mono tabular-nums font-medium rounded-md border transition-colors cursor-pointer ${
                  active
                    ? 'border-blue-700 dark:border-blue-500 bg-blue-700 text-white dark:bg-blue-600'
                    : hasFb
                    ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1320] text-slate-800 dark:text-slate-200 hover:border-slate-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                Q{idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Prompt & Overall Rating Card */}
      <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-6">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Interview Prompt
          </div>
          <p className="mt-1.5 font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            {question.questionText}
          </p>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Practice Rating
            </div>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="font-mono tabular-nums text-4xl font-bold text-blue-700 dark:text-blue-400">
                {feedback.overallRating.toFixed(1)}
              </span>
              <span className="font-mono tabular-nums text-sm text-slate-500 dark:text-slate-400">
                / 10.0
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {feedback.ratingLabel}
            </div>
          </div>

          <div className="md:col-span-8 space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {feedback.ratingExplanation}
            </p>
            <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{feedback.coachingDisclaimer}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Six-Dimension Rubric Scores */}
      <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          Six-Dimension Rubric Breakdown
        </h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RUBRIC_ITEMS.map(({ key, label }) => {
            const score = feedback.scores[key];
            const pct = Math.max(0, Math.min(100, (score / 10) * 100));
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                    {score.toFixed(1)} / 10
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STAR Breakdown (Behavioral / HR) */}
      {feedback.starBreakdown && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            STAR Method Assessment
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluation of Situation, Task, Action, and Result structure
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 border border-slate-200 dark:border-slate-800 rounded-lg divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            <div className="p-5">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                01. Situation
              </div>
              <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {feedback.starBreakdown.situation}
              </p>
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                02. Task
              </div>
              <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {feedback.starBreakdown.task}
              </p>
            </div>
            <div className="p-5 md:border-t md:border-slate-200 dark:md:border-slate-800">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                03. Action
              </div>
              <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {feedback.starBreakdown.action}
              </p>
            </div>
            <div className="p-5 md:border-t md:border-slate-200 dark:md:border-slate-800">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                04. Result
              </div>
              <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {feedback.starBreakdown.result}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Technical Accuracy & Reasoning (Technical / General) */}
      {feedback.technicalReasoning && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Technical Correctness & Reasoning Review
          </h2>
          <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {feedback.technicalReasoning}
          </p>
        </div>
      )}

      {/* Strengths, Weaknesses, Missing Points, Improvement Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] rounded-xl divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-6">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Key Strengths
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {feedback.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Weaknesses Observed
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
            {feedback.weaknesses.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>

        <div className="p-6 md:border-t md:border-slate-200 dark:md:border-slate-800">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Missing Points & Signals
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
            {feedback.missingPoints.map((m, idx) => (
              <li key={idx}>{m}</li>
            ))}
          </ul>
        </div>

        <div className="p-6 md:border-t md:border-slate-200 dark:md:border-slate-800">
          <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
            Specific Improvement Tips
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
            {feedback.improvementTips.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Side-by-Side Answer vs Example Improved Answer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Your Submitted Answer
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {answer.wordCount} words
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {answer.answerText}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-sm font-semibold text-blue-700 dark:text-blue-400">
            Example Improved Answer
          </h3>
          <p className="mt-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {feedback.exampleImprovedAnswer}
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0D1320] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Practice Editor</span>
          </button>

          {(() => {
            const nextIdx =
              safeIdx < items.length - 1
                ? safeIdx + 1
                : items.findIndex(
                    (it, idx) =>
                      idx !== safeIdx && it.question.status === 'unanswered'
                  );
            if (nextIdx < 0) return null;
            return (
              <button
                type="button"
                onClick={() => {
                  onSelectQuestionIndex(nextIdx);
                  onNavigate('practice');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>Practice Question {nextIdx + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            );
          })()}
        </div>

        {statistics.questionsAttempted > 0 && (
          <button
            type="button"
            disabled={completingSession}
            onClick={() => {
              if (session.status === 'completed' && statistics.summary) {
                onNavigate('results');
              } else {
                onCompleteSession();
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            {completingSession ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Session Results...</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                <span>
                  {session.status === 'completed'
                    ? 'View Session Results'
                    : 'Complete Session & View Results'}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
