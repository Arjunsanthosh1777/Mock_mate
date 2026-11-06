import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import {
  DIFFICULTY_LEVELS,
  EXPERIENCE_LEVELS,
  INTERVIEW_TYPES,
  JOB_ROLES,
  type DifficultyLevel,
  type ExperienceLevel,
  type InterviewType,
  type JobRole,
  type SuggestedPracticeSession,
  type UserPreferences,
} from '../types/interview.ts';

interface InterviewSetupPageProps {
  preferences: UserPreferences | null;
  suggestedPreset: SuggestedPracticeSession | null;
  creating: boolean;
  error: string | null;
  onClearError: () => void;
  onStartSession: (config: {
    jobRole: JobRole;
    customRole: string;
    experienceLevel: ExperienceLevel;
    interviewType: InterviewType;
    difficulty: DifficultyLevel;
    questionCount: number;
    focusContext: string;
  }) => void;
}

const QUESTION_COUNTS = [3, 5, 7, 10];

export const InterviewSetupPage: React.FC<InterviewSetupPageProps> = ({
  preferences,
  suggestedPreset,
  creating,
  error,
  onClearError,
  onStartSession,
}) => {
  const [jobRole, setJobRole] = useState<JobRole>(
    suggestedPreset?.jobRole ??
      preferences?.defaultJobRole ??
      'Full Stack Developer'
  );
  const [customRole, setCustomRole] = useState<string>(
    suggestedPreset?.customRole ?? preferences?.customJobRole ?? ''
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    suggestedPreset?.experienceLevel ??
      preferences?.defaultExperience ??
      'Intermediate'
  );
  const [interviewType, setInterviewType] = useState<InterviewType>(
    suggestedPreset?.interviewType ??
      preferences?.defaultInterviewType ??
      'Technical'
  );
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    suggestedPreset?.difficulty ?? preferences?.defaultDifficulty ?? 'Medium'
  );
  const [questionCount, setQuestionCount] = useState<number>(
    preferences?.defaultQuestionCount ?? 5
  );
  const [focusContext, setFocusContext] = useState<string>(
    suggestedPreset?.rationale ?? preferences?.focusNotes ?? ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (suggestedPreset) {
      setJobRole(suggestedPreset.jobRole);
      setCustomRole(suggestedPreset.customRole || '');
      setExperienceLevel(suggestedPreset.experienceLevel);
      setInterviewType(suggestedPreset.interviewType);
      setDifficulty(suggestedPreset.difficulty);
      if (suggestedPreset.rationale) {
        setFocusContext(suggestedPreset.rationale);
      }
    }
  }, [suggestedPreset]);

  const effectiveRole =
    jobRole === 'Other'
      ? customRole.trim() || 'Custom Target Role'
      : jobRole;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    if (jobRole === 'Other' && !customRole.trim()) {
      setValidationError(
        'Please enter your custom job role title when "Other" is selected.'
      );
      return;
    }

    setValidationError(null);
    onStartSession({
      jobRole,
      customRole: jobRole === 'Other' ? customRole.trim() : '',
      experienceLevel,
      interviewType,
      difficulty,
      questionCount,
      focusContext: focusContext.trim(),
    });
  };

  const activeError = validationError || error;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Configure Interview Session
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Select your target role, experience tier, interview format, and
          difficulty to generate non-repetitive AI interview questions.
        </p>
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

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* Configuration Controls */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-8">
          {/* 1. Job Role */}
          <div>
            <label className="block font-display text-sm font-semibold text-slate-900 dark:text-white">
              01. Target Job Role
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose a standard discipline or select Other to specify a custom role
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {JOB_ROLES.map((role) => {
                const selected = jobRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={creating}
                    onClick={() => {
                      setJobRole(role);
                      setValidationError(null);
                    }}
                    className={`px-4 py-3 text-left text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? 'border-blue-700 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    {role === 'Other' ? 'Other (Custom Role)' : role}
                  </button>
                );
              })}
            </div>

            {jobRole === 'Other' && (
              <div className="mt-3">
                <label
                  htmlFor="custom-role-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Custom Role Title
                </label>
                <input
                  id="custom-role-input"
                  type="text"
                  value={customRole}
                  disabled={creating}
                  onChange={(e) => {
                    setCustomRole(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="e.g., Site Reliability Engineer, Product Manager, iOS Developer"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          {/* 2. Experience Level */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <label className="block font-display text-sm font-semibold text-slate-900 dark:text-white">
              02. Experience Level
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Calibrates question depth, architectural scope, and evaluation expectations
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              {EXPERIENCE_LEVELS.map((level) => {
                const selected = experienceLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    disabled={creating}
                    onClick={() => setExperienceLevel(level)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Interview Type */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <label className="block font-display text-sm font-semibold text-slate-900 dark:text-white">
              03. Interview Type
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Behavioral & HR rounds include structured STAR method analysis; Technical rounds evaluate reasoning
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
              {INTERVIEW_TYPES.map((type) => {
                const selected = interviewType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={creating}
                    onClick={() => setInterviewType(type)}
                    className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Difficulty & Question Count */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-display text-sm font-semibold text-slate-900 dark:text-white">
                04. Difficulty
              </label>
              <div className="mt-3 grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                {DIFFICULTY_LEVELS.map((diff) => {
                  const selected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      disabled={creating}
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 px-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selected
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-display text-sm font-semibold text-slate-900 dark:text-white">
                05. Questions in Session
              </label>
              <div className="mt-3 grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                {QUESTION_COUNTS.map((cnt) => {
                  const selected = questionCount === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      disabled={creating}
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 px-2 font-mono tabular-nums text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selected
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {cnt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Optional Focus Context */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <label
              htmlFor="focus-context-input"
              className="block font-display text-sm font-semibold text-slate-900 dark:text-white"
            >
              06. Focus Topics or Role Context (Optional)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Specify technologies, frameworks, or competencies you want emphasized
            </p>
            <textarea
              id="focus-context-input"
              rows={3}
              disabled={creating}
              value={focusContext}
              onChange={(e) => setFocusContext(e.target.value)}
              placeholder="e.g., React state concurrency, REST API error handling, SQL indexing, or cross-functional stakeholder alignment"
              className="mt-3 w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Summary & Launch Panel */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-[#0D1320] border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Session Blueprint
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review your calibrated interview parameters
            </p>
          </div>

          <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-sm border-t border-b border-slate-200 dark:border-slate-800">
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Role</dt>
              <dd className="font-medium text-slate-900 dark:text-white text-right">
                {effectiveRole}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Experience</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {experienceLevel}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Format</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {interviewType}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Difficulty</dt>
              <dd className="font-medium text-slate-900 dark:text-white">
                {difficulty}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">Questions</dt>
              <dd className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                {questionCount} prompts
              </dd>
            </div>
          </dl>

          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {interviewType === 'Behavioral' || interviewType === 'HR'
              ? 'Evaluation will include a dedicated STAR (Situation, Task, Action, Result) structural review alongside the six core rubric criteria.'
              : 'Evaluation will include technical accuracy and reasoning analysis alongside the six core rubric criteria.'}
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Generating Questions...</span>
              </>
            ) : (
              <>
                <span>Generate Questions & Start</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
