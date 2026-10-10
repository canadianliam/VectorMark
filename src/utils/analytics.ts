declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Dispatches custom events to Google Analytics safely if gtag is available.
 */
export function trackEvent(
  eventName: string,
  parameters: Record<string, string | number | boolean> = {}
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, parameters);
  }
}

/**
 * Tracks image upload action
 */
export function trackImageUpload(method: 'drop' | 'file_input' | 'paste' | 'sample_preset', width?: number, height?: number) {
  trackEvent('image_upload', {
    upload_method: method,
    ...(width ? { image_width: width } : {}),
    ...(height ? { image_height: height } : {}),
  });
}

/**
 * Tracks copy to clipboard action
 */
export function trackImageCopy(shapeCount: number) {
  trackEvent('image_copy', {
    shape_count: shapeCount,
  });
}

/**
 * Tracks download PNG action
 */
export function trackImageDownload(shapeCount: number) {
  trackEvent('image_download', {
    shape_count: shapeCount,
  });
}
