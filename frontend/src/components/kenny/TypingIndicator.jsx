import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 max-w-[85%] md:max-w-[75%]"
    >
      <div className="shrink-0 mt-1">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-indigo-400 border border-white/5">
          <Shield className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 px-2 py-3.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default TypingIndicator;