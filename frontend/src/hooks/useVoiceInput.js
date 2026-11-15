import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook to handle VoiceOrb speech listening simulation or Web Speech API integration.
 */
export function useVoiceInput({ onSpeechResult }) {
  const [isListening, setIsListening] = useState(false);

  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    toast("Listening... Speak clearly into your microphone.", {
      icon: '🎙️',
      style: {
        background: '#0D0E16',
        color: '#F5F6FA',
        border: '1px solid rgba(255,255,255,0.08)'
      }
    });

    // Simulate speech detection after 3 seconds for demonstration
    setTimeout(() => {
      setIsListening(false);
      if (onSpeechResult) {
        const samples = [
          "What is the 3D Energy Score?",
          "How many readings do I need per person?",
          "How does gait authentication work?"
        ];
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        onSpeechResult(randomSample);
      }
    }, 3200);
  }, [isListening, onSpeechResult]);

  return {
    isListening,
    toggleListening
  };
}

export default useVoiceInput;
