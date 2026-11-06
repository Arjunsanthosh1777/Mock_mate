import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
} from 'lucide-react';
import type {
  FullSessionDetail,
  SuggestedPracticeSession,
} from '../types/interview.ts';
import { CompetencyBarChart } from './Charts.tsx';
import type { AppView } from './Navbar.tsx';

interface InterviewResultsPageProps {
  sessionDetail: FullSessionDetail | null;
  completingSession: boolean;
  onCompleteSession: () => Promise<void>;
  onSelectQuestionForFeedback: (index: number) => void;
  onLaunchSuggestedSession: (preset: SuggestedPracticeSession) => void;
  onNavigate: (view: AppView) => void;
}

export const InterviewResultsPage: React.FC<InterviewResultsPageProps> = ({
  sessionDetail,
  completingSession,
  onCompleteSession,
  onSelectQuestionForFeedback,
  onLaunchSuggestedSession,
  onNavigate,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  if (!sessionDetail) {
    return (
      <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          No Interview Session Selected
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Complete a practice session or select any saved session from Interview
          History to view its comprehensive results report.
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
            View Saved History
          </button>
        </div>
      </div>
    );
  }

  const { session, items, statistics } = sessionDetail;
  const summary = statistics.summary;

  if (!summary) {
    return (
      <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {session.effectiveRole} · {session.experienceLevel} ·{' '}
          {session.interviewType} · {session.difficulty}
        </div>
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Session Summary Not Yet Generated
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          {statistics.questionsAttempted > 0
            ? `You have answered ${statistics.questionsAttempted} of ${statistics.questionsGenerated} questions. Generate your holistic AI session summary now or continue practicing.`
            : 'Answer at least one question in the Practice Studio before generating your end-of-session summary.'}
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {statistics.questionsAttempted > 0 && (
            <button
              type="button"
              disabled={completingSession}
              onClick={onCompleteSession}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {completingSession ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Session Summary...</span>
                </>
              ) : (
                <span>Complete & Generate Summary</span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            Return to Practice Studio
          </button>
        </div>
      </div>
    );
  }

  const toggleExpanded = (qId: string) => {
    setExpandedIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className="space-y-8">
      {/* Top Title & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
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
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interview Session Results
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('setup')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Start Another Session</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* 4-Column Session Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Questions Attempted
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
            {statistics.questionsAttempted}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Out of {statistics.questionsGenerated} prompts
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Questions Skipped
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
            {statistics.questionsSkipped}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Marked for later review
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Session Average Rating
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-blue-700 dark:text-blue-400">
            {statistics.averageRating.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Scale of 1.0 to 10.0
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Completed On
          </div>
          <div className="mt-2 font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
            {new Date(
              session.completedAt || session.createdAt
            ).toLocaleDateString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saved in SQLite archive
          </div>
        </div>
      </div>

      {/* Overall Feedback & Competency Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Overall Coaching Feedback
            </h2>
            <p className="mt-3 text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
              {summary.overallFeedback}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              AI coaching summaries highlight communication and technical patterns
              for practice purposes and do not represent an objective hiring
              decision.
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-4">
            Session Rubric Averages
          </h2>
          <CompetencyBarChart
            scores={{
              relevance: statistics.avgRelevance,
              clarity: statistics.avgClarity,
              completeness: statistics.avgCompleteness,
              structure: statistics.avgStructure,
              technicalAccuracy: statistics.avgTechnicalAccuracy,
              communicationQuality: statistics.avgCommunication,
            }}
          />
        </div>
      </div>

      {/* Strongest Answers & Areas Needing Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] rounded-xl divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-6 sm:p-8">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Strongest Answers
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed">
            {summary.strongestAnswers.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Areas Needing Improvement
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside leading-relaxed">
            {summary.areasNeedingImprovement.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Study Topics & Suggested Next Practice Session */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Recommended Study Topics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Targeted concepts to review before your next mock round
          </p>
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800 text-sm">
            {summary.recommendedTopics.map((topic, idx) => (
              <li
                key={idx}
                className="py-3 flex items-baseline gap-3 text-slate-800 dark:text-slate-200"
              >
                <span className="font-mono text-xs text-blue-700 dark:text-blue-400 tabular-nums">
                  0{idx + 1}.
                </span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Suggested Next Practice Session
            </h2>
            <div className="mt-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              <span>
                {summary.suggestedNextPracticeSession.jobRole === 'Other' &&
                summary.suggestedNextPracticeSession.customRole
                  ? summary.suggestedNextPracticeSession.customRole
                  : summary.suggestedNextPracticeSession.jobRole}
              </span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>
                {summary.suggestedNextPracticeSession.experienceLevel}
              </span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>{summary.suggestedNextPracticeSession.interviewType}</span>
              <span className="mx-1.5" aria-hidden="true">
                ·
              </span>
              <span>{summary.suggestedNextPracticeSession.difficulty}</span>
            </div>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {summary.suggestedNextPracticeSession.rationale}
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() =>
                onLaunchSuggestedSession(summary.suggestedNextPracticeSession)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              <span>Configure Suggested Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Question-by-Question Transcript Review */}
      <div className="rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Question-by-Question Review
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Expand any prompt to review your submitted answer and rubric critique
          </p>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {items.map((item, idx) => {
            const isOpen = Boolean(expandedIds[item.question.id]);
            const fb = item.feedback;
            return (
              <div key={item.question.id} className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.question.id)}
                    className="flex-1 text-left cursor-pointer group"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums font-semibold text-blue-700 dark:text-blue-400">
                        Q{idx + 1}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>{item.question.topicTag}</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        {item.question.status === 'answered'
                          ? 'Answered'
                          : item.question.status === 'skipped'
                          ? 'Skipped'
                          : 'Unanswered'}
                      </span>
                    </div>
                    <div className="mt-1 font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {item.question.questionText}
                    </div>
                  </button>

                  <div className="flex items-center gap-4 shrink-0">
                    {fb ? (
                      <span className="font-mono tabular-nums text-sm font-semibold text-slate-900 dark:text-white">
                        {fb.overallRating.toFixed(1)} / 10
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Skipped</span>
                    )}

                    {fb && (
                      <button
                        type="button"
                        onClick={() => onSelectQuestionForFeedback(idx)}
                        className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Full Critique
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.question.id)}
                      aria-label={isOpen ? 'Collapse question' : 'Expand question'}
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md cursor-pointer"
                    >
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 text-sm">
                    {item.answer ? (
                      <>
                        <div>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Your Answer
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {item.answer.answerText}
                          </p>
                        </div>
                        {fb && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Strengths
                              </div>
                              <ul className="mt-1 list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                                {fb.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                Improvement Tips
                              </div>
                              <ul className="mt-1 list-disc list-inside text-slate-700 dark:text-slate-300 space-y-1">
                                {fb.improvementTips.map((t, i) => (
                                  <li key={i}>{t}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        This question was skipped during the practice session.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
