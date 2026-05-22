import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recipe } from '@/types';
import { withBaseUrl } from '@/lib/utils';

interface ImageModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  recipe,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight' && hasNext) onNext();
    if (e.key === 'ArrowLeft' && hasPrev) onPrev();
  }, [isOpen, onClose, onNext, onPrev, hasNext, hasPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !recipe) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div 
          className="relative max-w-full max-h-full flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Image Container */}
          <div className="relative flex items-center justify-center w-full h-full max-h-[85vh] max-w-[500px]">
             {/* Navigation Buttons */}
            {hasPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className="absolute left-[-50px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:flex"
              >
                <ChevronLeft size={32} />
              </button>
            )}
            
            {hasNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-[-50px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors hidden md:flex"
              >
                <ChevronRight size={32} />
              </button>
            )}

            <motion.img
              key={recipe.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              src={withBaseUrl(recipe.imagePath)}
              alt={recipe.name}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              // Add simple swipe detection for mobile could be here, but keeping it simple for now
            />
            
            {/* Mobile Navigation Overlays */}
            <div className="absolute inset-y-0 left-0 w-1/4 md:hidden" onClick={(e) => {
               e.stopPropagation();
               if (hasPrev) onPrev();
            }} />
            <div className="absolute inset-y-0 right-0 w-1/4 md:hidden" onClick={(e) => {
               e.stopPropagation();
               if (hasNext) onNext();
            }} />
          </div>

          {/* Footer Info */}
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold text-white">{recipe.name}</h2>
            <p className="text-white/60 text-sm mt-1">{recipe.category}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
