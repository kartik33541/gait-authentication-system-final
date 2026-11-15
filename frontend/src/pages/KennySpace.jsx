import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChatWindow } from '../components/kenny/ChatWindow';

/**
 * KennySpace Page Component
 * Immersive, full-height AI assistant communication terminal.
 */
export const KennySpace = () => {
  return (
    <div className="flex flex-col min-h-screen w-full h-[100dvh] overflow-hidden">
      <main className="flex-1 flex flex-col w-full relative min-h-0 overflow-hidden">
        <ChatWindow isWizardStep={false} />
      </main>
    </div>
  );
};

export default KennySpace;