// ===============================================
// 3. WAKE WORD ULTRA-RESPONSIVO
// src/app/hooks/useReactSpeechWakeWord.ts (VERSIÓN 2.0)
// ===============================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

type UseReactSpeechWakeWordOpts = {
  wakeWords?: string[];
  language?: string;
  onWake: () => void;
  onError?: (error: Error) => void;
};

function useReactSpeechWakeWord({
  wakeWords = ['jarvis'],
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

  const lastDetectionRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const confidenceBoostRef = useRef<number>(0);

  // OPTIMIZACIÓN 1: Detección ultra-agresiva
  useEffect(() => {
    if (transcript && !isProcessingRef.current) {
      const now = Date.now();
      const lowerTranscript = transcript.toLowerCase().trim();
      
      // Debounce de solo 200ms
      if (now - lastDetectionRef.current < 50) return;
      
      console.log('🎤 Audio:', lowerTranscript);
      
      // OPTIMIZACIÓN 2: Múltiples estrategias de detección
      const detected = wakeWords.some(word => {
        const cleanWord = word.toLowerCase();
        
        // Estrategia 1: Coincidencia exacta
        if (lowerTranscript.includes(cleanWord)) return true;
        
        // Estrategia 2: Coincidencia fonética (para español)
        if (cleanWord === 'jarvis') {
          const phonetic = ['jarvis', 'harvey', 'harvis', 'jarbi', 'jarbi'];
          return phonetic.some(p => lowerTranscript.includes(p));
        }
        
        // Estrategia 3: Coincidencia por sílabas
        if (lowerTranscript.includes('jar') && lowerTranscript.includes('vis')) return true;
        
        return false;
      });
      
      // OPTIMIZACIÓN 3: Sistema de confianza progresiva
      if (detected) {
        confidenceBoostRef.current++;
        console.log(`🎯 DETECCIÓN (confianza: ${confidenceBoostRef.current})`);
        
        // Activar inmediatamente en primera detección clara
        if (lowerTranscript.includes('jarvis') || confidenceBoostRef.current >= 1) {
          console.log('⚡ ACTIVACIÓN INMEDIATA');
          isProcessingRef.current = true;
          lastDetectionRef.current = now;
          confidenceBoostRef.current = 0;
          
          onWake();
          resetTranscript();
          SpeechRecognition.stopListening();
          
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 500);
        }
      } else {
        // Resetear confianza si no hay detección
        confidenceBoostRef.current = Math.max(0, confidenceBoostRef.current - 1);
      }
    }
  }, [transcript, wakeWords, onWake, resetTranscript]);

  // OPTIMIZACIÓN 4: Restart inmediato y continuo
  useEffect(() => {
    if (browserSupportsSpeechRecognition && !listening && !isProcessingRef.current) {
      const restartTimer = setTimeout(() => {
        console.log('🔄 Auto-restart inmediato');
        start();
      }, 50); // Restart en 50ms
      
      return () => clearTimeout(restartTimer);
    }
  }, [listening, browserSupportsSpeechRecognition]);

  const start = useCallback(() => {
    if (!browserSupportsSpeechRecognition || isProcessingRef.current || listening) {
      return;
    }

    // OPTIMIZACIÓN 5: Configuración más agresiva
    SpeechRecognition.startListening({
      continuous: true,
      language: language,
      interimResults: true,
    });
    
    console.log('🔊 Wake word ULTRA-RESPONSIVO activo');
  }, [browserSupportsSpeechRecognition, language, listening]);

  const stop = useCallback(() => {
    SpeechRecognition.stopListening();
    isProcessingRef.current = false;
    confidenceBoostRef.current = 0;
  }, []);

  return {
    listening,
    loading: false,
    error: browserSupportsSpeechRecognition ? null : 'No compatible',
    isReady: browserSupportsSpeechRecognition,
    start,
    stop,
    cleanup: stop,
    isSupported: browserSupportsSpeechRecognition,
    transcript
  };
}

export default useReactSpeechWakeWord;