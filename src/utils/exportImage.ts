import { Annotation } from '../types/annotation';
import { getArrowheadPoints } from './geometry';

/**
 * Renders the image and all vector annotations onto an offscreen 2D canvas
 * at 100% original natural resolution.
 */
export async function renderToCanvas(
  image: HTMLImageElement,
  annotations: Annotation[]
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D canvas rendering context.');
  }

  // Draw the original image cleanly
  ctx.drawImage(image, 0, 0, width, height);

  // Draw each annotation in order
  for (const ann of annotations) {
    ctx.save();

    const opacity = ann.opacity !== undefined ? ann.opacity : 1;
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (ann.type) {
      case 'rectangle': {
        const x = Math.min(ann.x, ann.x + ann.width);
        const y = Math.min(ann.y, ann.y + ann.height);
        const w = Math.abs(ann.width);
        const h = Math.abs(ann.height);

        if (ann.fillColor && (ann.fillOpacity || 0) > 0) {
          ctx.save();
          ctx.globalAlpha = opacity * (ann.fillOpacity || 0.2);
          ctx.fillStyle = ann.fillColor;
          ctx.fillRect(x, y, w, h);
          ctx.restore();
        }

        ctx.strokeRect(x, y, w, h);
        break;
      }

      case 'circle': {
        const cx = ann.cx;
        const cy = ann.cy;
        const rx = Math.abs(ann.rx);
        const ry = Math.abs(ann.ry);

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

        if (ann.fillColor && (ann.fillOpacity || 0) > 0) {
          ctx.save();
          ctx.globalAlpha = opacity * (ann.fillOpacity || 0.2);
          ctx.fillStyle = ann.fillColor;
          ctx.fill();
          ctx.restore();
        }

        ctx.stroke();
        break;
      }

      case 'line': {
        ctx.beginPath();
        ctx.moveTo(ann.x1, ann.y1);
        ctx.lineTo(ann.x2, ann.y2);
        ctx.stroke();
        break;
      }

      case 'arrow': {
        // Line shaft
        ctx.beginPath();
        ctx.moveTo(ann.x1, ann.y1);
        ctx.lineTo(ann.x2, ann.y2);
        ctx.stroke();

        // Arrowhead
        const { tip, left, right } = getArrowheadPoints(
          ann.x1,
          ann.y1,
          ann.x2,
          ann.y2,
          ann.strokeWidth
        );

        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(left.x, left.y);
        ctx.lineTo(right.x, right.y);
        ctx.closePath();
        ctx.fillStyle = ann.color;
        ctx.fill();
        break;
      }

      case 'highlighter': {
        if (ann.points.length < 2) break;
        ctx.save();
        ctx.globalAlpha = opacity * 0.45;
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = ann.strokeWidth * 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'text': {
        if (!ann.text.trim()) break;
        ctx.font = `600 ${ann.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;
        ctx.fillStyle = ann.color;
        ctx.textBaseline = 'alphabetic';

        // Add subtle dark shadow for high contrast on busy image backgrounds
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(ann.text, ann.x, ann.y);
        break;
      }
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Converts canvas to high-quality PNG Blob.
 */
export function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image blob from canvas.'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Copies annotated image directly to system clipboard as image/png.
 */
export async function copyAnnotatedImageToClipboard(
  image: HTMLImageElement,
  annotations: Annotation[]
): Promise<{ success: boolean; message: string }> {
  try {
    const canvas = await renderToCanvas(image, annotations);
    const blob = await getCanvasBlob(canvas);

    if (navigator.clipboard && typeof navigator.clipboard.write === 'function') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return { success: true, message: 'Image copied to clipboard' };
    } else {
      throw new Error('Clipboard image writing is not supported by your browser.');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Clipboard copy failed';
    return { success: false, message: msg };
  }
}

/**
 * Downloads annotated image as PNG file at full resolution.
 */
export async function downloadAnnotatedImage(
  image: HTMLImageElement,
  annotations: Annotation[],
  originalName: string = 'markup'
): Promise<void> {
  const canvas = await renderToCanvas(image, annotations);
  const blob = await getCanvasBlob(canvas);
  const url = URL.createObjectURL(blob);

  const cleanName = originalName.replace(/\.[^/.]+$/, '');
  const link = document.createElement('a');
  link.download = `${cleanName || 'annotated'}-markup.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
