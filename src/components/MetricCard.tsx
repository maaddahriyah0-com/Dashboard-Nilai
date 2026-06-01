import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext: string;
  colorClass: string; // e.g. "bg-blue-50 text-blue-600 border-blue-200"
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  colorClass
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold font-display text-slate-900 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          {subtext}
        </p>
      </div>
    </div>
  );
};
