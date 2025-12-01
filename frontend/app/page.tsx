'use client';

import { motion } from 'framer-motion';
import { HiOutlineSparkles, HiOutlineDocumentText } from 'react-icons/hi';
import FileUpload from '@/components/FileUpload';
import DocumentSidebar from '@/components/DocumentSidebar';
import TabPanel from '@/components/TabPanel';
import { useStore } from '@/lib/store';

export default function Home() {
  const { currentDocument } = useStore();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <DocumentSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="p-6 border-b border-white/10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan">
              <HiOutlineSparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text">
                PDF AI Assistant
              </h1>
              <p className="text-sm text-white/50">
                Upload, analyze, and learn from your documents
              </p>
            </div>
          </motion.div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-hidden">
          {!currentDocument ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full"
              >
                <FileUpload />
              </motion.div>

              {/* Features Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full"
              >
                {[
                  { icon: '💬', label: 'Ask Questions', desc: 'Chat with your PDF' },
                  { icon: '📝', label: 'Summarize', desc: 'Get key insights' },
                  { icon: '🏷️', label: 'Keywords', desc: 'Extract topics' },
                  { icon: '🎴', label: 'Flashcards', desc: 'Study smarter' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="card card-hover text-center"
                  >
                    <span className="text-3xl mb-2 block">{feature.icon}</span>
                    <h3 className="font-medium text-white text-sm">{feature.label}</h3>
                    <p className="text-xs text-white/40 mt-1">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col"
            >
              {/* Document Info Bar */}
              <div className="mb-4 flex items-center gap-3 px-4 py-3 glass rounded-xl">
                <div className="p-2 rounded-lg bg-accent-violet/20">
                  <HiOutlineDocumentText className="w-5 h-5 text-accent-violet" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {currentDocument.filename}
                  </p>
                  <p className="text-xs text-white/40">
                    {currentDocument.page_count} pages • {currentDocument.chunk_count} chunks processed
                  </p>
                </div>
                <FileUpload />
              </div>

              {/* Tab Panel */}
              <TabPanel />
            </motion.div>
          )}
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-violet/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-cyan/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-midnight-700/20 rounded-full blur-[200px]" />
      </div>
    </div>
  );
}

