/**
 * @file kennyOrchestrator.js
 * @description Master Orchestrator for Kenny AI Multi-Agent Architecture.
 * Supports Azure OpenAI (Primary) and Google Gemini (Fallback).
 * Handles Meet & Greet natively and dispatches specialized queries to 
 * 4 subagents with generative UI cards, natural conversational synthesis, and grounded intelligence.
 */

import { GoogleGenAI } from '@google/genai';
import { resolveNavigation } from './kennyNavigatorService.js';
import { executeDbAnalytics } from './kennyDbService.js';
import { executeRagGuide } from './kennyRagService.js';
import { proposeAction } from './kennyActionGuard.js';

/* ==========================================================================
   ENVIRONMENT CONFIGURATION HELPERS
   ========================================================================== */

const getEnvVar = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }
  } catch (e) {}
  return '';
};

export const getAzureConfig = () => {
  const apiKey = getEnvVar('VITE_AZURE_OPENAI_API_KEY') || getEnvVar('AZURE_OPENAI_API_KEY');
  const rawEndpoint = getEnvVar('VITE_AZURE_OPENAI_ENDPOINT') || getEnvVar('AZURE_OPENAI_ENDPOINT') || 'https://danie-mmwa1qhz-polandcentral.openai.azure.com';
  const apiVersion = getEnvVar('VITE_AZURE_OPENAI_API_VERSION') || getEnvVar('AZURE_OPENAI_API_VERSION') || '2025-03-01-preview';
  const deployment = getEnvVar('VITE_AZURE_OPENAI_DEPLOYMENT') || getEnvVar('AZURE_OPENAI_DEPLOYMENT') || 'gpt-5.4-nano';
  return { apiKey, endpoint: rawEndpoint, apiVersion, deployment, isConfigured: Boolean(apiKey && rawEndpoint) };
};

/* ==========================================================================
   GEMINI DUAL-KEY AUTO-ROTATION & TOGGLE POOL
   ========================================================================== */
let activeGeminiKeyIndex = 0;

export const getGeminiApiKeys = () => {
  const keys = [];
  const primary = getEnvVar('VITE_GEMINI_API_KEY');
  const backup = getEnvVar('VITE_GEMINI_API_KEY_BACKUP') || getEnvVar('VITE_GEMINI_API_KEY_2');
  const combined = getEnvVar('VITE_GEMINI_API_KEYS');

  if (combined) {
    combined.split(',').forEach((k) => {
      const clean = k.trim();
      if (clean && !keys.includes(clean)) keys.push(clean);
    });
  }
  if (primary && !keys.includes(primary.trim())) keys.push(primary.trim());
  if (backup && !keys.includes(backup.trim())) keys.push(backup.trim());

  return keys;
};

export const toggleNextGeminiKey = () => {
  const keys = getGeminiApiKeys();
  if (keys.length > 1) {
    activeGeminiKeyIndex = (activeGeminiKeyIndex + 1) % keys.length;
    console.info(`[Kenny AI] Toggled to Gemini key index #${activeGeminiKeyIndex + 1} of ${keys.length}`);
  }
  return activeGeminiKeyIndex;
};

export const getActiveGeminiKeyInfo = () => {
  const keys = getGeminiApiKeys();
  return {
    totalKeys: keys.length,
    activeKeyIndex: activeGeminiKeyIndex,
    hasBackup: keys.length > 1,
    activeKeyMasked: keys.length ? `${keys[activeGeminiKeyIndex % keys.length].slice(0, 8)}...` : 'None'
  };
};

/**
 * Executes a Gemini operation with automatic multi-model and dual-key rotation.
 */
export const executeWithGeminiKeyRotation = async (operationFn) => {
  const keys = getGeminiApiKeys();
  if (!keys.length) {
    throw new Error('No Google Gemini API keys configured. Please set VITE_GEMINI_API_KEY in your environment.');
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  // Try across available keys (active key first, then alternate)
  for (let keyAttempt = 0; keyAttempt < keys.length; keyAttempt++) {
    const currentKey = keys[activeGeminiKeyIndex % keys.length];
    const ai = new GoogleGenAI({ apiKey: currentKey });

    for (const modelName of modelsToTry) {
      try {
        const result = await operationFn(ai, modelName);
        if (result) return result;
      } catch (err) {
        lastError = err;
        console.warn(`[Kenny AI] Model ${modelName} failed on Gemini key #${(activeGeminiKeyIndex % keys.length) + 1}:`, err.message);
      }
    }

    // If all models failed on the current key, automatically toggle to the backup key
    if (keys.length > 1) {
      console.warn(`[Kenny AI] Rotating to backup Gemini key from index #${(activeGeminiKeyIndex % keys.length) + 1}...`);
      toggleNextGeminiKey();
    }
  }

  throw lastError || new Error('All Google Gemini API keys and fallback models failed.');
};

/* ==========================================================================
   1. TOOL DECLARATIONS (OPENAI & GEMINI FORMATS)
   ========================================================================== */

export const OPENAI_SUBAGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'navigator_agent',
      description: 'Navigate to internal application pages, features, or UI settings (e.g. member onboarding, command dashboard, gate strictness modal, live telemetry feed, or employee roster).',
      parameters: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            description: 'Target location: "onboarding", "dashboard", "android_app" (for Android mobile app & APK download center), "strictness_modal", "telemetry_feed", or "roster".'
          },
          reason: {
            type: 'string',
            description: 'Short reason why this page or feature is being opened.'
          }
        },
        required: ['destination']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'db_telemetry_agent',
      description: 'Query organization database for workforce totals, check if a specific employee exists/is active, or retrieve daily door access logs and incidents.',
      parameters: {
        type: 'object',
        properties: {
          query_type: {
            type: 'string',
            description: 'Type of query: "workforce_summary" (total/active count), "search_employee" (verify employee by name), or "daily_logs" (today\'s entries & rejections).'
          },
          employee_name: {
            type: 'string',
            description: 'Employee name or ID to search for (if searching for a person).'
          },
          filter: {
            type: 'string',
            description: 'Optional filter: "all", "rejections_only", or "flagged".'
          }
        },
        required: ['query_type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'rag_guide_agent',
      description: 'Explain application features, how 1:1 contactless gait authentication works conceptually, the 4 Morning Health Check numbers, recalibrating walk baseline, 3-tier gate strictness, or Kenny AI multi-agent architecture.',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to explain: e.g. "1:1 authentication concept", "morning health check", "recalibration", "3-tier gate strictness", "false alarm dismissal", or "kenny multi-agent system".'
          }
        },
        required: ['topic']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'action_guard_agent',
      description: 'Propose an administrative state change, such as pausing or resuming employee door access, setting perimeter gate strictness, or dismissing a flagged incident. Always governed by Human-in-the-Loop confirmation.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'Action to propose: "PAUSE_EMPLOYEE", "RESUME_EMPLOYEE", "SET_GATE_STRICTNESS", "DISMISS_INCIDENT", or "ESCALATE_INCIDENT".'
          },
          target_name: {
            type: 'string',
            description: 'Name or ID of employee, or incident log ID.'
          },
          mode: {
            type: 'string',
            description: 'Optional strictness mode for SET_GATE_STRICTNESS: "HIGH_THROUGHPUT" (0.65 Smooth), "BALANCED" (0.75 Balanced), or "STRICT" (0.85 Strict).'
          },
          details: {
            type: 'string',
            description: 'Summary of the action and its operational impact.'
          }
        },
        required: ['action']
      }
    }
  }
];

export const KENNY_SUBAGENT_TOOLS = [
  {
    functionDeclarations: OPENAI_SUBAGENT_TOOLS.map(t => ({
      name: t.function.name,
      description: t.function.description,
      parameters: {
        type: 'OBJECT',
        properties: Object.fromEntries(
          Object.entries(t.function.parameters.properties).map(([k, v]) => [
            k,
            { type: v.type.toUpperCase(), description: v.description }
          ])
        ),
        required: t.function.parameters.required
      }
    }))
  }
];

/* ==========================================================================
   2. AZURE OPENAI CLIENT HANDLERS
   ========================================================================== */

const callAzureChat = async (messages, tools = null, temperature = 0.6) => {
  const { apiKey, endpoint, deployment, apiVersion } = getAzureConfig();
  if (!apiKey) throw new Error("Azure OpenAI API Key is not configured.");

  const cleanEndpoint = endpoint.replace(/\/+$/, '');
  const url = cleanEndpoint.includes('/openai/v1')
    ? `${cleanEndpoint}/chat/completions?api-version=${apiVersion}`
    : `${cleanEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const body = {
    model: deployment,
    messages,
    temperature,
    max_completion_tokens: 1500
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Azure OpenAI returned HTTP ${res.status}`);
  }

  return await res.json();
};

/* ==========================================================================
   3. MASTER DISPATCH LOGIC
   ========================================================================== */

export const orchestrateKennyMessage = async (userMessage, chatHistory = [], sessionContext = {}) => {
  const tenantId = sessionContext?.tenantId;
  if (!tenantId) {
    throw new Error("Unauthorized session: active organization workspace required.");
  }
  const adminName = sessionContext?.user?.name || sessionContext?.adminName || 'Administrator';
  const orgName = sessionContext?.user?.organization || sessionContext?.organizationName || 'Enterprise Workspace';

  const systemInstruction = `
You are Kenny, the intelligent, warm, conversational, and helpful AI assistant for ${orgName}.
You are speaking directly with ${adminName} (HR / Operations / Management Administrator).
Tenant Organization ID: ${tenantId}.

### Operating Principles:
1. **Meet & Greet & General Conversation (DO NOT CALL TOOLS):**
   - For greetings (e.g. "Hello", "Hi Kenny", "Good morning", "Hey"), asking who you are, what you can do, or general polite check-ins, DO NOT call any tool.
   - Respond directly in a warm, respectful, conversational, and natural tone like ChatGPT or Claude. Acknowledge ${adminName} and ${orgName} naturally.
   
2. **Ambiguous or Open Inquiries (DO NOT CALL TOOLS):**
   - If the administrator asks an open-ended question or wants recommendations, handle it conversationally. Proactively guide them on what you can assist with: checking workforce records, reviewing today's door access, navigating to onboarding or settings, or managing passkeys.

3. **Specialized Tools (CALL TOOLS):**
   - When the administrator asks to navigate to a page/feature/setting, CALL \`navigator_agent\`.
   - When the administrator asks about employee counts, checking if an employee exists, or viewing today's door logs, CALL \`db_telemetry_agent\`.
   - When the administrator asks how 1:1 gait authentication works, asks about the 4 dashboard features, recalibrating walks, or Kenny architecture, CALL \`rag_guide_agent\`.
   - When the administrator asks to perform an action (pause/resume employee access, adjust strictness, dismiss incident), CALL \`action_guard_agent\`.

4. **Tone & Anti-Jargon:**
   - Speak in clear, friendly, human English.
   - NEVER use developer jargon: NEVER mention "Agent 1", "Agent 2", "Agent 3", "Agent 4", "Subagent", "Dispatch", "Orchestrator", "Database Analyst", "Sanitized Projection", "Operational Status", or "Cloud Firestore".
   - Your name is simply Kenny.
`;

  const azureConfig = getAzureConfig();
  const useAzure = getEnvVar('VITE_USE_AZURE_OPENAI') === 'true';

  // --------------------------------------------------------------------------
  // PATH A: AZURE OPENAI (Optional - Disabled in Production)
  // --------------------------------------------------------------------------
  if (useAzure && azureConfig.isConfigured) {
    try {
      const messages = [
        { role: 'system', content: systemInstruction },
        ...chatHistory.slice(-6).map(m => ({
          role: m.role === 'kenny' ? 'assistant' : 'user',
          content: m.content || m.text || ''
        })),
        { role: 'user', content: userMessage.trim() }
      ];

      const completion = await callAzureChat(messages, OPENAI_SUBAGENT_TOOLS);
      const choice = completion.choices?.[0];
      const message = choice?.message;

      // Case A.1: Tool Calls Triggered
      if (message?.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch (e) {
          args = {};
        }

        let subagentResult = null;
        if (toolName === 'navigator_agent') {
          subagentResult = resolveNavigation(args, { adminName, orgName, tenantId });
        } else if (toolName === 'db_telemetry_agent') {
          subagentResult = await executeDbAnalytics(args, { adminName, orgName, tenantId });
        } else if (toolName === 'rag_guide_agent') {
          subagentResult = executeRagGuide(args, { adminName, orgName, tenantId });
        } else if (toolName === 'action_guard_agent') {
          subagentResult = await proposeAction(args, { adminName, orgName, tenantId });
        }

        if (subagentResult) {
          // Conversational synthesis turn via Azure OpenAI
          const synthPrompt = `
You are Kenny, the warm, helpful AI assistant for ${orgName}.
You are conversing with ${adminName}.
User asked: "${userMessage}"

The system retrieved/prepared this data:
${JSON.stringify(subagentResult.data || subagentResult.navCard || subagentResult.actionCard || subagentResult.message, null, 2)}

${subagentResult.navCard ? `NOTE: An interactive button card to open "${subagentResult.navCard.title}" (${subagentResult.navCard.route}) will be rendered right below your response.` : ''}
${subagentResult.actionCard ? `NOTE: An interactive confirmation card for "${subagentResult.actionCard.title}" with [Confirm] and [Cancel] buttons will be rendered right below your response.` : ''}
${subagentResult.isForbidden ? `NOTE: This destructive action was rejected by security policy and cannot be executed via chat.` : ''}

Respond to ${adminName} in a warm, natural, helpful, talkative tone like ChatGPT or Claude:
- Plain, friendly English (NO developer jargon like Agent 2, Firestore, Sanitized, Dispatch).
- Clearly communicate the retrieved facts or details.
- If a card is attached below, warmly mention it so they know they can click or confirm.
- Ask how else you can assist them.
`;
          let conversationalText = '';
          try {
            const synthRes = await callAzureChat([
              { role: 'system', content: 'You are Kenny, the warm, helpful assistant for ' + orgName },
              { role: 'user', content: synthPrompt }
            ], null, 0.7);
            conversationalText = synthRes.choices?.[0]?.message?.content?.trim() || '';
          } catch (synthErr) {
            console.warn("Azure synthesis fallback:", synthErr.message);
          }

          return {
            type: 'SUBAGENT_DISPATCH',
            agent: 'Kenny',
            text: conversationalText || subagentResult.message,
            navCard: subagentResult.navCard || null,
            actionCard: subagentResult.actionCard || null,
            rawArgs: args
          };
        }
      }

      // Case A.2: Direct Conversational Reply
      const replyText = message?.content?.trim();
      if (replyText) {
        return {
          type: 'MEET_AND_GREET',
          agent: 'Kenny',
          text: replyText
        };
      }
    } catch (azureError) {
      console.warn("Azure OpenAI call failed, switching to Google Gemini dual-key pool:", azureError.message);
    }
  }

  // --------------------------------------------------------------------------
  // PATH B: GOOGLE GEMINI (Primary Production Dual-Key Rotation Pool)
  // --------------------------------------------------------------------------
  try {
    const contents = [
      ...chatHistory.slice(-6).map(m => ({
        role: m.role === 'kenny' ? 'model' : 'user',
        parts: [{ text: m.content || m.text || '' }]
      })),
      { role: 'user', parts: [{ text: userMessage.trim() }] }
    ];

    const response = await executeWithGeminiKeyRotation(async (ai, modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: KENNY_SUBAGENT_TOOLS,
          temperature: 0.6,
          maxOutputTokens: 1500
        }
      });
    });

    if (!response) {
      throw new Error("All Google Gemini models and keys returned empty responses.");
    }

    // Case B.1: Tool Calls Triggered
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const toolName = call.name;
      const args = call.args || {};

      let subagentResult = null;
      if (toolName === 'navigator_agent') {
        subagentResult = resolveNavigation(args, { adminName, orgName, tenantId });
      } else if (toolName === 'db_telemetry_agent') {
        subagentResult = await executeDbAnalytics(args, { adminName, orgName, tenantId });
      } else if (toolName === 'rag_guide_agent') {
        subagentResult = executeRagGuide(args, { adminName, orgName, tenantId });
      } else if (toolName === 'action_guard_agent') {
        subagentResult = await proposeAction(args, { adminName, orgName, tenantId });
      }

      if (subagentResult) {
        const synthesisPrompt = `
You are Kenny, the intelligent, warm, conversational, and helpful AI assistant for ${orgName}.
You are speaking directly with ${adminName} (HR / Operations / Management Administrator).
The user asked: "${userMessage}"

The system retrieved or prepared the following information:
${JSON.stringify(subagentResult.data || subagentResult.navCard || subagentResult.actionCard || subagentResult.message, null, 2)}

${subagentResult.navCard ? `NOTE: An interactive button card to open "${subagentResult.navCard.title}" (${subagentResult.navCard.route}) will be rendered right below your message.` : ''}
${subagentResult.actionCard ? `NOTE: An interactive confirmation card for "${subagentResult.actionCard.title}" with [Confirm] and [Cancel] buttons will be rendered right below your message.` : ''}
${subagentResult.isForbidden ? `NOTE: This destructive action was rejected by security policy and cannot be executed via chat.` : ''}

CRITICAL COMMUNICATION GUIDELINES:
1. Speak in a natural, friendly, warm, and helpful tone — exactly like ChatGPT or Claude.
2. ABSOLUTELY ZERO DEVELOPER JARGON:
   - NEVER mention "Agent 1", "Agent 2", "Agent 3", "Agent 4", "Subagent", "Dispatch", "Orchestrator", "Database Analyst", "Sanitized Projection", "Operational Status", or "Cloud Firestore".
   - Your name is simply Kenny.
3. Answer the user's request conversationally, clearly, and thoroughly using the retrieved details.
4. If a button card is shown below (for navigation or confirming an action), guide them to it naturally (e.g., "I've added a quick link below so you can jump right in", or "Please take a look at the card below and confirm when you're ready").
5. Offer helpful follow-ups or ask how else you can assist them.
`;

        let conversationalText = '';
        try {
          const synthResponse = await executeWithGeminiKeyRotation(async (ai, modelName) => {
            return await ai.models.generateContent({
              model: modelName,
              contents: [{ role: 'user', parts: [{ text: synthesisPrompt }] }],
              config: {
                temperature: 0.7,
                maxOutputTokens: 1000
              }
            });
          });
          conversationalText = synthResponse.text?.trim() || '';
        } catch (synthErr) {
          console.warn("[Kenny AI] Synthesis fallback warning:", synthErr.message);
        }

        return {
          type: 'SUBAGENT_DISPATCH',
          agent: 'Kenny',
          text: conversationalText || subagentResult.message,
          navCard: subagentResult.navCard || null,
          actionCard: subagentResult.actionCard || null,
          rawArgs: args
        };
      }
    }

    // Case B.2: Direct Conversational Turn
    const replyText = response.text?.trim();
    if (!replyText) {
      throw new Error("AI returned empty content for conversational turn.");
    }

    return {
      type: 'MEET_AND_GREET',
      agent: 'Kenny',
      text: replyText
    };

  } catch (error) {
    console.error("Kenny Orchestrator API Error:", error);
    return {
      type: 'ERROR',
      agent: 'Kenny',
      text: `I'm having a little trouble connecting to my AI service at the moment (${error.message || 'connection issue'}). Please try again in a moment.`
    };
  }
};
