import React from 'react';
import { AlertTriangle, Trash2, Eraser, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAnnotations: () => void;
  onDeleteImage: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onClearAnnotations,
  onDeleteImage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Reset Workspace</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="py-4 text-xs md:text-sm text-slate-300 leading-relaxed">
          Choose whether to remove the annotations while keeping your image, or completely delete
          the image and start over.
        </p>

        <div className="space-y-2.5 mb-5">
          <button
            onClick={() => {
              onClearAnnotations();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-700 group-hover:bg-indigo-600/30 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-colors">
              <Eraser className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Clear Annotations Only</div>
              <div className="text-[11px] text-slate-400">
                Removes all markup shapes (can be undone via ⌘Z)
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onDeleteImage();
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-900/60 flex items-center justify-center text-rose-300 group-hover:scale-105 transition-transform">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-200">Delete Image &amp; Start Over</div>
              <div className="text-[11px] text-rose-300/70">
                Removes the uploaded image and returns to home screen
              </div>
            </div>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
