import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';
import { buildAuthUrl } from '../../lib/utils';
import { AuthGateCard } from './AuthGateCard';

/**
 * Global In-Page Authentication Prompt Widget Modal
 * Triggered when unauthenticated visitors interact with restricted actions on public pages.
 */
export const AuthGateModal = () => {
  const navigate = useNavigate();
  const { authGateModal, closeAuthGateModal } = useUiStore();
  const { isOpen, featureName, description, redirectTo } = authGateModal;

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAuthGateModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeAuthGateModal]);

  const handleNavigateAuth = (authPath) => {
    closeAuthGateModal();
    navigate(buildAuthUrl(authPath, redirectTo));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeAuthGateModal}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Authentication Required"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px]"
          >
            <AuthGateCard
              badgeLabel="Authentication Required"
              featureName={featureName || 'this protected feature'}
              description={
                description ||
                'Sign in with your organization credentials or create a workspace account to unlock downloads and internal tools.'
              }
              onLogin={() => handleNavigateAuth('/login')}
              onSignup={() => handleNavigateAuth('/signup')}
              onDismiss={closeAuthGateModal}
              dismissLabel="Stay on Page"
              showCloseIcon
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthGateModal;
