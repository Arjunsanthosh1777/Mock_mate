import React, { useState } from 'react';
import type {
  DimensionScores,
  SessionListItem,
  TrendPoint,
} from '../types/interview.ts';

interface PracticeTrendChartProps {
  points: TrendPoint[];
  onSelectSession?: (sessionId: string) => void;
}

export const PracticeTrendChart: React.FC<PracticeTrendChartProps> = ({
  points,
  onSelectSession,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center px-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No rated sessions recorded yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Complete at least one evaluated question to chart your rating progression across practice sessions.
        </p>
      </div>
    );
  }

  const width = 620;
  const height = 220;
  const padLeft = 38;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 34;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const getX = (idx: number) => {
    if (points.length === 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (points.length - 1)) * plotWidth;
  };

  const getY = (rating: number) => {
    const clamped = Math.max(0, Math.min(10, rating));
    return padTop + plotHeight - (clamped / 10) * plotHeight;
  };

  const coords = points.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.averageRating),
    point: p,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(
          padTop + plotHeight
        ).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(
          padTop + plotHeight
        ).toFixed(1)} Z`
      : '';

  const activeIdx =
    hoveredIdx !== null && hoveredIdx < coords.length
      ? hoveredIdx
      : coords.length - 1;
  const activeItem = coords[activeIdx];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-slate-600 dark:text-slate-400">
        <div>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {activeItem.point.effectiveRole}
          </span>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <span>{activeItem.point.interviewType}</span>
          <span className="mx-1.5" aria-hidden="true">
            ·
          </span>
          <span className="tabular-nums">
            {activeItem.point.questionsAttempted}/
            {activeItem.point.questionsGenerated} answered
          </span>
        </div>
        <div className="font-mono tabular-nums font-semibold text-blue-700 dark:text-blue-400">
          Rating: {activeItem.point.averageRating.toFixed(1)} / 10
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 overflow-visible select-none"
        role="img"
        aria-label="Practice session average rating trend chart"
      >
        <defs>
          <linearGradient id="mockmateTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 2.5, 5, 7.5, 10].map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono tabular-nums"
              >
                {tick.toFixed(0)}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#mockmateTrendFill)" />}

        {coords.length > 1 && (
          <path
            d={linePath}
            fill="none"
            className="stroke-blue-600 dark:stroke-blue-400"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((c, idx) => {
          const isSelected = idx === activeIdx;
          return (
            <g
              key={c.point.sessionId}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onClick={() => onSelectSession?.(c.point.sessionId)}
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={14}
                fill="transparent"
              />
              <circle
                cx={c.x}
                cy={c.y}
                r={isSelected ? 5 : 3.5}
                className={
                  isSelected
                    ? 'fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-slate-900'
                    : 'fill-white dark:fill-slate-900 stroke-blue-600 dark:stroke-blue-400'
                }
                strokeWidth="2"
              />
              <text
                x={c.x}
                y={height - 10}
                textAnchor="middle"
                className={`text-[10px] font-mono tabular-nums ${
                  isSelected
                    ? 'fill-slate-900 dark:fill-slate-100 font-semibold'
                    : 'fill-slate-400 dark:fill-slate-500'
                }`}
              >
                S{idx + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface CompetencyBarChartProps {
  scores: DimensionScores;
}

const DIMENSION_LABELS: { key: keyof DimensionScores; label: string }[] = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'structure', label: 'Structure' },
  { key: 'technicalAccuracy', label: 'Technical Accuracy' },
  { key: 'communicationQuality', label: 'Communication' },
];

export const CompetencyBarChart: React.FC<CompetencyBarChartProps> = ({
  scores,
}) => {
  const hasAnyScore = Object.values(scores).some((v) => v > 0);

  if (!hasAnyScore) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center px-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No competency data yet
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Submit answers in an interview session to see your six-dimension rubric profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {DIMENSION_LABELS.map(({ key, label }) => {
        const val = scores[key] ?? 0;
        const pct = Math.max(0, Math.min(100, (val / 10) * 100));
        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {label}
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {val.toFixed(1)} / 10
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface SessionComparisonChartProps {
  sessions: SessionListItem[];
}

const COMPARE_COLORS = [
  'bg-blue-600 dark:bg-blue-500',
  'bg-slate-700 dark:bg-slate-400',
  'bg-amber-600 dark:bg-amber-500',
];

export const SessionComparisonChart: React.FC<SessionComparisonChartProps> = ({
  sessions,
}) => {
  if (sessions.length < 2) return null;

  const metrics: {
    label: string;
    getValue: (s: SessionListItem) => number;
  }[] = [
    { label: 'Overall Rating', getValue: (s) => s.statistics.averageRating },
    { label: 'Relevance', getValue: (s) => s.statistics.avgRelevance },
    { label: 'Clarity', getValue: (s) => s.statistics.avgClarity },
    { label: 'Completeness', getValue: (s) => s.statistics.avgCompleteness },
    { label: 'Structure', getValue: (s) => s.statistics.avgStructure },
    {
      label: 'Technical Accuracy',
      getValue: (s) => s.statistics.avgTechnicalAccuracy,
    },
    { label: 'Communication', getValue: (s) => s.statistics.avgCommunication },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-5 text-xs">
        {sessions.map((item, idx) => (
          <div key={item.session.id} className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-xs ${
                COMPARE_COLORS[idx % COMPARE_COLORS.length]
              }`}
            />
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {item.session.effectiveRole}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({item.session.interviewType} ·{' '}
              {new Date(item.session.createdAt).toLocaleDateString()})
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-2">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1.5">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {m.label}
            </div>
            <div className="space-y-1">
              {sessions.map((item, idx) => {
                const val = m.getValue(item);
                const pct = Math.max(0, Math.min(100, (val / 10) * 100));
                return (
                  <div
                    key={item.session.id}
                    className="flex items-center gap-3 text-xs"
                  >
                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          COMPARE_COLORS[idx % COMPARE_COLORS.length]
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {val.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
