'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePaperAirplane, HiOutlineSparkles } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import { useStore } from '@/lib/store';
import { chatWithDocument } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { 
    currentDocument, 
    messages, 
    addMessage, 
    isLoadingChat, 
    setIsLoadingChat 
  } = useStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentDocument || isLoadingChat) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    addMessage(userMessage);
    setInput('');
    setIsLoadingChat(true);

    try {
      const allMessages = [...messages, userMessage];
      const response = await chatWithDocument(currentDocument.id, allMessages);
      addMessage({ role: 'assistant', content: response });
    } catch (error: any) {
      toast.error('Failed to get response');
      console.error(error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!currentDocument) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 rounded-2xl bg-white/5 mb-4">
          <HiOutlineSparkles className="w-12 h-12 text-accent-violet" />
        </div>
        <h3 className="text-xl font-display font-semibold text-white mb-2">
          Start a Conversation
        </h3>
        <p className="text-white/50 max-w-sm">
          Upload a PDF document to ask questions and get AI-powered insights
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="font-display font-semibold text-white flex items-center gap-2">
          <HiOutlineSparkles className="w-5 h-5 text-accent-violet" />
          Chat with Document
        </h3>
        <p className="text-xs text-white/40 mt-1 truncate">
          {currentDocument.filename}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-white/40 mb-4">Ask anything about your document</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Summarize this document',
                'What are the main points?',
                'Explain the key concepts',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-sm glass rounded-full hover:bg-white/10 transition-colors text-white/60"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] px-4 py-3
                  ${message.role === 'user' 
                    ? 'chat-bubble-user text-white' 
                    : 'chat-bubble-assistant text-white/90'
                  }
                `}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    code: ({ children }) => (
                      <code className="px-1.5 py-0.5 bg-white/10 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoadingChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="chat-bubble-assistant px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-white/40">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your document..."
            rows={1}
            className="flex-1 input-field resize-none"
            disabled={isLoadingChat}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoadingChat}
            className="
              px-4 py-3 rounded-xl
              bg-gradient-to-r from-accent-violet to-midnight-600
              hover:from-accent-violet/90 hover:to-midnight-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            <HiOutlinePaperAirplane className="w-5 h-5 text-white rotate-90" />
          </button>
        </div>
      </form>
    </div>
  );
}

