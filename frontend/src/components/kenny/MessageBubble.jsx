import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { NavCard } from './NavCard';
import { ActionCard } from './ActionCard';

export const MessageBubble = ({ message }) => {
  // Support either 'sender' or 'role' depending on state formulation
  const isUser = message.role === 'user' || message.sender === 'user';
  const messageText = message.content || message.text || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex gap-3.5 max-w-[85%] sm:max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar Area */}
        <div className="shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg select-none">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-indigo-400 border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.3)] select-none">
              <Shield className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content Area */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div className={`px-5 py-3.5 text-[15px] leading-relaxed font-light tracking-wide shadow-md ${
            isUser 
              ? "bg-[#27272a] text-white rounded-2xl rounded-tr-sm border border-white/10" 
              : "bg-[#12131C]/90 border border-white/10 text-zinc-200 rounded-2xl rounded-tl-sm backdrop-blur-xl shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
          }`}>
            {isUser ? (
              // User messages render as regular text
              <p className="whitespace-pre-wrap">{messageText}</p>
            ) : (
              // AI Messages get full Custom Markdown Rendering with ChatGPT-like hierarchy
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed text-zinc-200" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-4 space-y-2 marker:text-indigo-400" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-4 space-y-2 marker:text-indigo-400" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-3 mt-6 text-white tracking-tight border-b border-white/10 pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5 text-white tracking-tight" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium mb-2 mt-4 text-indigo-300" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-white bg-white/5 px-1 rounded" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-indigo-200" {...props} />,
                  a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors" target="_blank" rel="noreferrer" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 py-2 my-4 text-zinc-400 italic bg-white/5 rounded-r-lg" {...props} />,
                  code: ({node, inline, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    // In ReactMarkdown v9, check if children contains newlines or match exists to determine block vs inline code
                    const isBlock = match || String(children).includes('\n');
                    
                    return isBlock ? (
                      <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#09090D] shadow-inner">
                        {/* Elegant Code Header Strip */}
                        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.04] border-b border-white/10 text-xs font-mono text-zinc-400">
                          <span>{match ? match[1].toUpperCase() : 'SNIPPET'}</span>
                          <span className="text-[10px] text-indigo-400">COPY</span>
                        </div>
                        <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-300 leading-relaxed">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      // Inline Code Styling (Pills)
                      <code className="bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-md text-[13px] font-mono border border-indigo-500/20 whitespace-nowrap" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {messageText}
              </ReactMarkdown>
            )}
          </div>

          {/* Agent 1: Interactive Navigator Route Card */}
          {!isUser && message.navCard && (
            <NavCard card={message.navCard} />
          )}

          {/* Agent 4: Interactive Human-in-the-Loop Action Confirmation Card */}
          {!isUser && message.actionCard && (
            <ActionCard card={message.actionCard} />
          )}
          
          {/* Timestamp & Sender Footer */}
          {message.timestamp && (
            <span className="text-[10px] text-zinc-500 mt-1.5 font-mono px-2 opacity-75">
              {isUser ? (message.senderName || 'Admin') : 'Kenny'} • {message.timestamp.includes('T') ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : message.timestamp}
            </span>
          )}
        </div>

      </div>
    </motion.div>
  );
};

export default MessageBubble;