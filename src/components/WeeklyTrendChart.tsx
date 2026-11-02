import React from 'react';
import type { WeeklyPoint } from '../core/obsidianCore';

interface Props {
  points: WeeklyPoint[];
}

const W = 320;
const H = 190;
const PAD_L = 26;
const PAD_R = 10;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 140;

export const WeeklyTrendChart: React.FC<Props> = ({ points }) => {
  const n = points.length;
  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / Math.max(1, n - 1);
  const y = (v: number) => PLOT_BOTTOM - ((v - 0) / 10) * (PLOT_BOTTOM - PLOT_TOP);
  const maxUnits = Math.max(4, ...points.map((p) => p.units));
  const barH = (u: number) => (u / maxUnits) * 46;

  const buildPath = (key: 'sleep' | 'energy') => {
    let d = '';
    let pen = false;
    points.forEach((p, i) => {
      const v = p[key];
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Weekly sleep, energy and intake trend">
        <defs>
          <linearGradient id="barFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 2.5, 5, 7.5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD_L} x2={W - PAD_R} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-slate-500" strokeOpacity="0.18" strokeDasharray="3 4" />
            <text x={PAD_L - 6} y={y(v) + 3} textAnchor="end" fontSize="8" className="fill-current text-slate-400">
              {v === 2.5 || v === 7.5 ? '' : v}
            </text>
          </g>
        ))}

        {/* Intake bars */}
        {points.map((p, i) => {
          const h = barH(p.units);
          return (
            <rect key={p.date} x={x(i) - 8} y={PLOT_BOTTOM - h} width={16} height={h} rx={4} fill="url(#barFade)" />
          );
        })}

        {/* Lines */}
        <path d={buildPath('sleep')} fill="none" stroke="#818cf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={buildPath('energy')} fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <g key={p.date + 'dots'}>
            {p.sleep !== null && <circle cx={x(i)} cy={y(p.sleep)} r={3.2} fill="#818cf8" stroke="#fff" strokeWidth="1" />}
            {p.energy !== null && <circle cx={x(i)} cy={y(p.energy)} r={3.2} fill="#10b981" stroke="#fff" strokeWidth="1" />}
          </g>
        ))}

        {/* Day labels */}
        {points.map((p, i) => (
          <g key={p.date + 'lbl'}>
            <text
              x={x(i)}
              y={PLOT_BOTTOM + 16}
              textAnchor="middle"
              fontSize="9"
              fontWeight={p.isToday ? 700 : 500}
              className={`fill-current ${p.isToday ? 'text-emerald-400' : 'text-slate-400'}`}
            >
              {p.label}
            </text>
            <text x={x(i)} y={PLOT_BOTTOM + 28} textAnchor="middle" fontSize="8" className={`fill-current ${p.clean ? 'text-emerald-400' : 'text-rose-400'}`}>
              {p.clean ? 'clean' : `${Math.round(p.units)} u`}
            </text>
          </g>
        ))}
      </svg>

      <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 mt-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 rounded bg-indigo-400 inline-block" />Sleep</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 rounded bg-emerald-500 inline-block" />Energy</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500/50 inline-block" />Intake (cig-equivalent)</span>
      </div>
    </div>
  );
};
