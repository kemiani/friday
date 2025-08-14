// ===============================================
// 3. WAKE WORD ULTRA-RESPONSIVO (con cooldown real)
// src/app/hooks/useReactSpeechWakeWord.ts (VERSIÓN 2.1)
// ===============================================

'use client';

import { useEffect, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

type UseReactSpeechWakeWordOpts = {
  wakeWords?: string[];
  language?: string;
  onWake: () => void;
  onError?: (error: Error) => void;
  /** Nuevo: deshabilita totalmente el hook sin desmontarlo */
  enabled?: boolean;
  /** Nuevo: cooldown tras activación (ms) para evitar dobles disparos */
  cooldownMs?: number;
};

function useReactSpeechWakeWord({
  wakeWords = ['jarvis'],
  language = 'es-ES',
  onWake,
  onError,
  enabled = true,
  cooldownMs = 1500
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
  const restartNotBeforeRef = useRef<number>(0); // para evitar restart inmediato post-activación

  const start = useCallback(() => {
    if (!browserSupportsSpeechRecognition || isProcessingRef.current || listening || !enabled) return;

    try {
      SpeechRecognition.startListening({
        continuous: true,
        language,
        interimResults: true,
      });
      // console.log('🔊 Wake word activo');
    } catch (e) {
      onError?.(e as Error);
    }
  }, [browserSupportsSpeechRecognition, language, listening, enabled, onError]);

  const stop = useCallback(() => {
    try {
      SpeechRecognition.stopListening();
    } finally {
      isProcessingRef.current = false;
      confidenceBoostRef.current = 0;
    }
  }, []);

  // Detección con cooldown y guardas
  useEffect(() => {
    if (!enabled) return;
    if (!transcript || isProcessingRef.current) return;

    const now = Date.now();
    const lowerTranscript = transcript.toLowerCase().trim();

    // Debounce de transcript muy rápido
    if (now - lastDetectionRef.current < 80) return;

    // Evitar re-activación dentro del cooldown global
    if (now < restartNotBeforeRef.current) return;

    // console.log('🎤 Chunk:', lowerTranscript);

    const detected = wakeWords.some(word => {
      const cleanWord = word.toLowerCase();
      if (lowerTranscript.includes(cleanWord)) return true;

      // Fonética española básica para "jarvis"
      if (cleanWord === 'jarvis') {
        const phonetic = ['jarvis', 'harvey', 'harvis', 'jarbi', 'yarvis', 'yarbi'];
        if (phonetic.some(p => lowerTranscript.includes(p))) return true;
        if (lowerTranscript.includes('jar') && lowerTranscript.includes('vis')) return true;
      }
      return false;
    });

    lastDetectionRef.current = now;

    if (detected) {
      confidenceBoostRef.current++;

      // Disparo inmediato en primera detección clara
      if (lowerTranscript.includes('jarvis') || confidenceBoostRef.current >= 1) {
        isProcessingRef.current = true;

        // Cooldown global: bloquea nuevas activaciones un rato
        restartNotBeforeRef.current = now + cooldownMs;

        try {
          onWake();
        } catch (e) {
          onError?.(e as Error);
        } finally {
          resetTranscript();
          stop(); // frena micrófono para cortar la ráfaga de interimResults
          // Rehabilitar el procesamiento tras un breve margen
          setTimeout(() => {
            isProcessingRef.current = false;
          }, Math.max(500, Math.floor(cooldownMs * 0.5)));
        }
      }
    } else {
      // Baja progresiva de "confianza"
      confidenceBoostRef.current = Math.max(0, confidenceBoostRef.current - 1);
    }
  }, [transcript, wakeWords, onWake, resetTranscript, stop, enabled, cooldownMs, onError]);

  // Restart controlado del micrófono
  useEffect(() => {
    if (!enabled) {
      // Si se deshabilita, paramos
      if (listening) stop();
      return;
    }

    if (browserSupportsSpeechRecognition && !listening && !isProcessingRef.current) {
      const now = Date.now();
      const delay = Math.max(60, restartNotBeforeRef.current - now); // espera hasta que venza el cooldown
      const t = setTimeout(() => {
        start();
      }, delay);
      return () => clearTimeout(t);
    }
  }, [listening, browserSupportsSpeechRecognition, start, stop, enabled]);

  return {
    listening: enabled && listening,
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
