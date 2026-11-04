import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { UploadCloud, FileText, FileSpreadsheet, FileImage, FileVideo, File, X, ArrowUp, ArrowDown, ImagePlus, Link2, Film } from 'lucide-react';
import { uploadFiles, assetUrl, errorMessage } from '../../../services/portalService';
import { IconButton, Spinner } from './AdminUI';
import { formatFileSize, inputClass } from './format';

const DOC_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp';
const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif';
const VIDEO_ACCEPT = '.mp4,.webm,.mov';

const fileIcon = (name = '', mime = '') => {
  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) return FileImage;
  if (mime.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return FileVideo;
  if (/\.(xlsx?)$/i.test(name)) return FileSpreadsheet;
  if (/\.(pdf|docx?)$/i.test(name)) return FileText;
  return File;
};

const useUpload = () => {
  const [progress, setProgress] = useState(null);
  const upload = async (files) => {
    if (!files?.length) return [];
    setProgress(0);
    try {
      return await uploadFiles(files, setProgress);
    } catch (error) {
      toast.error(errorMessage(error, 'Tải tệp thất bại'));
      return [];
    } finally {
      setProgress(null);
    }
  };
  return { upload, uploading: progress !== null, progress };
};

// Danh sách tệp đính kèm: value = [{ fileUrl, fileName, mimeType, size }]
export const AttachmentField = ({ value = [], onChange, accept = DOC_ACCEPT, hint = 'PDF, Word, Excel (tối đa 20MB) hoặc ảnh (tối đa 10MB)' }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { upload, uploading, progress } = useUpload();

  const addFiles = async (files) => {
    const uploaded = await upload(files);
    if (uploaded.length) onChange([...value, ...uploaded]);
  };

  const move = (index, delta) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  const rename = (index, fileName) => onChange(value.map((f, i) => (i === index ? { ...f, fileName } : f)));

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
          dragging ? 'border-gold bg-gold/5' : 'border-stone-300 hover:border-gold/60 hover:bg-stone-50'
        }`}
      >
        {uploading ? (
          <>
            <Spinner />
            <p className="mt-2 text-sm text-slate-600">Đang tải lên... {progress}%</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-6 w-6 text-slate-400" strokeWidth={1.6} />
            <p className="mt-1.5 text-sm text-slate-600">
              <span className="font-semibold text-navy-950">Chọn tệp</span> hoặc kéo thả vào đây
            </p>
            <p className="text-xs text-slate-400">{hint}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {value.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {value.map((file, i) => {
            const Icon = fileIcon(file.fileName, file.mimeType);
            return (
              <li key={`${file.fileUrl}-${i}`} className="flex items-center gap-2 px-3 py-2">
                <Icon className="h-5 w-5 shrink-0 text-gold-dark" strokeWidth={1.6} />
                <input
                  value={file.fileName}
                  onChange={(e) => rename(i, e.target.value)}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent !px-1.5 !py-1 text-sm text-navy-950 hover:border-stone-200 focus:border-gold focus:outline-none"
                  title="Sửa tên hiển thị"
                />
                <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{formatFileSize(file.size)}</span>
                <a href={assetUrl(file.fileUrl)} target="_blank" rel="noreferrer" className="shrink-0 px-1 text-xs font-medium text-gold-dark hover:underline">
                  Xem
                </a>
                <IconButton icon={ArrowUp} label="Lên" disabled={i === 0} onClick={() => move(i, -1)} />
                <IconButton icon={ArrowDown} label="Xuống" disabled={i === value.length - 1} onClick={() => move(i, 1)} />
                <IconButton icon={X} label="Bỏ tệp" tone="danger" onClick={() => onChange(value.filter((_, j) => j !== i))} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Ảnh đơn (thumbnail, avatar, banner): tải lên hoặc dán URL
export const ImageField = ({ value, onChange, aspect = 'aspect-video', className = '' }) => {
  const inputRef = useRef(null);
  const [showUrl, setShowUrl] = useState(false);
  const { upload, uploading, progress } = useUpload();

  const pick = async (files) => {
    const [uploaded] = await upload(files);
    if (uploaded) onChange(uploaded.fileUrl);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`group relative overflow-hidden rounded-lg border border-stone-200 bg-stone-50 ${aspect}`}>
        {value ? (
          <>
            <img src={assetUrl(value)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-navy-950/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => inputRef.current?.click()} className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-navy-950">
                Đổi ảnh
              </button>
              <button type="button" onClick={() => onChange('')} className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-600">
                Xoá
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 transition-colors hover:bg-stone-100 hover:text-slate-600"
          >
            {uploading ? <Spinner /> : <ImagePlus className="h-6 w-6" strokeWidth={1.6} />}
            <span className="text-xs font-medium">{uploading ? `Đang tải... ${progress}%` : 'Tải ảnh lên'}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
        />
      </div>
      {showUrl ? (
        <input
          className={inputClass}
          placeholder="https://..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <button type="button" onClick={() => setShowUrl(true)} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-navy-950">
          <Link2 className="h-3.5 w-3.5" /> Dùng đường dẫn ảnh
        </button>
      )}
    </div>
  );
};

const isYoutube = (url = '') => /youtube\.com|youtu\.be/i.test(url);

// Video đơn: tải tệp lên (lưu Cloudinary) hoặc dán đường dẫn YouTube / video
export const VideoField = ({ value, onChange, error }) => {
  const inputRef = useRef(null);
  const { upload, uploading, progress } = useUpload();

  const pick = async (files) => {
    const [uploaded] = await upload(files);
    if (uploaded) onChange(uploaded.fileUrl);
  };

  return (
    <div className="space-y-2">
      {value && !isYoutube(value) ? (
        <div className="group relative overflow-hidden rounded-lg border border-stone-200 bg-navy-950">
          <video src={assetUrl(value)} controls className="aspect-video w-full" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
          >
            Xoá
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-stone-300 px-4 py-5 text-slate-400 transition-colors hover:border-gold/60 hover:bg-stone-50 hover:text-slate-600"
        >
          {uploading ? <Spinner /> : <Film className="h-6 w-6" strokeWidth={1.6} />}
          <span className="text-xs font-medium">{uploading ? `Đang tải video... ${progress}%` : 'Tải video lên (MP4, WebM, MOV, tối đa 100MB)'}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={VIDEO_ACCEPT}
        className="hidden"
        onChange={(e) => { pick(e.target.files); e.target.value = ''; }}
      />
      <input
        className={inputClass}
        placeholder="Hoặc dán đường dẫn YouTube: https://www.youtube.com/watch?v=..."
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};
