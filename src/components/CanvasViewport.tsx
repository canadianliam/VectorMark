import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Annotation,
  ToolType,
  Point,
  ResizeHandle,
  TextAnnotation,
  ImageMeta,
} from '../types/annotation';
import {
  getBoundingBox,
  isPointInsideAnnotation,
  applyHandleResize,
} from '../utils/geometry';

interface CanvasViewportProps {
  imageMeta: ImageMeta;
  annotations: Annotation[];
  selectedId: string | null;
  currentTool: ToolType;
  activeColor: string;
  activeStrokeWidth: number;
  activeOpacity: number;
  activeFillEnabled: boolean;
  activeFillOpacity: number;
  activeFontSize: number;
  zoom: number;
  panOffset: Point;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (ann: Annotation) => void;
  onUpdateAnnotation: (ann: Annotation, commitToHistory?: boolean) => void;
  onDeleteAnnotation: (id: string) => void;
  onPanChange: (pan: Point) => void;
  imageRef: React.RefObject<HTMLImageElement | null>;
}

type DragMode =
  | { type: 'draw'; draft: Annotation }
  | { type: 'move'; annId: string; startAnn: Annotation; startPoint: Point }
  | { type: 'resize'; annId: string; handle: ResizeHandle; startAnn: Annotation; startPoint: Point }
  | { type: 'pan'; startClient: Point; startPan: Point }
  | null;

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  imageMeta,
  annotations,
  selectedId,
  currentTool,
  activeColor,
  activeStrokeWidth,
  activeOpacity,
  activeFillEnabled,
  activeFillOpacity,
  activeFontSize,
  zoom,
  panOffset,
  onSelectAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  onPanChange,
  imageRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Keyboard listener for Spacebar pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Convert client viewport coordinates to SVG image space
  const getSvgPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const pt = svgRef.current.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svgRef.current.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.max(0, Math.min(imageMeta.width, transformed.x)),
          y: Math.max(0, Math.min(imageMeta.height, transformed.y)),
        };
      }
      return { x: 0, y: 0 };
    },
    [imageMeta.width, imageMeta.height]
  );

  // Handle pointer down on the workspace
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // If middle click or spacebar is pressed, trigger canvas panning
    if (e.button === 1 || isSpacePressed) {
      e.preventDefault();
      setDragMode({
        type: 'pan',
        startClient: { x: e.clientX, y: e.clientY },
        startPan: { ...panOffset },
      });
      return;
    }

    if (e.button !== 0) return; // Only primary mouse button

    const svgPt = getSvgPoint(e.clientX, e.clientY);

    // If using the select tool, check if user clicked on existing shape or background
    if (currentTool === 'select') {
      // Find top-most annotation at this position
      let hit: Annotation | null = null;
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (isPointInsideAnnotation(svgPt, annotations[i])) {
          hit = annotations[i];
          break;
        }
      }

      if (hit) {
        onSelectAnnotation(hit.id);
        setDragMode({
          type: 'move',
          annId: hit.id,
          startAnn: JSON.parse(JSON.stringify(hit)),
          startPoint: svgPt,
        });
      } else {
        onSelectAnnotation(null);
      }
      return;
    }

    // Otherwise, starting a new shape with active drawing tool
    const id = `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const base = {
      id,
      color: activeColor,
      strokeWidth: activeStrokeWidth,
      opacity: activeOpacity,
      fillColor: activeFillEnabled ? activeColor : undefined,
      fillOpacity: activeFillEnabled ? activeFillOpacity : 0,
    };

    let newDraft: Annotation | null = null;

    switch (currentTool) {
      case 'rectangle':
        newDraft = {
          ...base,
          type: 'rectangle',
          x: svgPt.x,
          y: svgPt.y,
          width: 0,
          height: 0,
        };
        break;

      case 'circle':
        newDraft = {
          ...base,
          type: 'circle',
          cx: svgPt.x,
          cy: svgPt.y,
          rx: 0,
          ry: 0,
        };
        break;

      case 'line':
        newDraft = {
          ...base,
          type: 'line',
          x1: svgPt.x,
          y1: svgPt.y,
          x2: svgPt.x,
          y2: svgPt.y,
        };
        break;

      case 'arrow':
        newDraft = {
          ...base,
          type: 'arrow',
          x1: svgPt.x,
          y1: svgPt.y,
          x2: svgPt.x,
          y2: svgPt.y,
        };
        break;

      case 'highlighter':
        newDraft = {
          ...base,
          type: 'highlighter',
          points: [svgPt],
        };
        break;

      case 'text': {
        const textAnn: TextAnnotation = {
          ...base,
          type: 'text',
          x: svgPt.x,
          y: svgPt.y,
          text: 'Double click to edit',
          fontSize: activeFontSize,
        };
        onAddAnnotation(textAnn);
        onSelectAnnotation(textAnn.id);
        setEditingTextId(textAnn.id);
        setEditingTextValue('Double click to edit');
        return;
      }
    }

    if (newDraft) {
      setDragMode({
        type: 'draw',
        draft: newDraft,
      });
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }
  };

  // Pointer move
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragMode) return;

    if (dragMode.type === 'pan') {
      const dx = e.clientX - dragMode.startClient.x;
      const dy = e.clientY - dragMode.startClient.y;
      onPanChange({
        x: dragMode.startPan.x + dx,
        y: dragMode.startPan.y + dy,
      });
      return;
    }

    const currentPt = getSvgPoint(e.clientX, e.clientY);

    if (dragMode.type === 'draw') {
      const draft = { ...dragMode.draft };

      switch (draft.type) {
        case 'rectangle': {
          draft.width = currentPt.x - draft.x;
          draft.height = currentPt.y - draft.y;
          break;
        }
        case 'circle': {
          draft.rx = Math.abs(currentPt.x - draft.cx);
          draft.ry = Math.abs(currentPt.y - draft.cy);
          break;
        }
        case 'line':
        case 'arrow': {
          draft.x2 = currentPt.x;
          draft.y2 = currentPt.y;
          break;
        }
        case 'highlighter': {
          draft.points = [...draft.points, currentPt];
          break;
        }
      }

      setDragMode({ ...dragMode, draft });
    } else if (dragMode.type === 'move') {
      const deltaX = currentPt.x - dragMode.startPoint.x;
      const deltaY = currentPt.y - dragMode.startPoint.y;
      const start = dragMode.startAnn;

      let updated: Annotation = JSON.parse(JSON.stringify(start));

      if (start.type === 'rectangle' && updated.type === 'rectangle') {
        updated.x = start.x + deltaX;
        updated.y = start.y + deltaY;
      } else if (start.type === 'circle' && updated.type === 'circle') {
        updated.cx = start.cx + deltaX;
        updated.cy = start.cy + deltaY;
      } else if (
        (start.type === 'line' || start.type === 'arrow') &&
        (updated.type === 'line' || updated.type === 'arrow')
      ) {
        updated.x1 = start.x1 + deltaX;
        updated.y1 = start.y1 + deltaY;
        updated.x2 = start.x2 + deltaX;
        updated.y2 = start.y2 + deltaY;
      } else if (start.type === 'highlighter' && updated.type === 'highlighter') {
        updated.points = start.points.map((p: Point) => ({
          x: p.x + deltaX,
          y: p.y + deltaY,
        }));
      } else if (start.type === 'text' && updated.type === 'text') {
        updated.x = start.x + deltaX;
        updated.y = start.y + deltaY;
      }

      onUpdateAnnotation(updated, false);
    } else if (dragMode.type === 'resize') {
      const deltaX = currentPt.x - dragMode.startPoint.x;
      const deltaY = currentPt.y - dragMode.startPoint.y;
      const resized = applyHandleResize(dragMode.startAnn, dragMode.handle, deltaX, deltaY);
      onUpdateAnnotation(resized, false);
    }
  };

  // Pointer up
  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragMode) return;

    if (dragMode.type === 'draw') {
      const draft = dragMode.draft;
      let valid = false;

      // Filter out accidental micro-clicks
      if (draft.type === 'rectangle' && (Math.abs(draft.width) > 4 || Math.abs(draft.height) > 4)) {
        // Normalize negative width/height
        const norm: Annotation = {
          ...draft,
          x: Math.min(draft.x, draft.x + draft.width),
          y: Math.min(draft.y, draft.y + draft.height),
          width: Math.abs(draft.width),
          height: Math.abs(draft.height),
        };
        onAddAnnotation(norm);
        onSelectAnnotation(norm.id);
        valid = true;
      } else if (draft.type === 'circle' && (draft.rx > 3 || draft.ry > 3)) {
        onAddAnnotation(draft);
        onSelectAnnotation(draft.id);
        valid = true;
      } else if ((draft.type === 'line' || draft.type === 'arrow') && (Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 5)) {
        onAddAnnotation(draft);
        onSelectAnnotation(draft.id);
        valid = true;
      } else if (draft.type === 'highlighter' && draft.points.length > 2) {
        onAddAnnotation(draft);
        onSelectAnnotation(draft.id);
        valid = true;
      }

      if (!valid) {
        // If it was just a click with rectangle or circle, create a default nicely-proportioned shape
        if (draft.type === 'rectangle') {
          const defaultBox: Annotation = {
            ...draft,
            width: 140,
            height: 90,
          };
          onAddAnnotation(defaultBox);
          onSelectAnnotation(defaultBox.id);
        } else if (draft.type === 'circle') {
          const defaultCircle: Annotation = {
            ...draft,
            rx: 60,
            ry: 60,
          };
          onAddAnnotation(defaultCircle);
          onSelectAnnotation(defaultCircle.id);
        }
      }
    } else if (dragMode.type === 'move' || dragMode.type === 'resize') {
      // Commit final transformed shape to undo history
      const current = annotations.find((a) => a.id === dragMode.annId);
      if (current) {
        onUpdateAnnotation(current, true);
      }
    }

    setDragMode(null);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  // Start handle resizing
  const handleResizeStart = (
    e: React.PointerEvent,
    ann: Annotation,
    handle: ResizeHandle
  ) => {
    e.stopPropagation();
    const svgPt = getSvgPoint(e.clientX, e.clientY);
    setDragMode({
      type: 'resize',
      annId: ann.id,
      handle,
      startAnn: JSON.parse(JSON.stringify(ann)),
      startPoint: svgPt,
    });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const selectedAnn = annotations.find((a) => a.id === selectedId);

  // Render individual annotation element
  const renderAnnotation = (ann: Annotation, isDraft = false) => {
    const isSelected = selectedId === ann.id && !isDraft;
    const opacity = ann.opacity !== undefined ? ann.opacity : 1;

    switch (ann.type) {
      case 'rectangle': {
        const x = Math.min(ann.x, ann.x + ann.width);
        const y = Math.min(ann.y, ann.y + ann.height);
        const w = Math.abs(ann.width);
        const h = Math.abs(ann.height);

        return (
          <g key={ann.id} opacity={opacity}>
            {ann.fillColor && (ann.fillOpacity || 0) > 0 && (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={ann.fillColor}
                opacity={ann.fillOpacity}
              />
            )}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="none"
              stroke={ann.color}
              strokeWidth={ann.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={currentTool === 'select' ? 'cursor-move' : ''}
            />
          </g>
        );
      }

      case 'circle': {
        return (
          <g key={ann.id} opacity={opacity}>
            {ann.fillColor && (ann.fillOpacity || 0) > 0 && (
              <ellipse
                cx={ann.cx}
                cy={ann.cy}
                rx={Math.abs(ann.rx)}
                ry={Math.abs(ann.ry)}
                fill={ann.fillColor}
                opacity={ann.fillOpacity}
              />
            )}
            <ellipse
              cx={ann.cx}
              cy={ann.cy}
              rx={Math.abs(ann.rx)}
              ry={Math.abs(ann.ry)}
              fill="none"
              stroke={ann.color}
              strokeWidth={ann.strokeWidth}
              className={currentTool === 'select' ? 'cursor-move' : ''}
            />
          </g>
        );
      }

      case 'line': {
        return (
          <line
            key={ann.id}
            x1={ann.x1}
            y1={ann.y1}
            x2={ann.x2}
            y2={ann.y2}
            stroke={ann.color}
            strokeWidth={ann.strokeWidth}
            strokeLinecap="round"
            opacity={opacity}
            className={currentTool === 'select' ? 'cursor-move' : ''}
          />
        );
      }

      case 'arrow': {
        const markerId = `arrowhead-${ann.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
        return (
          <g key={ann.id} opacity={opacity}>
            <defs>
              <marker
                id={markerId}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto-start-reverse"
              >
                <polygon points="0 1, 8 4, 0 7" fill={ann.color} />
              </marker>
            </defs>
            <line
              x1={ann.x1}
              y1={ann.y1}
              x2={ann.x2}
              y2={ann.y2}
              stroke={ann.color}
              strokeWidth={ann.strokeWidth}
              strokeLinecap="round"
              markerEnd={`url(#${markerId})`}
              className={currentTool === 'select' ? 'cursor-move' : ''}
            />
          </g>
        );
      }

      case 'highlighter': {
        if (ann.points.length < 2) return null;
        const d = `M ${ann.points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
        return (
          <path
            key={ann.id}
            d={d}
            fill="none"
            stroke={ann.color}
            strokeWidth={ann.strokeWidth * 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity * 0.45}
            style={{ mixBlendMode: 'multiply' }}
            className={currentTool === 'select' ? 'cursor-move' : ''}
          />
        );
      }

      case 'text': {
        const isEditing = editingTextId === ann.id;
        if (isEditing) return null;

        return (
          <text
            key={ann.id}
            x={ann.x}
            y={ann.y}
            fill={ann.color}
            fontSize={ann.fontSize}
            fontWeight="600"
            fontFamily="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
            opacity={opacity}
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              userSelect: 'none',
            }}
            className={currentTool === 'select' ? 'cursor-move' : ''}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingTextId(ann.id);
              setEditingTextValue(ann.text);
            }}
          >
            {ann.text}
          </text>
        );
      }
    }
  };

  // Resize handle coordinates and render
  const renderHandles = (ann: Annotation) => {
    const handleStyle =
      'w-3.5 h-3.5 fill-white stroke-indigo-600 stroke-[2.5] hover:scale-125 transition-transform cursor-pointer drop-shadow-md';

    if (ann.type === 'rectangle' || ann.type === 'circle') {
      const box = getBoundingBox(ann);
      const handles: { id: ResizeHandle; x: number; y: number; cursor: string }[] = [
        { id: 'nw', x: box.minX, y: box.minY, cursor: 'nwse-resize' },
        { id: 'n', x: (box.minX + box.maxX) / 2, y: box.minY, cursor: 'ns-resize' },
        { id: 'ne', x: box.maxX, y: box.minY, cursor: 'nesw-resize' },
        { id: 'e', x: box.maxX, y: (box.minY + box.maxY) / 2, cursor: 'ew-resize' },
        { id: 'se', x: box.maxX, y: box.maxY, cursor: 'nwse-resize' },
        { id: 's', x: (box.minX + box.maxX) / 2, y: box.maxY, cursor: 'ns-resize' },
        { id: 'sw', x: box.minX, y: box.maxY, cursor: 'nesw-resize' },
        { id: 'w', x: box.minX, y: (box.minY + box.maxY) / 2, cursor: 'ew-resize' },
      ];

      return (
        <g key={`handles-${ann.id}`}>
          {/* Bounding box guide line */}
          <rect
            x={box.minX - 3}
            y={box.minY - 3}
            width={box.width + 6}
            height={box.height + 6}
            fill="none"
            stroke="#6366F1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            pointerEvents="none"
          />

          {/* Interactive anchor handles */}
          {handles.map((h) => (
            <rect
              key={h.id}
              x={h.x - 5}
              y={h.y - 5}
              width={10}
              height={10}
              rx={2}
              className={handleStyle}
              style={{ cursor: h.cursor }}
              onPointerDown={(e) => handleResizeStart(e, ann, h.id)}
            />
          ))}
        </g>
      );
    }

    if (ann.type === 'line' || ann.type === 'arrow') {
      return (
        <g key={`handles-${ann.id}`}>
          <circle
            cx={ann.x1}
            cy={ann.y1}
            r={6}
            className={handleStyle}
            style={{ cursor: 'crosshair' }}
            onPointerDown={(e) => handleResizeStart(e, ann, 'p1')}
          />
          <circle
            cx={ann.x2}
            cy={ann.y2}
            r={6}
            className={handleStyle}
            style={{ cursor: 'crosshair' }}
            onPointerDown={(e) => handleResizeStart(e, ann, 'p2')}
          />
        </g>
      );
    }

    if (ann.type === 'text' || ann.type === 'highlighter') {
      const box = getBoundingBox(ann);
      return (
        <rect
          key={`bbox-${ann.id}`}
          x={box.minX - 4}
          y={box.minY - 4}
          width={box.width + 8}
          height={box.height + 8}
          fill="none"
          stroke="#6366F1"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          pointerEvents="none"
        />
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${
        isSpacePressed ? 'cursor-grab' : currentTool === 'select' ? 'cursor-default' : 'cursor-crosshair'
      }`}
      style={{
        backgroundImage: `
          linear-gradient(45deg, #0e1422 25%, transparent 25%), 
          linear-gradient(-45deg, #0e1422 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #0e1422 75%), 
          linear-gradient(-45deg, transparent 75%, #0e1422 75%)
        `,
        backgroundSize: '24px 24px',
        backgroundColor: '#090d16',
        backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
      }}
    >
      {/* Zoomable & pannable container */}
      <div
        className="relative transition-transform duration-75 ease-out shadow-2xl rounded-sm ring-1 ring-slate-800"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          width: imageMeta.width,
          height: imageMeta.height,
        }}
      >
        {/* Base uploaded image */}
        <img
          ref={imageRef}
          src={imageMeta.src}
          alt={imageMeta.name}
          width={imageMeta.width}
          height={imageMeta.height}
          className="absolute inset-0 block select-none pointer-events-none rounded-none"
          draggable={false}
        />

        {/* Vector SVG markup layer */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${imageMeta.width} ${imageMeta.height}`}
          className="absolute inset-0 w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Render committed annotations */}
          {annotations.map((ann) => renderAnnotation(ann))}

          {/* Render in-progress draft */}
          {dragMode?.type === 'draw' && renderAnnotation(dragMode.draft, true)}

          {/* Render selection handles */}
          {selectedAnn && renderHandles(selectedAnn)}
        </svg>

        {/* Inline editable text input when editing a text annotation */}
        {editingTextId && (() => {
          const textAnn = annotations.find(
            (a): a is TextAnnotation => a.id === editingTextId && a.type === 'text'
          );
          if (!textAnn) return null;

          return (
            <div
              className="absolute z-30"
              style={{
                left: textAnn.x,
                top: Math.max(0, textAnn.y - textAnn.fontSize - 6),
              }}
            >
              <input
                type="text"
                autoFocus
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onUpdateAnnotation({ ...textAnn, text: editingTextValue }, true);
                    setEditingTextId(null);
                  } else if (e.key === 'Escape') {
                    setEditingTextId(null);
                  }
                }}
                onBlur={() => {
                  onUpdateAnnotation({ ...textAnn, text: editingTextValue }, true);
                  setEditingTextId(null);
                }}
                className="px-2 py-1 rounded bg-slate-900 text-white font-semibold border-2 border-indigo-500 shadow-xl outline-none"
                style={{
                  fontSize: `${textAnn.fontSize || 24}px`,
                  color: textAnn.color || activeColor,
                }}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
};
