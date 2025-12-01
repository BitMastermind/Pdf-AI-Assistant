'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineLightBulb, 
  HiOutlineRefresh, 
  HiOutlineChevronLeft, 
  HiOutlineChevronRight,
  HiOutlineTrash
} from 'react-icons/hi';
import { useStore } from '@/lib/store';
import { generateFlashcards, deleteFlashcard } from '@/lib/api';
import toast from 'react-hot-toast';

export default function FlashcardsPanel() {
  const [numCards, setNumCards] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const { 
    currentDocument, 
    flashcards, 
    setFlashcards,
    removeFlashcard,
    isLoadingFlashcards, 
    setIsLoadingFlashcards 
  } = useStore();

  const handleGenerateFlashcards = async () => {
    if (!currentDocument) return;

    setIsLoadingFlashcards(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
      const result = await generateFlashcards(currentDocument.id, numCards);
      setFlashcards(result);
      toast.success(`${result.length} flashcards generated!`);
    } catch (error) {
      toast.error('Failed to generate flashcards');
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFlashcard(id);
      removeFlashcard(id);
      if (currentIndex >= flashcards.length - 1) {
        setCurrentIndex(Math.max(0, flashcards.length - 2));
      }
      toast.success('Flashcard deleted');
    } catch (error) {
      toast.error('Failed to delete flashcard');
    }
  };

  const currentCard = flashcards[currentIndex];

  if (!currentDocument) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="p-4 rounded-2xl bg-white shadow-inner mb-4 inline-block">
            <HiOutlineLightBulb className="w-12 h-12 text-accent-gold" />
          </div>
          <h3 className="text-xl font-display font-semibold text-slate-900 mb-2">
            Flashcards
          </h3>
          <p className="text-slate-500">Select a document to create flashcards</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-display font-semibold text-slate-900 flex items-center gap-2">
          <HiOutlineLightBulb className="w-5 h-5 text-accent-gold" />
          Flashcards
        </h3>
        <p className="text-xs text-slate-500 mt-1 truncate">
          {currentDocument.filename}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {flashcards.length === 0 && !isLoadingFlashcards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mb-6">
              <label className="block text-sm text-slate-600 mb-2">
                Number of Cards
              </label>
              <div className="flex items-center justify-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={5}
                  value={numCards}
                  onChange={(e) => setNumCards(Number(e.target.value))}
                  className="w-48 accent-accent-gold"
                />
                <span className="text-slate-700 font-mono w-8">{numCards}</span>
              </div>
            </div>
            
            <button
              onClick={handleGenerateFlashcards}
              className="btn-primary inline-flex items-center gap-2"
            >
              <HiOutlineLightBulb className="w-5 h-5" />
              Generate Flashcards
            </button>
          </motion.div>
        )}

        {isLoadingFlashcards && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-accent-gold/30 rounded-full mx-auto" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-t-accent-gold rounded-full animate-spin mx-auto" />
              </div>
              <p className="text-slate-600">Generating flashcards...</p>
            </div>
          </div>
        )}

        {flashcards.length > 0 && !isLoadingFlashcards && currentCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Card counter */}
            <div className="text-center text-sm text-slate-500">
              Card {currentIndex + 1} of {flashcards.length}
            </div>

            {/* Flashcard */}
            <div 
              className="flashcard cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`flashcard-inner relative h-64 ${isFlipped ? 'flipped' : ''}`}>
                {/* Front - Question */}
                <div className="flashcard-front absolute inset-0 card flex flex-col items-center justify-center p-6 bg-white border border-accent-gold/30">
                  <span className="text-xs text-accent-gold mb-4 uppercase tracking-wider">Question</span>
                  <p className="text-lg text-slate-900 text-center">{currentCard.question}</p>
                  <span className="absolute bottom-4 text-xs text-slate-400">Click to flip</span>
                </div>

                {/* Back - Answer */}
                <div className="flashcard-back absolute inset-0 card flex flex-col items-center justify-center p-6 bg-white border border-accent-mint/30">
                  <span className="text-xs text-accent-mint mb-4 uppercase tracking-wider">Answer</span>
                  <p className="text-lg text-slate-900 text-center">{currentCard.answer}</p>
                  <span className="absolute bottom-4 text-xs text-slate-400">Click to flip</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePrevious}
                className="p-3 rounded-full glass hover:bg-slate-100 transition-colors"
              >
                <HiOutlineChevronLeft className="w-6 h-6 text-slate-700" />
              </button>

              <button
                onClick={() => handleDelete(currentCard.id)}
                className="p-2 rounded-lg glass hover:bg-accent-coral/10 text-slate-600 hover:text-accent-coral transition-colors"
              >
                <HiOutlineTrash className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="p-3 rounded-full glass hover:bg-slate-100 transition-colors"
              >
                <HiOutlineChevronRight className="w-6 h-6 text-slate-700" />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 flex-wrap max-w-xs mx-auto">
              {flashcards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsFlipped(false);
                  }}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${index === currentIndex 
                      ? 'bg-accent-gold w-4' 
                      : 'bg-slate-200 hover:bg-slate-300'
                    }
                  `}
                />
              ))}
            </div>

            <button
              onClick={handleGenerateFlashcards}
              className="btn-secondary inline-flex items-center gap-2 text-sm mx-auto"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              Generate New Cards
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

