import { useCallback, useEffect, useState } from 'react';
import { AnswerFeedbackPage } from './components/AnswerFeedbackPage.tsx';
import { DashboardPage } from './components/DashboardPage.tsx';
import { InterviewHistoryPage } from './components/InterviewHistoryPage.tsx';
import { InterviewPracticePage } from './components/InterviewPracticePage.tsx';
import { InterviewResultsPage } from './components/InterviewResultsPage.tsx';
import { InterviewSetupPage } from './components/InterviewSetupPage.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { WorkspaceShell, type AppView } from './components/Navbar.tsx';
import { ProfileSettingsPage } from './components/ProfileSettingsPage.tsx';
import { api, ApiError } from './lib/api.ts';
import type {
  AIHealthStatus,
  DashboardData,
  DifficultyLevel,
  ExperienceLevel,
  FullSessionDetail,
  InterviewType,
  JobRole,
  SessionListItem,
  SuggestedPracticeSession,
  ThemeMode,
  UserPreferences,
} from './types/interview.ts';

function applyThemeClass(theme: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
  try {
    localStorage.setItem('mockmate-theme', theme);
  } catch {
    // ignore storage quota errors
  }
}

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return localStorage.getItem('mockmate-theme') === 'dark'
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [aiHealth, setAiHealth] = useState<AIHealthStatus | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [activeSession, setActiveSession] = useState<FullSessionDetail | null>(
    null
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [suggestedPreset, setSuggestedPreset] =
    useState<SuggestedPracticeSession | null>(null);

  const [creatingSession, setCreatingSession] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [generatingNextQuestion, setGeneratingNextQuestion] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshWorkspaceData = useCallback(async () => {
    setDashboardLoading(true);
    setSessionsLoading(true);
    setDashboardError(null);
    try {
      const [dash, list] = await Promise.all([
        api.getDashboard(),
        api.listSessions(),
      ]);
      setDashboardData(dash);
      setSessions(list.sessions);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to load interview workspace data.';
      setDashboardError(msg);
    } finally {
      setDashboardLoading(false);
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [prefs, health] = await Promise.all([
          api.getPreferences(),
          api.getHealth(),
        ]);
        if (!mounted) return;
        setPreferences(prefs);
        setAiHealth(health.ai);
        setTheme(prefs.theme);
        applyThemeClass(prefs.theme);
      } catch {
        // non-fatal on initial mount
      }
    })();
    refreshWorkspaceData();
    return () => {
      mounted = false;
    };
  }, [refreshWorkspaceData]);

  const handleToggleTheme = async (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    applyThemeClass(nextTheme);
    try {
      const updated = await api.updatePreferences({ theme: nextTheme });
      setPreferences(updated);
    } catch {
      // keep local theme active even if network fails
    }
  };

  const handleSavePreferences = async (
    data: Partial<Omit<UserPreferences, 'id' | 'updatedAt'>>
  ) => {
    setSavingPreferences(true);
    setActionError(null);
    try {
      const updated = await api.updatePreferences(data);
      setPreferences(updated);
      if (data.theme) {
        setTheme(data.theme);
        applyThemeClass(data.theme);
      }
      api
        .getHealth()
        .then((h) => setAiHealth(h.ai))
        .catch(() => {
          // ignore health refresh failure
        });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to save preferences.'
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleStartSession = async (config: {
    jobRole: JobRole;
    customRole: string;
    experienceLevel: ExperienceLevel;
    interviewType: InterviewType;
    difficulty: DifficultyLevel;
    questionCount: number;
    focusContext: string;
  }) => {
    setCreatingSession(true);
    setActionError(null);
    try {
      const created = await api.createSession(config);
      setActiveSession(created);
      setActiveQuestionIndex(0);
      setSuggestedPreset(null);
      setView('practice');
      await refreshWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Failed to generate interview questions.'
      );
    } finally {
      setCreatingSession(false);
    }
  };

  const handleOpenSession = async (
    sessionId: string,
    targetView: 'practice' | 'feedback' | 'results'
  ) => {
    setActionError(null);
    try {
      const detail = await api.getSession(sessionId);
      setActiveSession(detail);

      if (targetView === 'feedback') {
        const firstEvaluated = detail.items.findIndex((i) =>
          Boolean(i.feedback)
        );
        setActiveQuestionIndex(firstEvaluated >= 0 ? firstEvaluated : 0);
      } else {
        const firstUnanswered = detail.items.findIndex(
          (i) => i.question.status === 'unanswered'
        );
        setActiveQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      }

      setView(targetView);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to open session.'
      );
    }
  };

  const handleSubmitAnswer = async (questionId: string, answerText: string) => {
    if (!activeSession) return;
    setSubmittingAnswer(true);
    setActionError(null);
    try {
      const updated = await api.submitAnswer(
        activeSession.session.id,
        questionId,
        answerText
      );
      setActiveSession(updated);
      const qIdx = updated.items.findIndex((i) => i.question.id === questionId);
      if (qIdx >= 0) {
        setActiveQuestionIndex(qIdx);
      }
      setView('feedback');
      await refreshWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to evaluate submitted answer.'
      );
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSkipQuestion = async (questionId: string) => {
    if (!activeSession) return;
    setActionError(null);
    try {
      const updated = await api.skipQuestion(
        activeSession.session.id,
        questionId
      );
      setActiveSession(updated);

      const currentIdx = updated.items.findIndex(
        (i) => i.question.id === questionId
      );
      if (currentIdx >= 0 && currentIdx < updated.items.length - 1) {
        setActiveQuestionIndex(currentIdx + 1);
      }
      await refreshWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to skip question.'
      );
    }
  };

  const handleRequestAnotherQuestion = async () => {
    if (!activeSession) return;
    setGeneratingNextQuestion(true);
    setActionError(null);
    try {
      const updated = await api.generateNextQuestion(
        activeSession.session.id
      );
      setActiveSession(updated);
      setActiveQuestionIndex(Math.max(0, updated.items.length - 1));
      await refreshWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to generate an additional question.'
      );
    } finally {
      setGeneratingNextQuestion(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    setCompletingSession(true);
    setActionError(null);
    try {
      const completed = await api.completeSession(activeSession.session.id);
      setActiveSession(completed);
      setView('results');
      await refreshWorkspaceData();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Failed to generate end-of-session summary.'
      );
    } finally {
      setCompletingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await api.deleteSession(sessionId);
    if (activeSession?.session.id === sessionId) {
      setActiveSession(null);
      setActiveQuestionIndex(0);
    }
    await refreshWorkspaceData();
  };

  const handleLaunchSuggestedSession = (preset: SuggestedPracticeSession) => {
    setSuggestedPreset(preset);
    setView('setup');
  };

  const handleSelectQuestionForFeedback = (index: number) => {
    setActiveQuestionIndex(index);
    setView('feedback');
  };

  const handleNavigate = (nextView: AppView) => {
    setActionError(null);
    setView(nextView);
  };

  if (view === 'landing') {
    return (
      <LandingPage
        onNavigate={handleNavigate}
        totalSessionsCount={dashboardData?.totalSessions ?? sessions.length}
      />
    );
  }

  return (
    <WorkspaceShell
      currentView={view}
      onNavigate={handleNavigate}
      theme={theme}
      onToggleTheme={handleToggleTheme}
      preferences={preferences}
      hasActiveSession={Boolean(activeSession)}
    >
      {view === 'dashboard' && (
        <DashboardPage
          data={dashboardData}
          loading={dashboardLoading}
          error={dashboardError}
          preferences={preferences}
          onRetry={refreshWorkspaceData}
          onNavigate={handleNavigate}
          onOpenSession={handleOpenSession}
        />
      )}

      {view === 'setup' && (
        <InterviewSetupPage
          preferences={preferences}
          suggestedPreset={suggestedPreset}
          creating={creatingSession}
          error={actionError}
          onClearError={() => setActionError(null)}
          onStartSession={handleStartSession}
        />
      )}

      {view === 'practice' && (
        <InterviewPracticePage
          sessionDetail={activeSession}
          activeQuestionIndex={activeQuestionIndex}
          onSelectQuestionIndex={setActiveQuestionIndex}
          submittingAnswer={submittingAnswer}
          generatingNextQuestion={generatingNextQuestion}
          completingSession={completingSession}
          error={actionError}
          onClearError={() => setActionError(null)}
          onSubmitAnswer={handleSubmitAnswer}
          onSkipQuestion={handleSkipQuestion}
          onRequestAnotherQuestion={handleRequestAnotherQuestion}
          onCompleteSession={handleCompleteSession}
          onNavigate={handleNavigate}
        />
      )}

      {view === 'feedback' && (
        <AnswerFeedbackPage
          sessionDetail={activeSession}
          activeQuestionIndex={activeQuestionIndex}
          onSelectQuestionIndex={setActiveQuestionIndex}
          completingSession={completingSession}
          onCompleteSession={handleCompleteSession}
          onNavigate={handleNavigate}
        />
      )}

      {view === 'results' && (
        <InterviewResultsPage
          sessionDetail={activeSession}
          completingSession={completingSession}
          onCompleteSession={handleCompleteSession}
          onSelectQuestionForFeedback={handleSelectQuestionForFeedback}
          onLaunchSuggestedSession={handleLaunchSuggestedSession}
          onNavigate={handleNavigate}
        />
      )}

      {view === 'history' && (
        <InterviewHistoryPage
          sessions={sessions}
          loading={sessionsLoading}
          onOpenSession={handleOpenSession}
          onDeleteSession={handleDeleteSession}
          onNavigate={handleNavigate}
        />
      )}

      {view === 'settings' && (
        <ProfileSettingsPage
          preferences={preferences}
          aiHealth={aiHealth}
          saving={savingPreferences}
          onToggleTheme={handleToggleTheme}
          onSavePreferences={handleSavePreferences}
        />
      )}
    </WorkspaceShell>
  );
}
