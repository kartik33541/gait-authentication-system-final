import React, { useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useKennyChat } from '../../hooks/useKennyChat';
import SuggestedPrompts from './SuggestedPrompts';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ChatInputBar from './ChatInputBar';

export const ChatWindow = ({ isWizardStep = false, onProceedToWizard }) => {
  const { messages, isTyping, sendMessage, clearChat } = useKennyChat();
  const scrollRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full w-full relative z-10 pt-24 min-h-0 overflow-hidden">
      
      {/* Top Controls (Moved to relative flow with padding to prevent Navbar collision) */}
      <div className="w-full flex justify-end gap-6 px-4 md:px-12 pb-2 shrink-0">
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" /> Clear Chat
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-20">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-5">
            Hello. I'm Kenny.
          </h1>
          <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto mb-10 font-light leading-relaxed">
            Your intelligent security operations assistant. I help you monitor daily door entries, manage employee access, adjust perimeter strictness, and navigate your security workspace.
          </p>
          <SuggestedPrompts onSelect={sendMessage} />
        </div>
      ) : (
        <div 
          ref={scrollRef} 
          className="flex-1 w-full overflow-y-auto scrollbar-hide min-h-0"
        >
          <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-8">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </div>
      )}

      {/* Centered Bottom Input */}
      <div className="w-full max-w-4xl mx-auto px-4 pb-6 pt-2 shrink-0">
        <ChatInputBar
          onSend={sendMessage}
          disabled={isTyping}
        />
      </div>
    </div>
  );
};

export default ChatWindow;