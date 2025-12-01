'use client';

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
  { id: 'chat', label: 'Chat', icon: HiOutlineSparkles, accent: '#A855F7' },
  { id: 'summary', label: 'Summary', icon: HiOutlineDocumentText, accent: '#4ECDC4' },
  { id: 'keywords', label: 'Keywords', icon: HiOutlineTag, accent: '#22D3EE' },
  { id: 'flashcards', label: 'Flashcards', icon: HiOutlineLightBulb, accent: '#FFE66D' },
  { id: 'notes', label: 'Notes', icon: HiOutlinePencil, accent: '#FF6B6B' },
];

interface TabPanelProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function TabPanel({ activeTab, onTabChange }: TabPanelProps) {
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
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-xl
                transition-all duration-200 text-sm font-medium
                ${isActive 
                  ? 'text-slate-900 font-semibold' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl border"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    background: hexToRgba(tab.accent, 0.15),
                    borderColor: hexToRgba(tab.accent, 0.4),
                  }}
                />
              )}
              <Icon
                className="w-4 h-4 relative z-10"
                style={{ color: isActive ? tab.accent : '#94a3b8' }}
              />
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

