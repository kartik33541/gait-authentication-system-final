import React from 'react';
import { motion } from 'framer-motion';

export const SuggestedPrompts = ({
  prompts = [
    "Hello Kenny! What can you help me with?",
    "Where can I add new team members?",
    "How many employees are in our organization?",
    "Explain how 3-tier gate strictness works",
    "Pause door access for an employee"
  ],
  onSelect
}) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto pt-4">
      {prompts.map((prompt, idx) => (
        <motion.button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 bg-[#18181b] border border-white/5 hover:border-white/20 hover:bg-[#27272a] rounded-xl text-sm font-light text-white/70 hover:text-white transition-all shadow-sm"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
};

export default SuggestedPrompts;