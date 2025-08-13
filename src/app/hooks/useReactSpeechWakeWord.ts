'use client';

import { useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

type UseReactSpeechWakeWordOpts = {
  wakeWords?: string[];
  language?: string;
  onWake: () => void;
  onError?: (error: Error) => void;
};

function useReactSpeechWakeWord({
  wakeWords = ['jarvis', 'hey jarvis', 'ok jarvis', 'oye jarvis'],
  language = 'es-ES',
  onWake,
  onError
}: UseReactSpeechWakeWordOpts) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Verificar wake words en el transcript
  useEffect(() => {
    if (transcript) {
      const lowerTranscript = transcript.toLowerCase();
      console.log('🔊 Escuchado:', lowerTranscript);
      
      const detected = wakeWords.some(word => 
        lowerTranscript.includes(word.toLowerCase())
      );
      
      if (detected) {
        console.log('🎯 WAKE WORD DETECTADO:', lowerTranscript);
        onWake();
        stop(); // Detener después de detección
        resetTranscript(); // Limpiar transcript
      }
    }
  }, [transcript, wakeWords, onWake]);

  const start = useCallback(() => {
    if (!browserSupportsSpeechRecognition) {
      const error = new Error('Speech Recognition no soportado');
      onError?.(error);
      return;
    }

    SpeechRecognition.startListening({
      continuous: true,
      language: language,
      interimResults: true
    });
    
    console.log('🚀 Iniciando wake word detection...');
  }, [browserSupportsSpeechRecognition, language, onError]);

  const stop = useCallback(() => {
    SpeechRecognition.stopListening();
    console.log('🛑 Deteniendo wake word detection');
  }, []);

  const cleanup = useCallback(() => {
    stop();
    resetTranscript();
  }, [stop, resetTranscript]);

  return {
    listening,
    loading: false,
    error: browserSupportsSpeechRecognition ? null : 'Speech Recognition no soportado',
    isReady: browserSupportsSpeechRecognition,
    start,
    stop,
    cleanup,
    isSupported: browserSupportsSpeechRecognition,
    transcript // Para debugging
  };
}

// Export por defecto
export default useReactSpeechWakeWord;

// También export nombrado por compatibilidad
export { useReactSpeechWakeWord };