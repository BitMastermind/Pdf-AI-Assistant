'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineDocumentText, HiOutlineTrash, HiOutlineClock } from 'react-icons/hi';
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
        <h2 className="text-lg font-display font-semibold gradient-text">Documents</h2>
        <p className="text-xs text-white/40 mt-1">{documents.length} uploaded</p>
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
              <HiOutlineDocumentText className="w-12 h-12 text-white/20 mb-3" />
              <p className="text-sm text-white/40">No documents yet</p>
              <p className="text-xs text-white/30 mt-1">Upload a PDF to get started</p>
            </motion.div>
          ) : (
            documents.map((doc, index) => (
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
                    ? 'bg-accent-violet/20 border border-accent-violet/40' 
                    : 'hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg
                    ${currentDocument?.id === doc.id 
                      ? 'bg-accent-violet/30' 
                      : 'bg-white/5 group-hover:bg-white/10'
                    }
                  `}>
                    <HiOutlineDocumentText className={`
                      w-5 h-5
                      ${currentDocument?.id === doc.id ? 'text-accent-violet' : 'text-white/60'}
                    `} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
                      <span>{doc.page_count} pages</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>
                    {doc.created_at && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-white/30">
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
                      hover:bg-accent-coral/20 text-white/40 hover:text-accent-coral
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

