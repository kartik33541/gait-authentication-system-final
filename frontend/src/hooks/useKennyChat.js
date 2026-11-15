import { useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { orchestrateKennyMessage } from '../services/kennyOrchestrator';

/**
 * Custom hook to interact with Kenny Multi-Agent Assistant.
 * Powered by Master Orchestrator with Gemini 2.5 Flash and modular subagent routing.
 */
export function useKennyChat() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef([]);
  messagesRef.current = messages;

  const { user, organization, tenantId, isAuthenticated } = useAuth();

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    const resolvedTenantId = tenantId || user?.tenant_id || user?.tenantId;
    if (!isAuthenticated || !user || !resolvedTenantId) {
      const authErrorMsg = {
        id: `MSG_${Date.now()}_auth`,
        role: 'kenny',
        content: 'Authentication required. Please sign in to an active organization account to use Kenny.',
        dispatchedAgent: 'Kenny',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, authErrorMsg]);
      return;
    }

    const userMsg = {
      id: `MSG_${Date.now()}_u`,
      role: 'user',
      content: text.trim(),
      senderName: user.name || 'Admin',
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const sessionContext = {
        adminName: user.name || 'Administrator',
        organizationName: user.organization || (typeof organization === 'string' ? organization : organization?.name) || 'Organization Workspace',
        tenantId: resolvedTenantId
      };

      const result = await orchestrateKennyMessage(text.trim(), messagesRef.current, sessionContext);

      const kennyMsg = {
        id: `MSG_${Date.now()}_k`,
        role: 'kenny',
        content: result.text,
        dispatchType: result.type,
        dispatchedAgent: result.agent,
        navCard: result.navCard || null,
        actionCard: result.actionCard || null,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, kennyMsg]);
    } catch (err) {
      console.error("Kenny Chat Hook Error:", err);
      const errorMsg = {
        id: `MSG_${Date.now()}_err`,
        role: 'kenny',
        content: `I ran into a temporary issue connecting to the assistant service. ${err.message}`,
        dispatchedAgent: 'Kenny',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [user, organization, tenantId, isAuthenticated]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat
  };
}

export default useKennyChat;
