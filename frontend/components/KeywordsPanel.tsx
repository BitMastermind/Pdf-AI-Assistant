'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTag, HiOutlineRefresh } from 'react-icons/hi';
import { useStore } from '@/lib/store';
import { getKeywords } from '@/lib/api';
import toast from 'react-hot-toast';

export default function KeywordsPanel() {
  const [numKeywords, setNumKeywords] = useState(15);
  
  const { 
    currentDocument, 
    keywords, 
    setKeywords, 
    isLoadingKeywords, 
    setIsLoadingKeywords 
  } = useStore();

  const handleExtractKeywords = async () => {
    if (!currentDocument) return;

    setIsLoadingKeywords(true);
    try {
      const result = await getKeywords(currentDocument.id, numKeywords);
      setKeywords(result);
      toast.success('Keywords extracted!');
    } catch (error) {
      toast.error('Failed to extract keywords');
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="p-4 rounded-2xl bg-white shadow-inner mb-4 inline-block">
            <HiOutlineTag className="w-12 h-12 text-accent-cyan" />
          </div>
          <h3 className="text-xl font-display font-semibold text-slate-900 mb-2">
            Keywords & Topics
          </h3>
          <p className="text-slate-500">Select a document to extract keywords</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
          <HiOutlineTag className="w-5 h-5 text-accent-cyan" />
          Keywords
        </h3>
        <p className="text-xs text-slate-500 mt-1 truncate">
          {currentDocument.filename}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {keywords.length === 0 && !isLoadingKeywords && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mb-6">
              <label className="block text-sm text-slate-600 mb-2">
                Number of Keywords
              </label>
              <div className="flex items-center justify-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={numKeywords}
                  onChange={(e) => setNumKeywords(Number(e.target.value))}
                  className="w-48 accent-accent-cyan"
                />
                <span className="text-slate-700 font-mono w-8">{numKeywords}</span>
              </div>
            </div>
            
            <button
              onClick={handleExtractKeywords}
              className="btn-primary inline-flex items-center gap-2"
            >
              <HiOutlineTag className="w-5 h-5" />
              Extract Keywords
            </button>
          </motion.div>
        )}

        {isLoadingKeywords && (
          <div className="flex flex-wrap gap-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-8 skeleton rounded-full"
                style={{ width: `${60 + Math.random() * 60}px` }}
              />
            ))}
          </div>
        )}

        {keywords.length > 0 && !isLoadingKeywords && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <motion.span
                  key={keyword}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="keyword-tag"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>

            <button
              onClick={handleExtractKeywords}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              Refresh Keywords
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

