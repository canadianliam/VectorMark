import React from 'react';
import {
  MousePointer,
  Square,
  Circle as CircleIcon,
  ArrowUpRight,
  Minus,
  Highlighter,
  Type,
} from 'lucide-react';
import { ToolType } from '../types/annotation';

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolItem {
  id: ToolType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

const TOOLS: ToolItem[] = [
  { id: 'select', label: 'Select / Move', icon: MousePointer, shortcut: 'V' },
  { id: 'rectangle', label: 'Outline Box', icon: Square, shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: CircleIcon, shortcut: 'C' },
  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight, shortcut: 'A' },
  { id: 'line', label: 'Straight Line', icon: Minus, shortcut: 'L' },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter, shortcut: 'H' },
  { id: 'text', label: 'Text Label', icon: Type, shortcut: 'T' },
];

export const Toolbar: React.FC<ToolbarProps> = ({ currentTool, onSelectTool }) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl shadow-black/40">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const isActive = currentTool === t.id;

        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            title={`${t.label} (${t.shortcut})`}
            className={`relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg transition-all duration-150 group cursor-pointer ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Icon className="w-4 h-4 md:w-4.5 md:h-4.5" />

            {/* Desktop tooltip */}
            <span className="hidden md:group-hover:flex absolute -top-9 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-200 whitespace-nowrap shadow-md pointer-events-none items-center gap-1 z-50">
              <span>{t.label}</span>
              <kbd className="px-1 rounded bg-slate-700 text-[9px] font-mono text-slate-300">
                {t.shortcut}
              </kbd>
            </span>
          </button>
        );
      })}
    </div>
  );
};
