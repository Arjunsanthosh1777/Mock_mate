import React from 'react';
import { ArrowRight, Plus, RefreshCw } from 'lucide-react';
import type { DashboardData, UserPreferences } from '../types/interview.ts';
import { CompetencyBarChart, PracticeTrendChart } from './Charts.tsx';
import type { AppView } from './Navbar.tsx';

interface DashboardPageProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  preferences: UserPreferences | null;
  onRetry: () => void;
  onNavigate: (view: AppView) => void;
  onOpenSession: (sessionId: string, targetView: 'practice' | 'feedback' | 'results') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  loading,
  error,
  preferences,
  onRetry,
  onNavigate,
  onOpenSession,
}) => {
  if (loading && !data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-20 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-72 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="lg:col-span-5 h-72 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-red-200 dark:border-red-900/60">
        <h2 className="font-display text-base font-semibold text-red-700 dark:text-red-400">
          Unable to load dashboard analytics
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const candidateFirst =
    preferences?.candidateName?.split(' ')[0] || 'Candidate';
  const totalSessions = data?.totalSessions ?? 0;

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {candidateFirst}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Track your interview preparation consistency, six-dimension rubric
            averages, and saved practice transcripts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('setup')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Start Interview Session</span>
        </button>
      </div>

      {/* 4-Column KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Saved Sessions
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
            {data?.totalSessions ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {data?.completedSessions ?? 0} completed
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Questions Answered
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
            {data?.totalQuestionsAnswered ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {data?.totalQuestionsSkipped ?? 0} skipped
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Average Rubric Rating
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
            {data && data.overallAverageRating > 0
              ? data.overallAverageRating.toFixed(1)
              : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Scale of 1.0 to 10.0
          </div>
        </div>

        <div className="p-6">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Answer Completion Rate
          </div>
          <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-white">
            {data ? `${data.completionRate}%` : '0%'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Attempted vs. generated
          </div>
        </div>
      </div>

      {/* Empty State vs Populated Charts & Table */}
      {totalSessions === 0 ? (
        <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            No interview sessions recorded yet
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Configure your first practice session by selecting a target role,
            experience level, interview format, and difficulty. All questions,
            answers, and AI feedback will persist here automatically.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              <span>Configure First Session</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              Customize Profile Defaults
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Practice Rating Trajectory
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Hover or select any session point to inspect performance
                </p>
              </div>
              <PracticeTrendChart
                points={data?.trendPoints ?? []}
                onSelectSession={(id) => onOpenSession(id, 'results')}
              />
            </div>

            <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800">
              <div className="mb-4">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Six-Dimension Competency Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cumulative averages across all evaluated answers
                </p>
              </div>
              <CompetencyBarChart
                scores={
                  data?.competencyAverages ?? {
                    relevance: 0,
                    clarity: 0,
                    completeness: 0,
                    structure: 0,
                    technicalAccuracy: 0,
                    communicationQuality: 0,
                  }
                }
              />
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  Recent Interview Sessions
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Resume active sessions or review completed evaluations
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('history')}
                className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                View All History
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/40">
                    <th className="py-3 px-6">Role & Configuration</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Answered</th>
                    <th className="py-3 px-4 text-right">Avg Rating</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {(data?.recentSessions ?? []).map(({ session, statistics }) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {session.effectiveRole}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{session.experienceLevel}</span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          <span>{session.interviewType}</span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          <span>{session.difficulty}</span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          <span>
                            {session.status === 'completed'
                              ? 'Completed'
                              : 'In Progress'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {statistics.questionsAttempted}/
                        {statistics.questionsGenerated}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {statistics.averageRating > 0
                          ? `${statistics.averageRating.toFixed(1)}/10`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-3 text-xs font-medium">
                          <button
                            type="button"
                            onClick={() => onOpenSession(session.id, 'practice')}
                            className="text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {session.status === 'completed'
                              ? 'Review Q&A'
                              : 'Resume'}
                          </button>
                          {statistics.questionsAttempted > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenSession(session.id, 'results')
                              }
                              className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                            >
                              Results
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
