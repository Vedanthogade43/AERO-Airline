import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'neutral' | 'success' | 'warning' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral'
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
          <Icon className="w-4 h-4 text-sky-600" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight tabular-nums">
          {value}
        </div>
        {badgeText && (
          <span className="text-[11px] font-mono text-slate-500">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};
