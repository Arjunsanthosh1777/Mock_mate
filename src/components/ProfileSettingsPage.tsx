import React, { useEffect, useState } from 'react';
import { Check, Loader2, Moon, Sun } from 'lucide-react';
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
  type ThemeMode,
  type UserPreferences,
} from '../types/interview.ts';

const AVATAR_IMAGE_PATH =
  '/src/assets/images/candidate_profile_avatar_1793965414277.jpg';

interface ProfileSettingsPageProps {
  preferences: UserPreferences | null;
  aiHealth: AIHealthStatus | null;
  saving: boolean;
  onToggleTheme: (theme: ThemeMode) => void;
  onSavePreferences: (
    data: Partial<Omit<UserPreferences, 'id' | 'updatedAt'>>
  ) => Promise<void>;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  preferences,
  aiHealth,
  saving,
  onToggleTheme,
  onSavePreferences,
}) => {
  const [candidateName, setCandidateName] = useState(
    preferences?.candidateName ?? 'Alex Rivera'
  );
  const [targetHeadline, setTargetHeadline] = useState(
    preferences?.targetHeadline ?? 'Software Engineer'
  );
  const [defaultJobRole, setDefaultJobRole] = useState<JobRole>(
    preferences?.defaultJobRole ?? 'Full Stack Developer'
  );
  const [customJobRole, setCustomJobRole] = useState(
    preferences?.customJobRole ?? ''
  );
  const [defaultExperience, setDefaultExperience] = useState<ExperienceLevel>(
    preferences?.defaultExperience ?? 'Intermediate'
  );
  const [defaultInterviewType, setDefaultInterviewType] =
    useState<InterviewType>(preferences?.defaultInterviewType ?? 'Technical');
  const [defaultDifficulty, setDefaultDifficulty] = useState<DifficultyLevel>(
    preferences?.defaultDifficulty ?? 'Medium'
  );
  const [defaultQuestionCount, setDefaultQuestionCount] = useState<number>(
    preferences?.defaultQuestionCount ?? 5
  );
  const [preferredGeminiModel, setPreferredGeminiModel] =
    useState<FreeGeminiModel>(
      preferences?.preferredGeminiModel ?? 'gemini-3.1-flash-lite'
    );
  const [theme, setTheme] = useState<ThemeMode>(preferences?.theme ?? 'light');
  const [focusNotes, setFocusNotes] = useState(preferences?.focusNotes ?? '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (preferences) {
      setCandidateName(preferences.candidateName);
      setTargetHeadline(preferences.targetHeadline);
      setDefaultJobRole(preferences.defaultJobRole);
      setCustomJobRole(preferences.customJobRole);
      setDefaultExperience(preferences.defaultExperience);
      setDefaultInterviewType(preferences.defaultInterviewType);
      setDefaultDifficulty(preferences.defaultDifficulty);
      setDefaultQuestionCount(preferences.defaultQuestionCount);
      setPreferredGeminiModel(
        preferences.preferredGeminiModel ?? 'gemini-3.1-flash-lite'
      );
      setTheme(preferences.theme);
      setFocusNotes(preferences.focusNotes);
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(false);
    await onSavePreferences({
      candidateName: candidateName.trim() || 'Alex Rivera',
      targetHeadline: targetHeadline.trim() || 'Software Engineer',
      defaultJobRole,
      customJobRole: defaultJobRole === 'Other' ? customJobRole.trim() : '',
      defaultExperience,
      defaultInterviewType,
      defaultDifficulty,
      defaultQuestionCount,
      preferredGeminiModel,
      theme,
      focusNotes: focusNotes.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const initials = candidateName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Candidate Profile & Preferences
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Customize your default interview configuration, study focus notes, and
          workspace appearance. All preferences persist in SQLite.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-6">
          {/* Candidate Identity */}
          <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            {!avatarFailed ? (
              <img
                src={AVATAR_IMAGE_PATH}
                alt={candidateName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-display text-lg font-bold flex items-center justify-center shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                {candidateName || 'Candidate Profile'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {targetHeadline || 'Software Engineer'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="candidate-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Candidate Name
              </label>
              <input
                id="candidate-name"
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="target-headline"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Target Professional Title
              </label>
              <input
                id="target-headline"
                type="text"
                required
                value={targetHeadline}
                onChange={(e) => setTargetHeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Default Session Configuration */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
            <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Default Interview Setup Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="default-role"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Default Job Role
                </label>
                <select
                  id="default-role"
                  value={defaultJobRole}
                  onChange={(e) => setDefaultJobRole(e.target.value as JobRole)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {JOB_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === 'Other' ? 'Other (Custom Role)' : r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="default-experience"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Default Experience Level
                </label>
                <select
                  id="default-experience"
                  value={defaultExperience}
                  onChange={(e) =>
                    setDefaultExperience(e.target.value as ExperienceLevel)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              {defaultJobRole === 'Other' && (
                <div className="sm:col-span-2">
                  <label
                    htmlFor="default-custom-role"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Default Custom Role Title
                  </label>
                  <input
                    id="default-custom-role"
                    type="text"
                    value={customJobRole}
                    onChange={(e) => setCustomJobRole(e.target.value)}
                    placeholder="e.g., Cloud Architect"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="default-type"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Default Interview Type
                </label>
                <select
                  id="default-type"
                  value={defaultInterviewType}
                  onChange={(e) =>
                    setDefaultInterviewType(e.target.value as InterviewType)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="default-difficulty"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Default Difficulty
                </label>
                <select
                  id="default-difficulty"
                  value={defaultDifficulty}
                  onChange={(e) =>
                    setDefaultDifficulty(e.target.value as DifficultyLevel)
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="default-question-count"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default Question Count per Session
              </label>
              <select
                id="default-question-count"
                value={defaultQuestionCount}
                onChange={(e) =>
                  setDefaultQuestionCount(Number(e.target.value))
                }
                className="w-full sm:w-48 px-3.5 py-2.5 font-mono tabular-nums text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {[3, 5, 7, 10].map((c) => (
                  <option key={c} value={c}>
                    {c} questions
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="default-focus-notes"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Default Focus Context & Study Goals
              </label>
              <textarea
                id="default-focus-notes"
                rows={3}
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder="Topics or technologies to pre-fill when creating new sessions..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Preferences...</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>

            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Check className="w-4 h-4" />
                <span>Preferences saved to SQLite</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Theme & Server AI Configuration Overview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Appearance Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select light or dark interface mode
            </p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  onToggleTheme('light');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  onToggleTheme('dark');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Backend AI Service
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {aiHealth
                ? aiHealth.message
                : 'Checking server AI configuration...'}
            </p>
            <div>
              <label
                htmlFor="free-gemini-model"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Preferred Free Gemini Model
              </label>
              <select
                id="free-gemini-model"
                value={preferredGeminiModel}
                onChange={(e) =>
                  setPreferredGeminiModel(e.target.value as FreeGeminiModel)
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {FREE_GEMINI_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model === 'gemini-3.1-flash-lite'
                      ? 'gemini-3.1-flash-lite (Free Tier — Fast)'
                      : 'gemini-3.8-flash (Free Tier — Balanced Reasoning)'}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                Click Save Preferences to apply. Both models run on the Gemini
                free tier via the backend server with automatic fallback.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              All AI question generation and answer evaluation requests run
              exclusively through backend Express routes using server environment
              variables.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
