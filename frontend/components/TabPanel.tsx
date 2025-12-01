'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineSparkles, 
  HiOutlineDocumentText, 
  HiOutlineTag, 
  HiOutlineLightBulb, 
  HiOutlinePencil 
} from 'react-icons/hi';
import ChatPanel from './ChatPanel';
import SummaryPanel from './SummaryPanel';
import KeywordsPanel from './KeywordsPanel';
import FlashcardsPanel from './FlashcardsPanel';
import NotesPanel from './NotesPanel';

const tabs = [
  { id: 'chat', label: 'Chat', icon: HiOutlineSparkles, color: 'accent-violet' },
  { id: 'summary', label: 'Summary', icon: HiOutlineDocumentText, color: 'accent-mint' },
  { id: 'keywords', label: 'Keywords', icon: HiOutlineTag, color: 'accent-cyan' },
  { id: 'flashcards', label: 'Flashcards', icon: HiOutlineLightBulb, color: 'accent-gold' },
  { id: 'notes', label: 'Notes', icon: HiOutlinePencil, color: 'accent-coral' },
];

export default function TabPanel() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="flex-1 flex flex-col h-full glass rounded-2xl overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 p-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-xl
                transition-all duration-200 text-sm font-medium
                ${isActive 
                  ? 'text-white' 
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute inset-0 bg-${tab.color}/20 rounded-xl border border-${tab.color}/30`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: `rgba(var(--${tab.color}), 0.2)`,
                  }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 ${isActive ? `text-${tab.color}` : ''}`} />
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'chat' && <ChatPanel />}
            {activeTab === 'summary' && <SummaryPanel />}
            {activeTab === 'keywords' && <KeywordsPanel />}
            {activeTab === 'flashcards' && <FlashcardsPanel />}
            {activeTab === 'notes' && <NotesPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

