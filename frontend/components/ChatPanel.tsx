'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlinePaperAirplane, HiOutlineSparkles } from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import { useStore } from '@/lib/store';
import { chatWithDocumentStream } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
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
    setStreamingContent('');

    const allMessages = [...messages, userMessage];
    
    await chatWithDocumentStream(
      currentDocument.id,
      allMessages,
      // onChunk - append each chunk to streaming content
      (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },
      // onComplete - save the final message and reset
      () => {
        setStreamingContent((prev) => {
          if (prev) {
            addMessage({ role: 'assistant', content: prev });
          }
          return '';
        });
        setIsLoadingChat(false);
      },
      // onError - show error toast
      (error) => {
        toast.error(`Failed to get response: ${error}`);
        setStreamingContent('');
        setIsLoadingChat(false);
      }
    );
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
        <div className="p-4 rounded-2xl bg-white shadow-inner mb-4">
          <HiOutlineSparkles className="w-12 h-12 text-accent-violet" />
        </div>
        <h3 className="text-xl font-display font-semibold text-slate-900 mb-2">
          Start a Conversation
        </h3>
        <p className="text-slate-500 max-w-sm">
          Upload a PDF document to ask questions and get AI-powered insights
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
          <HiOutlineSparkles className="w-5 h-5 text-accent-violet" />
          Chat with Document
        </h3>
        <p className="text-xs text-slate-500 mt-1 truncate">
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
            <p className="text-slate-500 mb-4">Ask anything about your document</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Summarize this document',
                'What are the main points?',
                'Explain the key concepts',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-sm glass rounded-full hover:bg-slate-100 transition-colors text-slate-600"
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
                    : 'chat-bubble-assistant text-slate-800'
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
            <div className="chat-bubble-assistant px-4 py-3 max-w-[80%]">
              {streamingContent ? (
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
                  {streamingContent}
                </ReactMarkdown>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-accent-violet animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              )}
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
              bg-gradient-to-r from-accent-violet to-accent-cyan
              hover:opacity-90
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 text-white
            "
          >
            <HiOutlinePaperAirplane className="w-5 h-5 text-white rotate-90" />
          </button>
        </div>
      </form>
    </div>
  );
}

