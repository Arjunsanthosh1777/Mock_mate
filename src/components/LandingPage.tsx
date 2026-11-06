import React, { useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Compass, Layers } from 'lucide-react';
import {
  EXPERIENCE_LEVELS,
  INTERVIEW_TYPES,
  JOB_ROLES,
} from '../types/interview.ts';
import { LandingTopBar, type AppView } from './Navbar.tsx';

const HERO_IMAGE_PATH =
  '/src/assets/images/hero_interview_studio_1793965414933.jpg';
const DESK_IMAGE_PATH =
  '/src/assets/images/practice_study_desk_1793965414909.jpg';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  totalSessionsCount: number;
}

const CAPABILITIES = [
  {
    index: '01.',
    title: 'Role & Seniority Question Calibration',
    description:
      'Generate non-repetitive interview prompts tailored to your exact role, experience tier from Fresher to Experienced, interview format, and difficulty level.',
    outcome: 'Eliminates generic question lists and repeated prompts within a session.',
  },
  {
    index: '02.',
    title: 'Focused Single-Question Practice Editor',
    description:
      'Draft responses in a distraction-free editor with live character and word counters, question navigation, skip controls, and on-demand alternative question generation.',
    outcome: 'Builds structured articulation under realistic interview pacing.',
  },
  {
    index: '03.',
    title: 'Six-Dimension Rubric & STAR Method Critique',
    description:
      'Receive structured AI evaluation across Relevance, Clarity, Completeness, Structure, Technical Accuracy, and Communication Quality—plus STAR breakdowns for behavioral rounds.',
    outcome: 'Surfaces exact missing points, weaknesses, and an example improved response.',
  },
  {
    index: '04.',
    title: 'Persistent Session Archive & Comparison',
    description:
      'Every session, question, submitted answer, and evaluation persists in SQLite so you can review transcripts, chart score trends, and compare sessions side by side.',
    outcome: 'Turns isolated mock runs into measurable preparation progress.',
  },
];

const RUBRIC_CRITERIA = [
  {
    name: '01. Relevance',
    detail:
      'Measures how directly your response addresses the prompt and interviewer intent without drifting off-topic.',
  },
  {
    name: '02. Clarity',
    detail:
      'Evaluates conciseness, precision of wording, and how easily an interviewer can follow your explanation.',
  },
  {
    name: '03. Completeness',
    detail:
      'Checks whether key concepts, edge cases, constraints, and expected interviewer signals were covered.',
  },
  {
    name: '04. Structure',
    detail:
      'Assesses logical flow—such as STAR framing (Situation, Task, Action, Result) for behavioral questions or layered architecture for technical prompts.',
  },
  {
    name: '05. Technical Accuracy',
    detail:
      'Verifies correctness of engineering concepts, complexity reasoning, data modeling, and practical trade-offs.',
  },
  {
    name: '06. Communication Quality',
    detail:
      'Evaluates professional tone, specificity of examples, and clarity of reasoning without unverified claims.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  totalSessionsCount,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [deskImgFailed, setDeskImgFailed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      <LandingTopBar onNavigate={onNavigate} />

      <main className="flex-1">
        {/* Section 1: Hero Split + 4-Column Benchmark Strip */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-3">
                Structured Interview Preparation Platform
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12] max-w-xl"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  textWrap: 'balance',
                }}
              >
                Practice interviews with structured AI critique
              </h1>
              <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                MOCKMATE generates non-repetitive technical, behavioral, and HR
                interview questions calibrated to your target role and seniority,
                then evaluates every answer across six rubric dimensions.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('setup')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Configure Interview Session</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onNavigate(totalSessionsCount > 0 ? 'dashboard' : 'history')
                  }
                  className="px-5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {totalSessionsCount > 0
                    ? `Open Dashboard (${totalSessionsCount} Saved)`
                    : 'Explore Workspace'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              {!heroImgFailed ? (
                <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-900">
                  <img
                    src={HERO_IMAGE_PATH}
                    alt="Quiet architectural interview preparation studio desk with natural daylight"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-72 sm:h-96 lg:h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full min-h-72 lg:min-h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-8 text-center">
                  <Compass className="w-10 h-10 text-blue-700 dark:text-blue-400 mb-3" />
                  <p className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    MOCKMATE Interview Studio
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Role-calibrated questions, STAR coaching, and persistent session analytics.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4-Column Benchmark Strip below Hero Split */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                06
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                Evaluation Dimensions
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Relevance, clarity, completeness, structure, accuracy, communication
              </div>
            </div>
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                08+
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                Specialized Role Tracks
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Frontend, Backend, Full Stack, Java, Python, Data, QA & Custom
              </div>
            </div>
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                STAR
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                Behavioral Framework
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Dedicated Situation, Task, Action, and Result breakdown
              </div>
            </div>
            <div className="p-6">
              <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                SQLite
              </div>
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                Persistent Session Store
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Full transcript review, score trends, and side-by-side comparison
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Numbered Capabilities + Documentary Desk Photography */}
        <section
          id="capabilities"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] py-16 lg:py-20"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                End-to-end preparation from setup to longitudinal review
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                Every workflow connects role calibration, focused writing, and
                transparent rubric feedback without generic filler.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-5 flex">
                {!deskImgFailed ? (
                  <div className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    <img
                      src={DESK_IMAGE_PATH}
                      alt="Structured preparation notes and laptop on a wooden study desk"
                      referrerPolicy="no-referrer"
                      onError={() => setDeskImgFailed(true)}
                      className="w-full h-72 sm:h-80 lg:h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full min-h-72 lg:min-h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                    <BookOpen className="w-9 h-9 text-blue-700 dark:text-blue-400 mb-3" />
                    <p className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                      Focused Practice Workspace
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 divide-y divide-slate-200 dark:divide-slate-800 border-t border-b border-slate-200 dark:border-slate-800">
                {CAPABILITIES.map((cap) => (
                  <div key={cap.index} className="py-6 first:pt-5 last:pb-5">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                        {cap.index}
                      </span>
                      <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        {cap.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {cap.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                      Outcome: {cap.outcome}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Six-Dimension Rubric Architecture */}
        <section id="rubric" className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Transparent six-dimension answer evaluation
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  Each submitted answer receives an itemized 1–10 breakdown,
                  specific strengths and missing points, and a tailored example
                  improved answer—framed strictly as coaching rather than an
                  objective hiring verdict.
                </p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] rounded-xl divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
              {RUBRIC_CRITERIA.map((item, idx) => (
                <div
                  key={item.name}
                  className={`p-6 ${
                    idx >= 3 ? 'md:border-t md:border-slate-200 dark:md:border-slate-800' : ''
                  }`}
                >
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Supported Tracks & Configuration Matrix */}
        <section
          id="tracks"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] py-16 lg:py-20"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5">
                <h2
                  className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
                  style={{ textWrap: 'balance' }}
                >
                  Calibrated across roles, experience tiers, and formats
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  Select from eight built-in engineering and analytical roles or
                  enter any custom target title. Combine experience level,
                  interview format, and difficulty to match upcoming rounds.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => onNavigate('setup')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Launch Session Builder</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-[#090D16]">
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Layers className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <span>Supported Job Roles</span>
                  </div>
                  <p className="mt-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {JOB_ROLES.map((r) =>
                      r === 'Other' ? 'Custom Target Role' : r
                    ).join(' · ')}
                  </p>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Experience Levels</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                      {EXPERIENCE_LEVELS.join(' · ')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>Interview Types</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                      {INTERVIEW_TYPES.join(' · ')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D16] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span className="font-display font-bold text-slate-900 dark:text-white">
              MOCKMATE
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>
              AI-assisted interview coaching for structured practice and self-assessment.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Setup
            </button>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              History
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Settings
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
