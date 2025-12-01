'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineDownload, HiOutlineRefresh } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import { useStore } from '@/lib/store';
import { getSummary, downloadSummary } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SummaryPanel() {
  const [summaryLength, setSummaryLength] = useState(500);
  
  const { 
    currentDocument, 
    summary, 
    setSummary, 
    isLoadingSummary, 
    setIsLoadingSummary 
  } = useStore();

  const handleGenerateSummary = async () => {
    if (!currentDocument) return;

    setIsLoadingSummary(true);
    try {
      const result = await getSummary(currentDocument.id, summaryLength);
      setSummary(result);
      toast.success('Summary generated!');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleDownload = async () => {
    if (!currentDocument || !summary) return;

    try {
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary_${currentDocument.filename.replace('.pdf', '')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Summary downloaded!');
    } catch (error) {
      toast.error('Failed to download summary');
    }
  };

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="p-4 rounded-2xl bg-white/5 mb-4 inline-block">
            <HiOutlineDocumentText className="w-12 h-12 text-accent-mint" />
          </div>
          <h3 className="text-xl font-display font-semibold text-white mb-2">
            Document Summary
          </h3>
          <p className="text-white/50">Select a document to generate a summary</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-white flex items-center gap-2">
              <HiOutlineDocumentText className="w-5 h-5 text-accent-mint" />
              Summary
            </h3>
            <p className="text-xs text-white/40 mt-1 truncate">
              {currentDocument.filename}
            </p>
          </div>
          
          {summary && (
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
              title="Download summary"
            >
              <HiOutlineDownload className="w-5 h-5 text-accent-mint" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!summary && !isLoadingSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mb-6">
              <label className="block text-sm text-white/60 mb-2">
                Summary Length (words)
              </label>
              <div className="flex items-center justify-center gap-4">
                <input
                  type="range"
                  min={200}
                  max={1000}
                  step={100}
                  value={summaryLength}
                  onChange={(e) => setSummaryLength(Number(e.target.value))}
                  className="w-48 accent-accent-mint"
                />
                <span className="text-white/80 font-mono w-16">{summaryLength}</span>
              </div>
            </div>
            
            <button
              onClick={handleGenerateSummary}
              className="btn-primary inline-flex items-center gap-2"
            >
              <HiOutlineDocumentText className="w-5 h-5" />
              Generate Summary
            </button>
          </motion.div>
        )}

        {isLoadingSummary && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-4 skeleton rounded"
                style={{ width: `${85 - i * 10}%` }}
              />
            ))}
          </div>
        )}

        {summary && !isLoadingSummary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="card">
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="text-white/80 leading-relaxed mb-4 last:mb-0">
                        {children}
                      </p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-display font-bold text-white mb-3">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-display font-semibold text-white mb-2">
                        {children}
                      </h2>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc ml-4 space-y-1 text-white/80">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => <li className="text-white/80">{children}</li>,
                  }}
                >
                  {summary}
                </ReactMarkdown>
              </div>
            </div>

            <button
              onClick={handleGenerateSummary}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              Regenerate
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

