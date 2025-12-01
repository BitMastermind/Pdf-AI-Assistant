'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineDocumentText, 
  HiOutlineTrash, 
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineSwitchHorizontal,
  HiOutlineChevronDown
} from 'react-icons/hi';
import { useStore } from '@/lib/store';
import { getDocuments, deleteDocument } from '@/lib/api';
import toast from 'react-hot-toast';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DocumentSidebar() {
  const { 
    documents, 
    setDocuments, 
    currentDocument, 
    setCurrentDocument, 
    removeDocument,
    resetDocumentState 
  } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'size'>('recent');

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    const sorted = [...documents].sort((a, b) => {
      if (sortBy === 'name') {
        return a.filename.localeCompare(b.filename);
      }
      
      if (sortBy === 'size') {
        return b.file_size - a.file_size;
      }
      
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    if (!normalizedQuery) {
      return sorted;
    }

    return sorted.filter((doc) =>
      doc.filename.toLowerCase().includes(normalizedQuery)
    );
  }, [documents, searchQuery, sortBy]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await getDocuments();
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };
    fetchDocuments();
  }, [setDocuments]);

  const handleSelectDocument = (doc: typeof documents[0]) => {
    if (currentDocument?.id !== doc.id) {
      resetDocumentState();
      setCurrentDocument(doc);
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    
    try {
      await deleteDocument(docId);
      removeDocument(docId);
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="w-72 h-full glass border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-display font-semibold text-slate-900">Documents</h2>
        <p className="text-xs text-slate-500 mt-1">
          {filteredDocuments.length} / {documents.length} visible
        </p>

        <div className="mt-3 space-y-2">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename..."
              className="input-field pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 w-full"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <HiOutlineSwitchHorizontal className="w-4 h-4" />
            <span>Sort</span>
            <div className="flex-1 relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 text-xs focus:outline-none focus:border-accent-violet/50"
              >
                <option value="recent">Recently added</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">File size</option>
              </select>
              <HiOutlineChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence>
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-center"
            >
              <HiOutlineDocumentText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No documents yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload a PDF to get started</p>
            </motion.div>
          ) : filteredDocuments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-40 text-center"
            >
              <HiOutlineSearch className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No matches found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search or clear filters</p>
            </motion.div>
          ) : (
            filteredDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectDocument(doc)}
                className={`
                  group relative p-3 rounded-xl cursor-pointer
                  transition-all duration-200
                  ${currentDocument?.id === doc.id 
                    ? 'bg-accent-violet/10 border border-accent-violet/40' 
                    : 'hover:bg-slate-100 border border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${currentDocument?.id === doc.id 
                      ? 'bg-accent-violet/20' 
                      : 'bg-slate-100 group-hover:bg-slate-200'
                    }
                  `}>
                    <HiOutlineDocumentText className={`
                      w-5 h-5
                      ${currentDocument?.id === doc.id ? 'text-accent-violet' : 'text-slate-500'}
                    `} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{doc.page_count} pages</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>
                    {doc.created_at && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <HiOutlineClock className="w-3 h-3" />
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                    className="
                      opacity-0 group-hover:opacity-100
                      p-1.5 rounded-lg
                      hover:bg-accent-coral/10 text-slate-500 hover:text-accent-coral
                      transition-all duration-200
                    "
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

