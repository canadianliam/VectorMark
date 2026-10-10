# Google Analytics Integration — VectorMark

Integration of the official Google Analytics 4 tracking snippet (`G-FBMJW3JNSQ`) into the site's `<head>` tag, along with real-time interaction event telemetry for key user actions (image uploads, clipboard copying, PNG downloads, and page views).

### User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters and behaviors have been confirmed:

- **Google Tag ID**: `G-FBMJW3JNSQ`
- **Head Tag Placement**: Inserted into `<head>` in `index.html` as the first third-party script, executing asynchronously with standard configuration.
- **Custom Event Tracking**: Track key user milestones:
  - `image_upload`: Dispatched when an image is uploaded, dropped, or loaded from clipboard / sample presets.
  - `image_copy`: Dispatched when user clicks "Copy" to clipboard.
  - `image_download`: Dispatched when user downloads the high-res annotated PNG.
- **Standalone Build Sync**: Both the root `index.html` and compiled standalone production bundles (`dist/index.html` and `docs/index.html`) will include the Google Analytics tag and event dispatcher.

---

### 1. Overview & Core Concept

- **What It Does**: Provides website traffic and user engagement insights in Google Analytics. In addition to automatic pageviews, custom events capture the full user lifecycle (uploading images, using markup tools, copying to clipboard, and downloading final files).
- **Graceful Fallbacks**: Analytics calls are wrapped in a safe helper (`src/utils/analytics.ts`) that checks if `window.gtag` is available before sending, preventing any runtime errors if an ad-blocker or offline environment blocks `googletagmanager.com`.

---

### 2. User Experience & Architecture

```
┌────────────────────────────────────────────────────────┐
│                      index.html                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ <head>                                             │ │
│ │   <script async src="gtag/js?id=G-FBMJW3JNSQ">     │ │
│ │   <script> gtag('config', 'G-FBMJW3JNSQ'); </script> │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ Application Telemetry Bridge (src/utils/analytics.ts)  │
│ ┌──────────────────┬─────────────────┬───────────────┐ │
│ │ trackUpload()    │ trackCopy()     │ trackDownload │ │
│ └──────────────────┴─────────────────┴───────────────┘ │
├────────────────────────────────────────────────────────┤
│ UI Handlers in App.tsx & UploadDropzone.tsx            │
│ ┌──────────────────┬─────────────────┬───────────────┐ │
│ │ onImageLoaded    │ handleCopy      │ handleDownload│ │
│ └──────────────────┴─────────────────┴───────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

### 3. Implementation Steps

1. **HTML Head Injection**:
   - Add the Google tag (`gtag.js`) and initialization scripts into `/index.html` inside `<head>`.
2. **Analytics Utility Module (`src/utils/analytics.ts`)**:
   - Declare TypeScript `Window.gtag` and `Window.dataLayer` types.
   - Implement `trackEvent(eventName, params)`.
   - Implement `trackImageUpload(method, width, height)`.
   - Implement `trackImageCopy(shapeCount)`.
   - Implement `trackImageDownload(shapeCount)`.
3. **App Instrumentation**:
   - Call `trackImageUpload` when an image is loaded in `UploadDropzone.tsx`.
   - Call `trackImageCopy` on successful clipboard export in `App.tsx`.
   - Call `trackImageDownload` on file save in `App.tsx`.
4. **Build & Production Verification**:
   - Run `npm run build` so `dist/index.html` and `docs/index.html` reflect the Google tag and single-file bundle.
   - Run `lint_applet` and `compile_applet` to verify clean compilation.
