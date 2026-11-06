import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  GitCompare,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../lib/api.ts';
import {
  INTERVIEW_TYPES,
  type InterviewType,
  type SessionListItem,
} from '../types/interview.ts';
import { SessionComparisonChart } from './Charts.tsx';
import type { AppView } from './Navbar.tsx';

interface InterviewHistoryPageProps {
  sessions: SessionListItem[];
  loading: boolean;
  onOpenSession: (
    sessionId: string,
    targetView: 'practice' | 'feedback' | 'results'
  ) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onNavigate: (view: AppView) => void;
}

export const InterviewHistoryPage: React.FC<InterviewHistoryPageProps> = ({
  sessions,
  loading,
  onOpenSession,
  onDeleteSession,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | InterviewType>('All');
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'completed' | 'in_progress'
  >('All');
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [comparedItems, setComparedItems] = useState<SessionListItem[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sessions.filter(({ session }) => {
      if (typeFilter !== 'All' && session.interviewType !== typeFilter) {
        return false;
      }
      if (statusFilter !== 'All' && session.status !== statusFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          session.effectiveRole,
          session.experienceLevel,
          session.interviewType,
          session.difficulty,
          session.focusContext,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sessions, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    let active = true;
    if (selectedCompareIds.length < 2) {
      setComparedItems([]);
      return;
    }
    api
      .compareSessions(selectedCompareIds)
      .then((res) => {
        if (active) setComparedItems(res.sessions);
      })
      .catch(() => {
        if (active) {
          const idSet = new Set(selectedCompareIds);
          setComparedItems(sessions.filter((s) => idSet.has(s.session.id)));
        }
      });
    return () => {
      active = false;
    };
  }, [selectedCompareIds, sessions]);

  const toggleCompare = (id: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteSession(id);
      setSelectedCompareIds((prev) => prev.filter((x) => x !== id));
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Interview History & Comparison
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Review past transcripts, inspect AI evaluations, or select 2 to 3
            sessions to compare side by side.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('setup')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>New Practice Session</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Side-by-Side Comparison Workbench (Active when 2+ sessions selected) */}
      {comparedItems.length >= 2 && (
        <div className="p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-blue-300 dark:border-blue-800 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Side-by-Side Session Comparison ({comparedItems.length}{' '}
                selected)
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCompareIds([])}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Comparison</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6">
              <SessionComparisonChart sessions={comparedItems} />
            </div>

            <div className="lg:col-span-6 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Metric</th>
                    {comparedItems.map((c) => (
                      <th
                        key={c.session.id}
                        className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-white"
                      >
                        {c.session.effectiveRole}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  <tr>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                      Format & Level
                    </td>
                    {comparedItems.map((c) => (
                      <td
                        key={c.session.id}
                        className="py-2.5 px-3 text-right text-slate-800 dark:text-slate-200"
                      >
                        {c.session.interviewType} · {c.session.difficulty}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                      Attempted / Skipped
                    </td>
                    {comparedItems.map((c) => (
                      <td
                        key={c.session.id}
                        className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200"
                      >
                        {c.statistics.questionsAttempted} /{' '}
                        {c.statistics.questionsSkipped}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-white">
                      Average Rating
                    </td>
                    {comparedItems.map((c) => (
                      <td
                        key={c.session.id}
                        className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-blue-700 dark:text-blue-400"
                      >
                        {c.statistics.averageRating.toFixed(1)} / 10
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                      Technical Accuracy
                    </td>
                    {comparedItems.map((c) => (
                      <td
                        key={c.session.id}
                        className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200"
                      >
                        {c.statistics.avgTechnicalAccuracy.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                      Structure & Clarity
                    </td>
                    {comparedItems.map((c) => (
                      <td
                        key={c.session.id}
                        className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200"
                      >
                        {c.statistics.avgStructure.toFixed(1)} /{' '}
                        {c.statistics.avgClarity.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by role, difficulty, or focus topic..."
            aria-label="Search interview sessions"
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#090D16] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {(['All', ...INTERVIEW_TYPES] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  typeFilter === t
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
            {[
              { id: 'All' as const, label: 'All Status' },
              { id: 'completed' as const, label: 'Completed' },
              { id: 'in_progress' as const, label: 'In Progress' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Archive List */}
      {loading && sessions.length === 0 ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {sessions.length === 0
              ? 'Your interview history is empty'
              : 'No sessions match your active filters'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {sessions.length === 0
              ? 'Start an interview session to record questions, answers, and AI rubric evaluations.'
              : 'Adjust your search query or filter tabs to view saved sessions.'}
          </p>
          {sessions.length === 0 && (
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
            >
              Start First Interview
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
          {filteredSessions.map(({ session, statistics }) => {
            const isChecked = selectedCompareIds.includes(session.id);
            const isConfirmingDelete = confirmDeleteId === session.id;
            return (
              <div
                key={session.id}
                className="p-5 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCompare(session.id)}
                    aria-label={`Select ${session.effectiveRole} session for comparison`}
                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-700 focus:ring-blue-600 cursor-pointer shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="font-display text-base font-semibold text-slate-900 dark:text-white truncate">
                      {session.effectiveRole}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
                      <span className="font-mono tabular-nums">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span>
                        {session.status === 'completed'
                          ? 'Completed'
                          : 'In Progress'}
                      </span>
                    </div>
                    {session.focusContext && (
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 truncate max-w-xl">
                        Focus: {session.focusContext}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <div className="font-mono tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                      {statistics.averageRating > 0
                        ? `${statistics.averageRating.toFixed(1)} / 10`
                        : 'No Rating'}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {statistics.questionsAttempted} answered ·{' '}
                      {statistics.questionsSkipped} skipped
                    </div>
                  </div>

                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={deletingId === session.id}
                        onClick={() => handleConfirmDelete(session.id)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                      >
                        {deletingId === session.id
                          ? 'Deleting...'
                          : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <button
                        type="button"
                        onClick={() => onOpenSession(session.id, 'practice')}
                        className="text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        {session.status === 'completed' ? 'Questions' : 'Resume'}
                      </button>

                      {statistics.questionsAttempted > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenSession(session.id, 'feedback')
                            }
                            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                          >
                            Feedback
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenSession(session.id, 'results')}
                            className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline cursor-pointer"
                          >
                            Results
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(session.id)}
                        aria-label={`Delete ${session.effectiveRole} session`}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
