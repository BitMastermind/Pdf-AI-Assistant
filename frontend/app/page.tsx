'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiOutlineSparkles, 
  HiOutlineDocumentText,
  HiOutlineTag,
  HiOutlineLightBulb,
  HiOutlinePencil
} from 'react-icons/hi';
import FileUpload from '@/components/FileUpload';
import DocumentSidebar from '@/components/DocumentSidebar';
import TabPanel from '@/components/TabPanel';
import { useStore } from '@/lib/store';

const formatFileSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const quickActions = [
  {
    id: 'chat',
    title: 'Dialogue Mode',
    description: 'Ask clarifying questions in real-time',
    icon: HiOutlineSparkles,
    accent: 'from-accent-violet/30 to-accent-violet/10'
  },
  {
    id: 'summary',
    title: 'Get Summary',
    description: 'Capture the big picture instantly',
    icon: HiOutlineDocumentText,
    accent: 'from-accent-mint/30 to-accent-mint/10'
  },
  {
    id: 'keywords',
    title: 'Spot Keywords',
    description: 'Surface the essential terms',
    icon: HiOutlineTag,
    accent: 'from-accent-cyan/30 to-accent-cyan/10'
  },
  {
    id: 'flashcards',
    title: 'Study Mode',
    description: 'Turn insights into flashcards',
    icon: HiOutlineLightBulb,
    accent: 'from-accent-gold/30 to-accent-gold/10'
  },
  {
    id: 'notes',
    title: 'Annotate',
    description: 'Capture takeaways as notes',
    icon: HiOutlinePencil,
    accent: 'from-accent-coral/30 to-accent-coral/10'
  }
] as const;

export default function Home() {
  const { currentDocument } = useStore();
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    setActiveTab('chat');
  }, [currentDocument?.id]);

  const documentStats = useMemo(() => {
    if (!currentDocument) return [];

    return [
      {
        label: 'Pages',
        value: currentDocument.page_count,
        detail: 'Total pages detected'
      },
      {
        label: 'Chunks',
        value: currentDocument.chunk_count,
        detail: 'Indexed sections'
      },
      {
        label: 'File Size',
        value: formatFileSize(currentDocument.file_size),
        detail: 'Original upload size'
      }
    ];
  }, [currentDocument]);

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
              <h1 className="text-2xl font-display font-bold text-slate-900">
                PDF AI Assistant
              </h1>
              <p className="text-sm text-slate-500">
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
                    <h3 className="font-medium text-slate-900 text-sm">{feature.label}</h3>
                    <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col gap-4"
            >
              {/* Document Info Bar */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl">
                  <div className="p-2 rounded-lg bg-accent-violet/10 flex-shrink-0">
                    <HiOutlineDocumentText className="w-5 h-5 text-accent-violet" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {currentDocument.filename}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {currentDocument.page_count} pages • {currentDocument.chunk_count} chunks processed
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <FileUpload />
                  </div>
                </div>

                {/* Document Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {documentStats.map((stat) => (
                    <div key={stat.label} className="glass rounded-xl border border-slate-100 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-semibold text-slate-900 mt-1">{stat.value}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{stat.detail}</p>
                    </div>
                  ))}
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => setActiveTab(action.id)}
                        className="relative overflow-hidden glass rounded-2xl border border-slate-100 px-4 py-4 text-left hover:border-accent-violet/30 transition-colors"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.accent} opacity-30`} />
                        <div className="relative flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-white shadow-md">
                            <Icon className="w-5 h-5 text-accent-violet" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Tab Panel */}
              <TabPanel activeTab={activeTab} onTabChange={setActiveTab} />
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

