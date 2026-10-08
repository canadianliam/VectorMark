export type ToolType =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'line'
  | 'highlighter'
  | 'text';

export type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'p1'
  | 'p2';

export interface Point {
  x: number;
  y: number;
}

export interface BaseAnnotation {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  opacity: number;
  fillColor?: string;
  fillOpacity?: number;
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
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HighlighterAnnotation extends BaseAnnotation {
  type: 'highlighter';
  points: Point[];
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

export type Annotation =
  | BoxAnnotation
  | CircleAnnotation
  | LineAnnotation
  | ArrowAnnotation
  | HighlighterAnnotation
  | TextAnnotation;

export interface ImageMeta {
  src: string;
  name: string;
  width: number;
  height: number;
}
