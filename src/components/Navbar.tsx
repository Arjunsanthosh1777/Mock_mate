import React, { useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CheckSquare,
  History,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Settings,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import type { ThemeMode, UserPreferences } from '../types/interview.ts';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'setup'
  | 'practice'
  | 'feedback'
  | 'results'
  | 'history'
  | 'settings';

const AVATAR_IMAGE_PATH =
  '/src/assets/images/candidate_profile_avatar_1793965414277.jpg';

interface LandingTopBarProps {
  onNavigate: (view: AppView) => void;
}

export const LandingTopBar: React.FC<LandingTopBarProps> = ({ onNavigate }) => {
  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element brand wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          MOCKMATE
        </button>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Primary landing navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#capabilities"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Capabilities
          </a>
          <a
            href="#rubric"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Evaluation Rubric
          </a>
          <a
            href="#tracks"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Role Tracks
          </a>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dashboard
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('setup')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Practicing
          </button>
        </div>
      </div>
    </header>
  );
};

interface WorkspaceShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  theme: ThemeMode;
  onToggleTheme: (theme: ThemeMode) => void;
  preferences: UserPreferences | null;
  hasActiveSession: boolean;
  children: React.ReactNode;
}

const VIEW_TITLES: Record<AppView, string> = {
  landing: 'Overview',
  dashboard: 'Dashboard',
  setup: 'Interview Setup',
  practice: 'Interview Practice',
  feedback: 'Answer Feedback',
  results: 'Interview Results',
  history: 'Interview History',
  settings: 'Profile & Settings',
};

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
  preferences,
  hasActiveSession,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const navItems: {
    id: AppView;
    label: string;
    icon: React.FC<{ className?: string }>;
    requiresSession?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'setup', label: 'Interview Setup', icon: SlidersHorizontal },
    {
      id: 'practice',
      label: 'Interview Practice',
      icon: BookOpenCheck,
      requiresSession: false,
    },
    {
      id: 'feedback',
      label: 'Answer Feedback',
      icon: CheckSquare,
      requiresSession: false,
    },
    {
      id: 'results',
      label: 'Interview Results',
      icon: BarChart3,
      requiresSession: false,
    },
    { id: 'history', label: 'Interview History', icon: History },
    { id: 'settings', label: 'Profile & Settings', icon: Settings },
  ];

  const handleSelectView = (view: AppView) => {
    setMobileOpen(false);
    onNavigate(view);
  };

  const candidateName = preferences?.candidateName || 'Alex Rivera';
  const targetHeadline = preferences?.targetHeadline || 'Software Engineer';
  const initials = candidateName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0D1320] border-r border-slate-200 dark:border-slate-800">
      {/* Sidebar Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => handleSelectView('landing')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          MOCKMATE
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Workspace Navigation */}
      <nav
        aria-label="Workspace navigation"
        className="flex-1 px-3 py-5 space-y-1 overflow-y-auto"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.id === 'practice' && hasActiveSession && (
                <span className="ml-auto text-[11px] font-mono text-blue-700 dark:text-blue-400">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Switcher & Candidate Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div
          role="group"
          aria-label="Color theme"
          className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg"
        >
          <button
            type="button"
            onClick={() => onToggleTheme('light')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleTheme('dark')}
            className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleSelectView('settings')}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
        >
          {!avatarFailed ? (
            <img
              src={AVATAR_IMAGE_PATH}
              alt={candidateName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-display text-xs font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {candidateName}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {targetHeadline}
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">{sidebarContent}</aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1320] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                MOCKMATE
              </button>
              <span
                className="text-slate-300 dark:text-slate-700"
                aria-hidden="true"
              >
                /
              </span>
              <span className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {VIEW_TITLES[currentView]}
              </span>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('setup')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>New Session</span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
