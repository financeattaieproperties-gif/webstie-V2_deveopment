import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { api } from '../api';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  purpose?: 'blueprint' | 'gallery';
}

// Convert base64 + mime → File object (used for Electron native dialog result)
function base64ToFile(b64: string, mimeType: string, fileName: string): File {
  const byteString = atob(b64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new File([ab], fileName, { type: mimeType });
}

/**
 * Automatically normalizes & compresses images in the browser before uploading so they:
 * 1. Stay safely below cPanel's default 2 MB PHP `upload_max_filesize` limit (< 1.45 MB)
 * 2. Keep dimensions within ≤ 2560 px (or ≤ 3200 px for blueprints) so `getimagesize` never rejects high-MP camera photos
 * 3. Convert unsupported browser formats (AVIF/HEIC/BMP/WebP-for-blueprints) into genuine JPEG/PNG
 */
async function optimizeImageForUpload(file: File, isBlueprint: boolean): Promise<File> {
  const maxSafeBytes = 1.45 * 1024 * 1024; // 1.45 MB (safely under default cPanel 2M limit)
  const maxDim = isBlueprint ? 3200 : 2400;
  const standardTypes = isBlueprint
    ? ['image/jpeg', 'image/png']
    : ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (file.type === 'image/gif' && file.size <= maxSafeBytes) {
    return file;
  }

  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      const needsResize = origW > maxDim || origH > maxDim || origW * origH > 12_000_000;
      const needsSizeReduction = file.size > maxSafeBytes;
      const needsFormatConversion = !standardTypes.includes(file.type);

      if (!needsResize && !needsSizeReduction && !needsFormatConversion) {
        resolve(file);
        return;
      }

      let targetW = origW;
      let targetH = origH;
      if (origW > maxDim || origH > maxDim) {
        const scale = Math.min(maxDim / origW, maxDim / origH);
        targetW = Math.max(1, Math.round(origW * scale));
        targetH = Math.max(1, Math.round(origH * scale));
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Fill white background when converting to JPEG so transparent areas don't turn black
      const keepPng = file.type === 'image/png' && !needsSizeReduction;
      const outputMime = keepPng ? 'image/png' : 'image/jpeg';
      if (outputMime === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'upload';
      const ext = outputMime === 'image/png' ? 'png' : 'jpg';

      const tryExport = (quality: number) => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size > maxSafeBytes && quality > 0.55 && outputMime === 'image/jpeg') {
              tryExport(Number((quality - 0.12).toFixed(2)));
              return;
            }
            resolve(new File([blob], `${baseName}.${ext}`, { type: outputMime }));
          },
          outputMime,
          outputMime === 'image/jpeg' ? quality : undefined
        );
      };

      tryExport(0.86);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export default function ImageUpload({ value, onChange, purpose }: Props) {
  const inputRef                  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState('');
  const [dragging, setDragging]   = useState(false);
  const isBlueprint               = purpose === 'blueprint';

  const upload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      setError('Only image files are allowed.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds 15 MB limit.');
      return;
    }
    setUploading(true);
    setError('');
    setProgress(10);
    let ticker: ReturnType<typeof setInterval> | null = null;
    try {
      const preparedFile = await optimizeImageForUpload(file, isBlueprint);
      setProgress(25);
      ticker = setInterval(() => setProgress(p => Math.min(p + 15, 88)), 300);
      const url = await api.uploadImage(preparedFile, purpose);
      clearInterval(ticker);
      setProgress(100);
      onChange(url);
      setTimeout(() => setProgress(0), 600);
    } catch (err) {
      if (ticker) clearInterval(ticker);
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }, [onChange, isBlueprint, purpose]);

  // Electron: use native file dialog
  const openNativeDialog = async () => {
    const result = await window.electronAPI!.openImageDialog();
    if (!result) return;
    const file = base64ToFile(result.fileBuffer, result.mimeType, result.fileName);
    upload(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const dropZone: React.CSSProperties = {
    border: `2px dashed ${dragging ? '#0F172A' : value ? '#10b981' : '#CBD5E1'}`,
    borderRadius: 10,
    background: dragging ? '#F1F5F9' : value ? '#F0FDF4' : '#F8FAFC',
    transition: 'all .2s',
    overflow: 'hidden',
  };

  const isElectron = !!window.electronAPI?.isElectron;

  return (
    <div
      style={dropZone}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {/* Preview */}
      {value && (
        <div style={{ position: 'relative' }}>
          <img
            src={value}
            alt="preview"
            style={{ width: '100%', maxHeight: 240, objectFit: isBlueprint ? 'contain' : 'cover', background: isBlueprint ? '#f8fafc' : undefined, display: 'block' }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none',
              borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            ✕ Remove
          </button>
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div style={{ height: 4, background: '#E2E8F0' }}>
          <div style={{ height: '100%', background: '#0F172A', width: `${progress}%`, transition: 'width .3s' }} />
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: '1.25rem', textAlign: 'center' }}>
        <input
          ref={inputRef}
          type="file"
          accept={isBlueprint ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp' : 'image/*'}
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        {uploading ? (
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>Optimizing & uploading… {progress}%</p>
        ) : (
          <>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '0.6rem' }}>
              {value ? 'Drag a new image to replace, or' : 'Drag & drop an image here, or'}
            </p>
            <button
              type="button"
              onClick={isElectron ? openNativeDialog : () => inputRef.current?.click()}
              style={{
                padding: '0.5rem 1.4rem', background: '#0F172A', color: '#FFFFFF',
                border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              }}
            >
              {isElectron
                ? (value ? 'Replace Image' : 'Browse Files')
                : (value ? 'Choose Different Image' : 'Browse Files')}
            </button>
            <p style={{ color: '#9CA3AF', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              {isBlueprint ? 'JPEG · PNG · WebP · auto-optimized (up to 15 MB)' : 'JPEG · PNG · WebP · GIF · auto-optimized (up to 15 MB)'}
            </p>
          </>
        )}

        {error && (
          <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
