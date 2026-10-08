import React, { useRef } from 'react';
import {
  Pipette,
  Trash2,
  Copy,
  Layers,
  Sliders,
} from 'lucide-react';
import { Annotation, ToolType } from '../types/annotation';

interface PropertiesPanelProps {
  selectedAnnotation: Annotation | null;
  activeColor: string;
  activeStrokeWidth: number;
  activeOpacity: number;
  activeFillEnabled: boolean;
  activeFillOpacity: number;
  activeFontSize: number;
  currentTool: ToolType;
  onChangeColor: (color: string) => void;
  onChangeStrokeWidth: (width: number) => void;
  onChangeOpacity: (opacity: number) => void;
  onChangeFillEnabled: (enabled: boolean) => void;
  onChangeFillOpacity: (opacity: number) => void;
  onChangeFontSize: (fontSize: number) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
}

const COLOR_PRESETS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#0F172A' },
];

const STROKE_PRESETS = [2, 4, 8, 12, 16];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedAnnotation,
  activeColor,
  activeStrokeWidth,
  activeOpacity,
  activeFillEnabled,
  activeFillOpacity,
  activeFontSize,
  currentTool,
  onChangeColor,
  onChangeStrokeWidth,
  onChangeOpacity,
  onChangeFillEnabled,
  onChangeFillOpacity,
  onChangeFontSize,
  onDeleteSelected,
  onDuplicateSelected,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  // If a shape is selected, show its properties; otherwise show global drawing defaults
  const currentColor = selectedAnnotation ? selectedAnnotation.color : activeColor;
  const currentStroke = selectedAnnotation ? selectedAnnotation.strokeWidth : activeStrokeWidth;
  const currentOpacity =
    selectedAnnotation && selectedAnnotation.opacity !== undefined
      ? selectedAnnotation.opacity
      : activeOpacity;

  const isShapeTypeWithFill =
    (selectedAnnotation &&
      (selectedAnnotation.type === 'rectangle' || selectedAnnotation.type === 'circle')) ||
    currentTool === 'rectangle' ||
    currentTool === 'circle';

  const isTextType =
    (selectedAnnotation && selectedAnnotation.type === 'text') || currentTool === 'text';

  const fillOpacityVal =
    selectedAnnotation && selectedAnnotation.fillOpacity !== undefined
      ? selectedAnnotation.fillOpacity
      : activeFillOpacity;

  const currentFontSizeVal =
    selectedAnnotation && selectedAnnotation.type === 'text'
      ? selectedAnnotation.fontSize
      : activeFontSize;

  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl shadow-black/40 text-xs text-slate-300">
      {/* Color picker & presets */}
      <div className="flex items-center gap-1.5 border-r border-slate-700/60 pr-3">
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            title="Choose custom color"
            className="w-7 h-7 rounded-lg border-2 border-slate-600 hover:border-slate-400 p-0.5 flex items-center justify-center transition-all cursor-pointer shadow-inner relative group"
            style={{ backgroundColor: currentColor }}
          >
            <Pipette className="w-3.5 h-3.5 text-white/80 drop-shadow group-hover:scale-110 transition-transform" />
          </button>
          <input
            ref={colorInputRef}
            type="color"
            value={currentColor}
            onChange={(e) => onChangeColor(e.target.value)}
            className="sr-only"
          />
        </div>

        {/* Quick swatch buttons */}
        <div className="flex items-center gap-1">
          {COLOR_PRESETS.map((p) => {
            const isSelected = currentColor.toLowerCase() === p.hex.toLowerCase();
            return (
              <button
                key={p.hex}
                type="button"
                onClick={() => onChangeColor(p.hex)}
                title={p.name}
                className={`w-5 h-5 rounded-md transition-transform cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900 scale-110'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: p.hex }}
              />
            );
          })}
        </div>
      </div>

      {/* Stroke width */}
      {!isTextType && (
        <div className="flex items-center gap-1.5 border-r border-slate-700/60 pr-3">
          <span className="text-[11px] font-medium text-slate-400">Stroke</span>
          <div className="flex items-center gap-1">
            {STROKE_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => onChangeStrokeWidth(w)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  currentStroke === w
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {w}px
              </button>
            ))}
          </div>

          <input
            type="range"
            min="1"
            max="24"
            value={currentStroke}
            onChange={(e) => onChangeStrokeWidth(Number(e.target.value))}
            className="w-14 accent-indigo-500 cursor-pointer hidden md:inline-block"
            title={`Stroke: ${currentStroke}px`}
          />
        </div>
      )}

      {/* Text font size */}
      {isTextType && (
        <div className="flex items-center gap-1.5 border-r border-slate-700/60 pr-3">
          <span className="text-[11px] font-medium text-slate-400">Size</span>
          <div className="flex items-center gap-1">
            {[16, 24, 32, 48].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChangeFontSize(s)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  currentFontSizeVal === s
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="12"
            max="72"
            value={currentFontSizeVal}
            onChange={(e) => onChangeFontSize(Number(e.target.value))}
            className="w-16 accent-indigo-500 cursor-pointer hidden md:inline-block"
            title={`Font size: ${currentFontSizeVal}px`}
          />
        </div>
      )}

      {/* Opacity slider */}
      <div className="flex items-center gap-1.5 border-r border-slate-700/60 pr-3">
        <Sliders className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-400">Opacity</span>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={currentOpacity}
          onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
          className="w-16 accent-indigo-500 cursor-pointer"
          title={`Opacity: ${Math.round(currentOpacity * 100)}%`}
        />
        <span className="text-[10px] font-mono text-slate-400 w-7">
          {Math.round(currentOpacity * 100)}%
        </span>
      </div>

      {/* Fill toggle for box and circle */}
      {isShapeTypeWithFill && (
        <div className="flex items-center gap-2 border-r border-slate-700/60 pr-3">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={
                selectedAnnotation
                  ? (selectedAnnotation.fillOpacity || 0) > 0
                  : activeFillEnabled
              }
              onChange={(e) => onChangeFillEnabled(e.target.checked)}
              className="rounded accent-indigo-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-300">Fill</span>
          </label>

          {(selectedAnnotation ? (selectedAnnotation.fillOpacity || 0) > 0 : activeFillEnabled) && (
            <input
              type="range"
              min="0.05"
              max="0.9"
              step="0.05"
              value={fillOpacityVal}
              onChange={(e) => onChangeFillOpacity(parseFloat(e.target.value))}
              className="w-14 accent-indigo-500 cursor-pointer"
              title={`Fill Opacity: ${Math.round(fillOpacityVal * 100)}%`}
            />
          )}
        </div>
      )}

      {/* Selected shape actions */}
      {selectedAnnotation && (
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onDuplicateSelected}
            title="Duplicate selected shape"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            title="Delete selected shape (Del / Backspace)"
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer text-[11px]"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
