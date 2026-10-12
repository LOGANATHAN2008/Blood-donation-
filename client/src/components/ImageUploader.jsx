import { useRef, useState } from 'react';
import { Upload, X, Image, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

// Compress image in browser using canvas
async function compressImage(file, maxBytes = 300000) {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth, h = img.naturalHeight;
      // Scale down if too large
      const MAX_DIM = 1200;
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = Math.min(MAX_DIM / w, MAX_DIM / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryCompress = () => {
        canvas.toBlob((blob) => {
          if (blob.size <= maxBytes || quality <= 0.3) return resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          quality -= 0.1;
          tryCompress();
        }, 'image/jpeg', quality);
      };
      tryCompress();
    };
    img.src = url;
  });
}

export default function ImageUploader({ onChange, value }) {
  const fileRef     = useRef();
  const [preview, setPreview]   = useState(value?.url || null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB).'); return; }

    setUploading(true);
    setProgress(0);

    try {
      // Get signed upload params from server
      const { data: sigData } = await api.post('/uploads/sign');

      // Compress to < 300KB
      const compressed = await compressImage(file, 300000);

      // Build form data for direct Cloudinary upload
      const form = new FormData();
      form.append('file',             compressed);
      form.append('api_key',          sigData.api_key);
      form.append('timestamp',        sigData.timestamp);
      form.append('signature',        sigData.signature);
      form.append('folder',           sigData.folder);
      form.append('allowed_formats',  sigData.allowed_formats);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sigData.cloud_name}/image/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };

      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          setPreview(result.secure_url);
          onChange({ url: result.secure_url, publicId: result.public_id });
          toast.success('Image uploaded!');
        } else {
          toast.error('Upload failed.');
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        toast.error('Upload failed. Check your connection.');
      };

      xhr.send(form);
    } catch (err) {
      setUploading(false);
      toast.error(err.message);
    }
  };

  const clear = () => {
    setPreview(null);
    setProgress(0);
    onChange(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-1">
            <CheckCircle size={14} />
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors
            ${uploading ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10'}`}
          role="button"
          aria-label="Upload image"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <Image className="text-gray-400" size={32} strokeWidth={1.5} />
          <p className="text-sm text-gray-500">
            {uploading ? `Uploading… ${progress}%` : 'Click or drag & drop image here'}
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, WebP • Max 5MB</p>
        </div>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 brand-gradient rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
