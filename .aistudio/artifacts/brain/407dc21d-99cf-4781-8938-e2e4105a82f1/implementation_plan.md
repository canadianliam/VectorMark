# VectorMark — High-Precision Image Markup & Annotation Studio

A modern dark slate studio web application for annotating images with resizable outline boxes, circles, directional arrows, straight lines, highlighter strokes, and text labels. Features real-time color and stroke customization, clipboard paste & export, full undo/redo history stacks, mobile-responsive touch controls, and ergonomic keyboard shortcuts.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions have been finalized based on your requirements and clarification answers:

- **Confirmed Annotation Tools**: Boxes (rectangles), circles/ellipses, directional arrows, straight lines, highlighters, and text annotations.
- **Confirmed Workspace Theme**: Modern dark slate studio aesthetic (`#0F172A` / `#090D16` deep tones with crisp slate borders and focused indigo/violet accents).
- **Confirmed Customization Capabilities**: Full hex/RGB color picker with presets, variable stroke thickness (1px–24px), stroke opacity (0%–100%), and optional shape fill styling.
- **Image Resolution Fidelity**: Markup coordinates are recorded in normalized image coordinate space ($0..W_{\text{img}}, 0..H_{\text{img}}$) so all shapes render crisply regardless of screen zoom and export at full 100% native image resolution.
- **Clipboard & File Operations**: Native drag-and-drop, file picker, and direct clipboard `Cmd/Ctrl+V` pasting; one-click "Copy Image to Clipboard" (using standard `navigator.clipboard.write([ClipboardItem])` with PNG blob) and "Download PNG".

---

### 1. Overview & Core Concept

- **What It Does**: VectorMark provides an intuitive, zero-friction interface for annotating screenshots, mockups, diagrams, and photos. Users drop or paste an image, select a tool (box, circle, arrow, line, text, highlighter), and drag to place or click to modify. Every shape has intuitive interactive resize handles and inline color/stroke controls.
- **Target Audience / Persona**: Designers, software engineers, QA testers, product managers, and remote communicators who frequently capture screenshots, mark bugs or feedback with arrows and highlight boxes, and paste them directly into Slack, GitHub, Jira, or email.
- **Key Value**: Eliminates cumbersome desktop graphics programs in favor of a fast, browser-native canvas with instant keyboard shortcuts, precision geometry, and immediate clipboard-to-clipboard workflows.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Zero-State / Home Dropzone**:
   - Clean, spacious upload zone with visual drop targets, file browse button, clipboard paste indicator (`Press ⌘V / Ctrl+V`), and sample demo images for quick testing.
2. **Editor Workspace**:
   - **Top Bar**: Wordmark ("VectorMark"), filename/dimensions indicator, zoom level controls (`-`, `+`, `Fit`), Undo/Redo stack buttons with step counters, Delete Image button (with confirmation modal), Copy to Clipboard, and Download PNG action buttons.
   - **Floating / Fixed Tool Palette**: Tool selection for Select/Transform (`V`), Rectangle (`R`), Circle (`C`), Arrow (`A`), Line (`L`), Highlighter (`H`), and Text (`T`).
   - **Properties Bar / Inspector**: Active color swatch & hex picker, quick color presets (signal red, warning amber, vibrant cyan, neon lime, crisp white, deep black), stroke width slider (2px, 4px, 8px, 16px), fill opacity slider, and delete shape button (`Del` / `Backspace`).
   - **Canvas Viewport**: Centered image canvas with subtle checkerboard/slate backdrop, pan and zoom capabilities, vector overlay layer with interactive handles, bounding boxes, and drag-to-resize anchors.
   - **Delete Action**: Clear Annotations or Delete Entire Image with full reset back to upload state.

#### Visual Identity & Theme
- **Aesthetic Direction**: Modern Dark Slate Studio (inspired by CleanShot X, Linear, and Figma).
- **Color Palette**:
  - Neutral Canvas: Deep Obsidian Slate (`#0B0F17`)
  - Structural Panels: Elevated Slate Surface (`#151C2C`), hairline borders (`#27334D`)
  - Accent / Primary Action: High-intent Indigo/Cobalt (`#4F46E5` / `#6366F1`)
  - Status & Signals: Emerald (`#10B981`) for clipboard copied toast, Rose (`#EF4444`) for destructive actions.
- **Typography**: `Plus Jakarta Sans` for clean, professional studio UI typography; `JetBrains Mono` / `tabular-nums` for dimensions, coordinates, and zoom percentages.
- **Responsive Adaptations**:
  - Desktop: Full floating horizontal toolbar, top action bar, persistent properties panel.
  - Mobile & Tablet: Compact bottom floating tool drawer, collapsible styling sheet, touch-friendly $\ge 44\text{px}$ handle hitboxes, pinch-to-zoom prevention on UI with smooth single-finger canvas markup.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Hybrid SVG Over Canvas for Interactive Editing
- *Chosen Approach*: Render the uploaded image onto a canvas viewport with a crisp SVG overlay for active annotations, selection rings, and resize anchor handles; then render offscreen to a 2D Canvas context at native image resolution for PNG download and clipboard copying.
- *Why*: SVG gives crisp vector scaling at any zoom level, native DOM pointer event handling on individual shapes and handles, smooth cursor changes (`nwse-resize`, `nesw-resize`, `move`), and zero hit-test lag.
- *Alternatives Considered*: Pure Canvas 2D manual math requires complex custom click-detection, hit test algorithms for rotated lines/arrows, and manual cursor handling. Pure SVG has export hurdles that offscreen Canvas solves seamlessly.

#### Decision 2: History Stack Command Pattern (Undo / Redo)
- *Chosen Approach*: Immutable state snapshots of the `Annotation[]` array pushed onto an `undoStack` and `redoStack`.
- *Why*: Provides robust time travel for all actions: shape creation, shape movement, resize completion, color change, stroke thickness adjustment, deletion, and bulk clear. Keyboard shortcuts (`Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y`) tie directly into the stack.
- *Capacity*: 50 historical states with fast cloning.

#### Decision 3: Clipboard API & High-Res PNG Synthesis
- *Chosen Approach*: When copying or saving:
  1. Create an offscreen HTMLCanvasElement matching the native `naturalWidth` and `naturalHeight` of the source image.
  2. Draw the underlying raster image at 1:1 scale.
  3. Replay each annotation (scaled from image coordinates) onto the 2D canvas context with anti-aliased paths, crisp arrowheads, and high-DPI text metrics.
  4. Convert to Blob via `canvas.toBlob('image/png')`.
  5. Pass to `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])` with graceful fallback (e.g., immediate download or notification if browser permissions restrict clipboard writing).

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VectorMark Studio Shell                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Top Bar: Brand, Undo/Redo,     │ Actions: Delete, Copy PNG, Save PNG   │
│ Zoom controls, Dimensions      │ Keyboard Shortcuts Guide (?)          │
├────────────────────────────────┴───────────────────────────────────────┤
│ Workspace Viewport                                                     │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │  Floating Tool Selector: [ Select | Box | Circle | Arrow | Line |  │ │
│ │                            Highlighter | Text ]                     │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │  Properties Bar: [ Color Picker | Presets | Stroke | Opacity ]      │ │
│ ├────────────────────────────────────────────────────────────────────┤ │
│ │  Interactive Canvas Viewport (Pannable / Scaled)                   │ │
│ │  ┌──────────────────────────────────────────────────────────────┐  │ │
│ │  │ <img> Base Layer (Native Aspect Ratio & Natural Resolution)  │  │ │
│ │  │ <svg> Vector Overlay (Shapes, Text, Handles, Bounding Boxes) │  │ │
│ │  └──────────────────────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Offscreen Exporter Engine: Canvas 2D -> 1:1 PNG Blob -> Clipboard/Disk │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model
```typescript
export type ToolType = 'select' | 'rectangle' | 'circle' | 'arrow' | 'line' | 'highlighter' | 'text';

export interface BaseAnnotation {
  id: string;
  type: ToolType;
  color: string;          // Hex color e.g. #EF4444
  strokeWidth: number;    // 1 to 24 px
  opacity: number;        // 0.1 to 1.0
  fillColor?: string;     // Optional fill for closed shapes
  fillOpacity?: number;   // 0.0 to 1.0
}

export interface BoxAnnotation extends BaseAnnotation {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line' | 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HighlighterAnnotation extends BaseAnnotation {
  type: 'highlighter';
  points: { x: number; y: number }[];
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type Annotation = BoxAnnotation | CircleAnnotation | LineAnnotation | HighlighterAnnotation | TextAnnotation;
```

#### Keyboard Shortcuts Matrix
- `V`: Select / Move tool
- `R`: Rectangle tool
- `C`: Circle tool
- `A`: Arrow tool
- `L`: Line tool
- `H`: Highlighter tool
- `T`: Text tool
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + C`: Copy annotated image to clipboard (when canvas active)
- `Ctrl/Cmd + S`: Save annotated image as PNG
- `Delete` / `Backspace`: Delete selected shape
- `Escape`: Deselect shape or cancel active drawing
- `0` / `Ctrl/Cmd + 0`: Reset zoom to fit
- `?`: Toggle keyboard shortcuts cheatsheet modal
