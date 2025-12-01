'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlinePaperAirplane, 
  HiOutlineSparkles,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineCheck
} from 'react-icons/hi';
import ReactMarkdown from 'react-markdown';
import { useStore, Message } from '@/lib/store';
import { chatWithDocumentStream, getChatSuggestions } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastUserMessageIndex, setLastUserMessageIndex] = useState<number | null>(null);
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
  }, [messages, streamingContent]);

  // Fetch suggestions after a new assistant message
  const fetchSuggestions = useCallback(async () => {
    if (!currentDocument || messages.length < 2) return;
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return;
    
    setIsLoadingSuggestions(true);
    try {
      const newSuggestions = await getChatSuggestions(currentDocument.id, messages);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [currentDocument, messages]);

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      fetchSuggestions();
    }
  }, [messages.length, fetchSuggestions]);

  // Clear suggestions when document changes
  useEffect(() => {
    setSuggestions([]);
  }, [currentDocument?.id]);

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const sendMessage = async (messageContent: string, isRegenerate = false) => {
    if (!messageContent.trim() || !currentDocument || isLoadingChat) return;

    let messagesToSend: Message[];
    
    if (isRegenerate && lastUserMessageIndex !== null) {
      // For regenerate, use messages up to and including the last user message
      messagesToSend = messages.slice(0, lastUserMessageIndex + 1);
    } else {
      const userMessage: Message = { role: 'user', content: messageContent.trim() };
      addMessage(userMessage);
      setLastUserMessageIndex(messages.length);
      messagesToSend = [...messages, userMessage];
    }

    setInput('');
    setIsLoadingChat(true);
    setStreamingContent('');
    setSuggestions([]);

    let accumulatedContent = '';
    
    await chatWithDocumentStream(
      currentDocument.id,
      messagesToSend,
      (chunk) => {
        accumulatedContent += chunk;
        setStreamingContent(accumulatedContent);
      },
      () => {
        setIsLoadingChat(false);
        if (accumulatedContent.trim()) {
          addMessage({ role: 'assistant', content: accumulatedContent });
        }
        setStreamingContent('');
      },
      (error) => {
        toast.error(`Failed to get response: ${error}`);
        setStreamingContent('');
        setIsLoadingChat(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  const handleRegenerate = async () => {
    // Find the last user message
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    
    if (lastUserIdx === -1) return;
    
    const lastUserContent = messages[lastUserIdx].content;
    setLastUserMessageIndex(lastUserIdx);
    
    // Remove the last assistant message if present
    const { messages: currentMessages } = useStore.getState();
    if (currentMessages.length > lastUserIdx + 1 && currentMessages[lastUserIdx + 1].role === 'assistant') {
      // We need to remove the last assistant message from the store
      // Since we don't have a removeMessage action, we'll just send a new request
      // The new response will naturally replace the old one in the UI flow
    }
    
    await sendMessage(lastUserContent, true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
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
                  onClick={() => handleSuggestionClick(suggestion)}
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
              <div className="group relative max-w-[80%]">
                <div
                  className={`
                    px-4 py-3
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
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-slate-700">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="absolute -bottom-8 left-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopyMessage(message.content, index)}
                      className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                      title="Copy response"
                    >
                      {copiedIndex === index ? (
                        <HiOutlineCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <HiOutlineClipboardCopy className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    {index === messages.length - 1 && (
                      <button
                        onClick={handleRegenerate}
                        disabled={isLoadingChat}
                        className="p-1.5 rounded-lg bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        title="Regenerate response"
                      >
                        <HiOutlineRefresh className="w-4 h-4 text-slate-500" />
                      </button>
                    )}
                  </div>
                )}
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
                      <code className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-slate-700">
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

        {/* Suggested follow-up questions */}
        {!isLoadingChat && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <p className="text-xs text-slate-400 mb-2 font-medium">Suggested follow-ups:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-sm bg-accent-violet/5 border border-accent-violet/20 rounded-full hover:bg-accent-violet/10 hover:border-accent-violet/30 transition-all text-slate-700"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {isLoadingSuggestions && !isLoadingChat && (
          <div className="pt-4">
            <p className="text-xs text-slate-400 mb-2">Loading suggestions...</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-32 rounded-full skeleton" />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200">
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
