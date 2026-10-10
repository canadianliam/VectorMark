import React, { useState, useEffect } from 'react';
import { UploadCloud, Clipboard, Image as ImageIcon, Sparkles, FileText, LayoutDashboard, Cpu } from 'lucide-react';
import { SAMPLE_IMAGES } from '../utils/sampleImages';
import { ImageMeta } from '../types/annotation';
import { trackImageUpload } from '../utils/analytics';

interface UploadDropzoneProps {
  onImageLoaded: (meta: ImageMeta) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onImageLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = (file: File, method: 'drop' | 'file_input' | 'paste') => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, etc.)');
      return;
    }
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        trackImageUpload(method, width, height);
        onImageLoaded({
          src,
          name: file.name,
          width,
          height,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Global clipboard paste listener for zero-friction paste anywhere on the page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file, 'paste');
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0], 'drop');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0], 'file_input');
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId);
    if (!sample) return;
    const dataUrl = sample.generateDataUrl();
    const img = new Image();
    img.onload = () => {
      trackImageUpload('sample_preset', img.naturalWidth, img.naturalHeight);
      onImageLoaded({
        src: dataUrl,
        name: `${sample.id}-sample.png`,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = dataUrl;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center p-4 md:p-8 bg-[#090D16]">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Hero header */}
        <div className="text-center mb-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>High-precision image annotation studio</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Mark images with shapes &amp; precision
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Upload, drag &amp; drop, or paste a screenshot. Add outline boxes, circles, arrows,
            lines, and text with real-time styling, high-res export, and clipboard copy.
          </p>
        </div>

        {/* Drop zone card */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full rounded-2xl border-2 border-dashed transition-all duration-200 p-8 md:p-12 flex flex-col items-center justify-center text-center cursor-pointer group ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-900/90'
          }`}
          onClick={() => document.getElementById('image-file-input')?.click()}
        >
          <input
            id="image-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />

          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-600/20 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
            Drop an image here, or browse files
          </h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Supports PNG, JPEG, WebP, SVG, and GIFs. You can also paste directly from your clipboard.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors shadow-sm inline-flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('image-file-input')?.click();
              }}
            >
              <ImageIcon className="w-4 h-4" />
              Choose Image File
            </button>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Press ⌘V / Ctrl+V to paste</span>
            </div>
          </div>

          {errorMessage && (
            <p className="mt-4 text-xs font-medium text-rose-400 bg-rose-950/50 px-3 py-1.5 rounded-md border border-rose-800/50">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Instant sample images */}
        <div className="w-full mt-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Or test immediately with a sample image
            </span>
            <span className="text-xs text-slate-500">Click any preset to load instantly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {SAMPLE_IMAGES.map((sample) => {
              const Icon =
                sample.id === 'dashboard'
                  ? LayoutDashboard
                  : sample.id === 'architecture'
                  ? Cpu
                  : FileText;

              return (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample.id)}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-left transition-all duration-150 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{sample.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
