import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';

export const ChatInputBar = ({ onSend, disabled = false, onListeningChange, placeholder, footerText }) => {
  const [text, setText] = useState('');

  const handleSpeechResult = (transcript) => setText(transcript);
  const { isListening, toggleListening } = useVoiceInput({ onSpeechResult: handleSpeechResult });

  React.useEffect(() => {
    if (onListeningChange) onListeningChange(isListening);
  }, [isListening, onListeningChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full relative">
      <div className={`flex items-center gap-2 p-2 pl-6 bg-[#18181b] border rounded-2xl shadow-2xl transition-all duration-300 ${
        isListening ? "border-pink-500/50 ring-1 ring-pink-500/20" : "border-white/10 focus-within:border-[#9B6BFF] focus-within:ring-1 focus-within:ring-[#9B6BFF]/30"
      }`}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : (placeholder || "Ask Kenny about 3D Energy thresholds or Siamese LSTMs...")}
          disabled={disabled}
          className="flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus:border-transparent focus:shadow-none shadow-none p-0 m-0 text-[15px] text-white placeholder-white/30 pr-2 disabled:opacity-50 font-light"
        />

        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
            isListening
              ? "bg-pink-500/20 text-pink-400 animate-pulse"
              : "text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <motion.button
          type="submit"
          disabled={!text.trim() || disabled}
          whileHover={{ scale: !text.trim() || disabled ? 1 : 1.05 }}
          whileTap={{ scale: !text.trim() || disabled ? 1 : 0.95 }}
          className="w-10 h-10 rounded-xl bg-[#9B6BFF] text-[#07070C] flex items-center justify-center disabled:opacity-20 disabled:bg-white/10 disabled:text-white disabled:pointer-events-none transition-all shadow-[0_0_15px_rgba(155,107,255,0.35)]"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </motion.button>
      </div>
      {footerText !== undefined ? (
        footerText ? (
          <p className="text-center text-[11px] text-white/30 mt-3 font-medium tracking-wide">
            {footerText}
          </p>
        ) : null
      ) : (
        <p className="text-center text-[11px] text-white/30 mt-3 font-medium tracking-wide">
          Kenny can make mistakes. Verify critical perimeter outputs.
        </p>
      )}
    </form>
  );
};

export default ChatInputBar;