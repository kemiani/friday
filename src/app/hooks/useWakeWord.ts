'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';

type UseWakeWordOpts = {
  accessKey: string;
  keywordPath?: string;
  onWake: () => void;
  onError?: (error: Error) => void;
};

export function useWakeWord({
  accessKey,
  keywordPath = '/keywords/jarvis.ppn',
  onWake,
  onError
}: UseWakeWordOpts) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    keywordDetection,
    isLoaded,
    isListening,
    error: porcupineError,
    init,
    start,
    stop,
    release,
  } = usePorcupine();

  const porcupineKeyword = {
    publicPath: keywordPath,
    label: 'jarvis'
  };

  const porcupineModel = {
  publicPath: '/porcupine_params_es.pv'
};
  // Inicializar Porcupine
  useEffect(() => {
    if (accessKey && !isInitialized) {
      init(accessKey, porcupineKeyword, porcupineModel)
        .then(() => {
          setIsInitialized(true);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : String(err));
        });
    }
  }, [accessKey, isInitialized, init]);

  // Detección del wake word
  useEffect(() => {
    if (keywordDetection && keywordDetection.label === 'jarvis') {
      stop().finally(() => {
        onWake();
      });
    }
  }, [keywordDetection, stop, onWake]);

  // Errores de Porcupine
  useEffect(() => {
    if (porcupineError) {
      setError(String(porcupineError));
      try {
        onError?.(new Error(String(porcupineError)));
      } catch {
        /* ignorar */
      }
    }
  }, [porcupineError, onError]);

  // Iniciar escucha
  const startListening = useCallback(async () => {
    if (!isLoaded || !isInitialized) return;
    try {
      await start();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [isLoaded, isInitialized, start]);

  // Detener escucha
  const stopListening = useCallback(async () => {
    try {
      await stop();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [stop]);

  // Limpiar recursos
  const cleanup = useCallback(async () => {
    try {
      await release();
    } catch {
      /* ignorar */
    }
    setIsInitialized(false);
  }, [release]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    listening: isListening,
    loading: !isLoaded || !isInitialized,
    error,
    isReady: isLoaded && isInitialized,
    start: startListening,
    stop: stopListening,
    cleanup
  };
}
