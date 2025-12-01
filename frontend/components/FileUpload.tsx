'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineCloudUpload, HiOutlineDocumentText } from 'react-icons/hi';
import { useStore } from '@/lib/store';
import { uploadDocument } from '@/lib/api';
import toast from 'react-hot-toast';

export default function FileUpload() {
  const { isUploading, setIsUploading, addDocument, setCurrentDocument, resetDocumentState } = useStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    resetDocumentState();

    try {
      const doc = await uploadDocument(file);
      addDocument(doc);
      setCurrentDocument(doc);
      toast.success(`"${file.name}" uploaded successfully!`);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to upload document';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, addDocument, setCurrentDocument, resetDocumentState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden cursor-pointer
          border-2 border-dashed rounded-2xl p-12
          transition-all duration-300 ease-out
          ${isDragActive 
            ? 'border-accent-violet bg-accent-violet/10 scale-[1.02]' 
            : 'border-white/20 hover:border-accent-cyan/50 hover:bg-white/5'
          }
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-violet/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-cyan/20 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-accent-violet/30 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-t-accent-violet rounded-full animate-spin" />
                </div>
                <p className="text-lg font-medium text-white/80">Processing your document...</p>
                <p className="text-sm text-white/50">Extracting text and creating embeddings</p>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20"
                >
                  {isDragActive ? (
                    <HiOutlineDocumentText className="w-12 h-12 text-accent-cyan" />
                  ) : (
                    <HiOutlineCloudUpload className="w-12 h-12 text-accent-violet" />
                  )}
                </motion.div>

                <div className="text-center">
                  <p className="text-xl font-semibold text-white">
                    {isDragActive ? 'Drop your PDF here' : 'Upload a PDF Document'}
                  </p>
                  <p className="mt-2 text-sm text-white/50">
                    Drag & drop or click to browse • Max 10MB
                  </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
                  <span className="w-2 h-2 rounded-full bg-accent-mint animate-pulse" />
                  <span className="text-xs text-white/60">AI-powered analysis ready</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

