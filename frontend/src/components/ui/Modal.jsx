import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { Button } from './Button';
import { cn } from '../../lib/utils';

/**
 * Premium Modal Atomic Primitive
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className]
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="z-50 w-full max-w-lg relative"
          >
            <GlassPanel className={cn("p-6 md:p-8 border border-[--border-strong] shadow-2xl", className)}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[--border-subtle]">
                <h3 className="text-xl font-bold text-[--text-primary]">{title || 'System Notification'}</h3>
                <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal" className="!p-1.5 min-w-0">
                  <X className="w-5 h-5 text-[--text-muted] hover:text-white" />
                </Button>
              </div>
              <div className="text-[--text-secondary] space-y-4">
                {children}
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
