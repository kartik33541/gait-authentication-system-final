import { executeWithGeminiKeyRotation } from './kennyOrchestrator';

const KENNY_SYSTEM_PROMPT = `
You are Kenny, the intelligent, warm, conversational, and helpful AI assistant for the GaitAuth enterprise facility security platform.
Explain contactless motion verification, onboarding workflows, and perimeter security concepts clearly in plain, non-technical English.
`;

/**
 * Resilient helper routed through the Google Gemini Dual-Key Auto-Rotation Pool.
 */
export const sendKennyMessage = async (userMessage, chatHistory = []) => {
  try {
    const formattedContents = [
      ...chatHistory.slice(-6).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text || msg.content || '' }],
      })),
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    const response = await executeWithGeminiKeyRotation(async (ai, modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction: KENNY_SYSTEM_PROMPT,
          temperature: 0.6,
          maxOutputTokens: 1500,
        },
      });
    });

    return response.text?.trim() || 'No response received.';
  } catch (error) {
    console.error('Kenny Gemini Helper Error:', error);
    return 'Connection to AI service temporarily unavailable. Please verify your Gemini API key in settings.';
  }
};
