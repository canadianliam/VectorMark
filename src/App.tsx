import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  Copy,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  PenTool,
} from 'lucide-react';
import { Annotation, ToolType, ImageMeta, Point } from './types/annotation';
import { UploadDropzone } from './components/UploadDropzone';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { CanvasViewport } from './components/CanvasViewport';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DeleteModal } from './components/DeleteModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  copyAnnotatedImageToClipboard,
  downloadAnnotatedImage,
} from './utils/exportImage';

export default function App() {
  const [imageMeta, setImageMeta] = useState<ImageMeta | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // History stack: array of annotation snapshots
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);

  // Active tool & drawing properties
  const [currentTool, setCurrentTool] = useState<ToolType>('rectangle');
  const [activeColor, setActiveColor] = useState<string>('#EF4444');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState<number>(4);
  const [activeOpacity, setActiveOpacity] = useState<number>(1.0);
  const [activeFillEnabled, setActiveFillEnabled] = useState<boolean>(false);
  const [activeFillOpacity, setActiveFillOpacity] = useState<number>(0.2);
  const [activeFontSize, setActiveFontSize] = useState<number>(24);

  // Zoom & pan
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });

  // Modals & toasts
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const imageRef = useRef<HTMLImageElement | null>(null);

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to push current annotations state onto undo stack
  const pushHistorySnapshot = useCallback(
    (current: Annotation[]) => {
      setUndoStack((prev) => [...prev.slice(-49), JSON.parse(JSON.stringify(current))]);
      setRedoStack([]); // Clear redo stack on new action
    },
    []
  );

  // Calculate default zoom to fit the viewport cleanly
  const fitToScreen = useCallback((meta: ImageMeta) => {
    const headerHeight = 64;
    const padding = 60;
    const availWidth = window.innerWidth - padding;
    const availHeight = window.innerHeight - headerHeight - padding - 70; // room for toolbars

    const scaleX = availWidth / meta.width;
    const scaleY = availHeight / meta.height;
    const optimalScale = Math.min(1.0, Math.max(0.2, Math.min(scaleX, scaleY)));

    setZoom(optimalScale);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const handleImageLoaded = (meta: ImageMeta) => {
    setImageMeta(meta);
    setAnnotations([]);
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
    fitToScreen(meta);
    addToast('success', 'Image loaded successfully');
  };

  // Undo action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(annotations))]);
    setUndoStack((prev) => prev.slice(0, -1));
    setAnnotations(previous);
    setSelectedId(null);
  }, [undoStack, annotations]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(annotations))]);
    setRedoStack((prev) => prev.slice(0, -1));
    setAnnotations(next);
    setSelectedId(null);
  }, [redoStack, annotations]);

  // Add new annotation
  const handleAddAnnotation = (ann: Annotation) => {
    pushHistorySnapshot(annotations);
    setAnnotations((prev) => [...prev, ann]);
    setSelectedId(ann.id);
  };

  // Update existing annotation
  const handleUpdateAnnotation = (updated: Annotation, commitToHistory: boolean = false) => {
    if (commitToHistory) {
      pushHistorySnapshot(annotations);
    }
    setAnnotations((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  // Delete specific annotation
  const handleDeleteAnnotation = useCallback(
    (id: string) => {
      pushHistorySnapshot(annotations);
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [annotations, selectedId, pushHistorySnapshot]
  );

  // Duplicate selected annotation
  const handleDuplicateSelected = () => {
    if (!selectedId) return;
    const item = annotations.find((a) => a.id === selectedId);
    if (!item) return;

    pushHistorySnapshot(annotations);
    const duplicated: Annotation = JSON.parse(JSON.stringify(item));
    duplicated.id = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Offset slightly so it's clearly visible
    const offset = 20;
    if (duplicated.type === 'rectangle') {
      duplicated.x += offset;
      duplicated.y += offset;
    } else if (duplicated.type === 'circle') {
      duplicated.cx += offset;
      duplicated.cy += offset;
    } else if (duplicated.type === 'line' || duplicated.type === 'arrow') {
      duplicated.x1 += offset;
      duplicated.y1 += offset;
      duplicated.x2 += offset;
      duplicated.y2 += offset;
    } else if (duplicated.type === 'text') {
      duplicated.x += offset;
      duplicated.y += offset;
    } else if (duplicated.type === 'highlighter') {
      duplicated.points = duplicated.points.map((p) => ({
        x: p.x + offset,
        y: p.y + offset,
      }));
    }

    setAnnotations((prev) => [...prev, duplicated]);
    setSelectedId(duplicated.id);
    addToast('info', 'Shape duplicated');
  };

  // Color modification: updates active default AND selected shape if present
  const handleChangeColor = (color: string) => {
    setActiveColor(color);
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.color !== color) {
        pushHistorySnapshot(annotations);
        const updated: Annotation = { ...selected, color };
        if (selected.fillColor && (selected.fillOpacity || 0) > 0) {
          updated.fillColor = color;
        }
        setAnnotations((prev) =>
          prev.map((a) => (a.id === selectedId ? updated : a))
        );
      }
    }
  };

  // Stroke width modification
  const handleChangeStrokeWidth = (width: number) => {
    setActiveStrokeWidth(width);
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.strokeWidth !== width) {
        pushHistorySnapshot(annotations);
        setAnnotations((prev) =>
          prev.map((a) => (a.id === selectedId ? { ...selected, strokeWidth: width } : a))
        );
      }
    }
  };

  // Opacity modification
  const handleChangeOpacity = (opacity: number) => {
    setActiveOpacity(opacity);
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.opacity !== opacity) {
        pushHistorySnapshot(annotations);
        setAnnotations((prev) =>
          prev.map((a) => (a.id === selectedId ? { ...selected, opacity } : a))
        );
      }
    }
  };

  // Fill toggle
  const handleChangeFillEnabled = (enabled: boolean) => {
    setActiveFillEnabled(enabled);
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && (selected.type === 'rectangle' || selected.type === 'circle')) {
        pushHistorySnapshot(annotations);
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === selectedId
              ? {
                  ...selected,
                  fillColor: enabled ? selected.color : undefined,
                  fillOpacity: enabled ? activeFillOpacity || 0.2 : 0,
                }
              : a
          )
        );
      }
    }
  };

  // Fill opacity modification
  const handleChangeFillOpacity = (opacity: number) => {
    setActiveFillOpacity(opacity);
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && (selected.type === 'rectangle' || selected.type === 'circle')) {
        pushHistorySnapshot(annotations);
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === selectedId
              ? {
                  ...selected,
                  fillOpacity: opacity,
                }
              : a
          )
        );
      }
    }
  };

  // Font size modification
  const handleChangeFontSize = (fontSize: number) => {
    setActiveFontSize(fontSize);
    if (selectedId) {
      const selected = annotations.find((a) => a.id === selectedId);
      if (selected && selected.type === 'text') {
        pushHistorySnapshot(annotations);
        setAnnotations((prev) =>
          prev.map((a) => (a.id === selectedId ? { ...selected, fontSize } : a))
        );
      }
    }
  };

  // Copy annotated image to clipboard
  const handleCopy = async () => {
    if (!imageRef.current || isExporting) return;
    setIsExporting(true);
    const result = await copyAnnotatedImageToClipboard(imageRef.current, annotations);
    setIsExporting(false);
    if (result.success) {
      addToast('success', result.message);
    } else {
      addToast('error', result.message);
    }
  };

  // Download annotated image as PNG
  const handleDownload = async () => {
    if (!imageRef.current || !imageMeta || isExporting) return;
    setIsExporting(true);
    try {
      await downloadAnnotatedImage(imageRef.current, annotations, imageMeta.name);
      addToast('success', 'Image downloaded successfully');
    } catch {
      addToast('error', 'Failed to generate download');
    } finally {
      setIsExporting(false);
    }
  };

  // Clear annotations
  const handleClearAnnotations = () => {
    if (annotations.length === 0) return;
    pushHistorySnapshot(annotations);
    setAnnotations([]);
    setSelectedId(null);
    addToast('info', 'All annotations cleared');
  };

  // Delete image & start over
  const handleDeleteImage = () => {
    setImageMeta(null);
    setAnnotations([]);
    setSelectedId(null);
    setUndoStack([]);
    setRedoStack([]);
    addToast('info', 'Workspace reset');
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(4.0, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.15, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => {
    if (imageMeta) fitToScreen(imageMeta);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Cmd+Z (without shift)
      if (cmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Cmd+Shift+Z or Cmd+Y
      if ((cmdOrCtrl && e.key.toLowerCase() === 'z' && e.shiftKey) || (cmdOrCtrl && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Copy: Cmd+C (when image is loaded)
      if (cmdOrCtrl && e.key.toLowerCase() === 'c' && imageMeta) {
        e.preventDefault();
        handleCopy();
        return;
      }

      // Save/Download: Cmd+S (when image is loaded)
      if (cmdOrCtrl && e.key.toLowerCase() === 's' && imageMeta) {
        e.preventDefault();
        handleDownload();
        return;
      }

      // Delete selected shape: Backspace or Delete
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedId) {
        e.preventDefault();
        handleDeleteAnnotation(selectedId);
        return;
      }

      // Deselect: Escape
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }

      // Zoom reset: 0
      if (e.key === '0' && imageMeta) {
        e.preventDefault();
        handleResetZoom();
        return;
      }

      // Zoom in: + or =
      if ((e.key === '+' || e.key === '=') && imageMeta) {
        e.preventDefault();
        handleZoomIn();
        return;
      }

      // Zoom out: -
      if (e.key === '-' && imageMeta) {
        e.preventDefault();
        handleZoomOut();
        return;
      }

      // Shortcuts modal toggle: ?
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Tool switching
      if (!cmdOrCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setCurrentTool('select');
            break;
          case 'r':
            setCurrentTool('rectangle');
            break;
          case 'c':
            setCurrentTool('circle');
            break;
          case 'a':
            setCurrentTool('arrow');
            break;
          case 'l':
            setCurrentTool('line');
            break;
          case 'h':
            setCurrentTool('highlighter');
            break;
          case 't':
            setCurrentTool('text');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    imageMeta,
    selectedId,
    handleDeleteAnnotation,
    handleCopy,
    handleDownload,
    handleResetZoom,
    handleZoomIn,
    handleZoomOut,
  ]);

  const selectedAnnotation = annotations.find((a) => a.id === selectedId) || null;

  return (
    <div className="flex flex-col w-screen h-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract (Zone 1: Wordmark & info — Zone 2: Navigation & Zoom — Zone 3: Actions) */}
      <header className="h-16 px-4 md:px-6 bg-[#0B0F17] border-b border-slate-800 flex items-center justify-between z-20 shrink-0 select-none">
        {/* Zone 1: Wordmark & Image metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
              <PenTool className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              VectorMark
            </span>
          </div>

          {imageMeta && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
              <span className="font-mono text-slate-300 tabular-nums">
                {imageMeta.width} × {imageMeta.height}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="truncate max-w-[140px] md:max-w-[200px]" title={imageMeta.name}>
                {imageMeta.name}
              </span>
            </div>
          )}
        </div>

        {/* Zone 2: History & Zoom controls (when image is loaded) */}
        {imageMeta && (
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Undo / Redo buttons */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                title="Undo (⌘Z)"
                className="w-8 h-8 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Redo (⌘⇧Z)"
                className="w-8 h-8 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom controls */}
            <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom Out (-)"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Fit to Screen (0)"
                className="px-2 h-7 rounded flex items-center justify-center font-mono text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom In (+)"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Fit"
                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
            className="w-9 h-9 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {imageMeta && (
            <>
              {/* Delete / Reset button */}
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                title="Clear Annotations or Delete Image"
                className="w-9 h-9 rounded-lg border border-rose-900/30 hover:border-rose-800/60 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Copy Image Button */}
              <button
                type="button"
                onClick={handleCopy}
                disabled={isExporting}
                title="Copy Image to Clipboard (⌘C)"
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>

              {/* Download PNG Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isExporting}
                title="Download PNG (⌘S)"
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-sm shadow-indigo-600/30 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="relative flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
        {!imageMeta ? (
          <UploadDropzone onImageLoaded={handleImageLoaded} />
        ) : (
          <div className="relative w-full h-full">
            {/* Interactive Canvas Viewport */}
            <CanvasViewport
              imageMeta={imageMeta}
              annotations={annotations}
              selectedId={selectedId}
              currentTool={currentTool}
              activeColor={activeColor}
              activeStrokeWidth={activeStrokeWidth}
              activeOpacity={activeOpacity}
              activeFillEnabled={activeFillEnabled}
              activeFillOpacity={activeFillOpacity}
              activeFontSize={activeFontSize}
              zoom={zoom}
              panOffset={panOffset}
              onSelectAnnotation={setSelectedId}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
              onPanChange={setPanOffset}
              imageRef={imageRef}
            />

            {/* Floating Toolbar & Properties Panel (Docked at top center or responsive) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[96vw] pointer-events-none">
              <div className="pointer-events-auto flex flex-col items-center gap-2">
                {/* Tool palette */}
                <Toolbar currentTool={currentTool} onSelectTool={setCurrentTool} />

                {/* Properties panel */}
                <PropertiesPanel
                  selectedAnnotation={selectedAnnotation}
                  activeColor={activeColor}
                  activeStrokeWidth={activeStrokeWidth}
                  activeOpacity={activeOpacity}
                  activeFillEnabled={activeFillEnabled}
                  activeFillOpacity={activeFillOpacity}
                  activeFontSize={activeFontSize}
                  currentTool={currentTool}
                  onChangeColor={handleChangeColor}
                  onChangeStrokeWidth={handleChangeStrokeWidth}
                  onChangeOpacity={handleChangeOpacity}
                  onChangeFillEnabled={handleChangeFillEnabled}
                  onChangeFillOpacity={handleChangeFillOpacity}
                  onChangeFontSize={handleChangeFontSize}
                  onDeleteSelected={() => selectedId && handleDeleteAnnotation(selectedId)}
                  onDuplicateSelected={handleDuplicateSelected}
                />
              </div>
            </div>

            {/* Bottom floating helper hint */}
            <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 pointer-events-none">
              <span>Drag to draw</span>
              <span className="text-slate-600">·</span>
              <span>Space + Drag to pan</span>
              <span className="text-slate-600">·</span>
              <span>Del to remove shape</span>
            </div>
          </div>
        )}
      </main>

      {/* Modals & Toasts */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onClearAnnotations={handleClearAnnotations}
        onDeleteImage={handleDeleteImage}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
