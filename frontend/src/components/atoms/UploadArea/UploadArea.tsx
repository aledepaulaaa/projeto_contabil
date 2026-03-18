import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setPreviewFile(file);
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewFile(file);
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!previewFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`relative group rounded-2xl border-2 border-dashed transition-all p-10 flex flex-col items-center justify-center gap-4 cursor-pointer
              ${dragActive 
                ? 'border-blue-500 bg-blue-500/10' 
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
              accept=".pdf,.png,.jpg,.jpeg"
            />
            
            <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>

            <div className="text-center">
              <p className="text-slate-200 font-medium font-display text-lg">
                Arraste seu arquivo ou <span className="text-blue-400">clique aqui</span>
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Suporta PDF, PNG e JPG (Máx. 10MB)
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 flex items-center justify-between border-blue-500/30 bg-blue-500/5"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-300">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white font-medium truncate max-w-[200px] md:max-w-md">{previewFile.name}</p>
                <p className="text-xs text-slate-400">
                  {(previewFile.size / 1024).toFixed(1)} KB • Preparado para upload
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isUploading ? (
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Upload className="w-4 h-4" />
                  </motion.div>
                  Enviando...
                </div>
              ) : (
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all border border-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
