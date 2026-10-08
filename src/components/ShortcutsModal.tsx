import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const SHORTCUT_GROUPS: { category: string; items: ShortcutItem[] }[] = [
  {
    category: 'Annotation Tools',
    items: [
      { keys: ['V'], description: 'Select & Move tool' },
      { keys: ['R'], description: 'Outline Box tool' },
      { keys: ['C'], description: 'Circle tool' },
      { keys: ['A'], description: 'Arrow tool' },
      { keys: ['L'], description: 'Straight Line tool' },
      { keys: ['H'], description: 'Highlighter tool' },
      { keys: ['T'], description: 'Text Label tool' },
    ],
  },
  {
    category: 'History & Editing',
    items: [
      { keys: ['⌘ / Ctrl', 'Z'], description: 'Undo last change' },
      { keys: ['⌘ / Ctrl', 'Shift', 'Z'], description: 'Redo change' },
      { keys: ['Del / Backspace'], description: 'Delete selected shape' },
      { keys: ['Escape'], description: 'Deselect active shape' },
    ],
  },
  {
    category: 'Canvas & Export',
    items: [
      { keys: ['⌘ / Ctrl', 'C'], description: 'Copy annotated image to clipboard' },
      { keys: ['⌘ / Ctrl', 'S'], description: 'Download annotated PNG' },
      { keys: ['Space + Drag'], description: 'Pan canvas workspace' },
      { keys: ['0'], description: 'Reset zoom to fit screen' },
      { keys: ['?'], description: 'Toggle keyboard shortcuts guide' },
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-400">Master the studio with faster navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                {group.category}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800/40 text-xs"
                  >
                    <span className="text-slate-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
