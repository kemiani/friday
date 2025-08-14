// src/app/hooks/useOnboarding.ts
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export type OnboardingStep = 
  | 'welcome' 
  | 'name_collection'
  | 'voice_key_setup'
  | 'preferences'
  | 'completion';

export function useOnboarding() {
  const { user, updateUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    user?.onboarding_completed ? 'completion' : 'welcome'
  );
  const [onboardingData, setOnboardingData] = useState({
    preferredName: user?.preferred_name || '',
    gender: user?.gender || '',
    voiceKey: '',
    preferences: user?.preferences || {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOnboardingData = useCallback((data: any) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  }, []);

  const nextStep = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Guardar progreso en tabla users existente
      const stepNumber = {
        'welcome': 1,
        'name_collection': 2,
        'voice_key_setup': 3,
        'preferences': 4,
        'completion': 5
      }[currentStep];

      // Usar tu API existente de auth/update-profile
      await updateUserProfile({
        onboarding_step: stepNumber,
        preferred_name: onboardingData.preferredName,
        gender: onboardingData.gender,
        voice_key: onboardingData.voiceKey,
        preferences: onboardingData.preferences
      });

      // Log en audit_logs existente
      await fetch('/api/users/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action_type: 'profile_updated',
          resource_type: 'user',
          metadata: { onboarding_step: stepNumber }
        })
      });

      // Avanzar paso
      const steps: OnboardingStep[] = ['welcome', 'name_collection', 'voice_key_setup', 'preferences', 'completion'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en onboarding');
    } finally {
      setIsLoading(false);
    }
  }, [user, currentStep, onboardingData, updateUserProfile]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Marcar como completado usando API existente
      await updateUserProfile({
        onboarding_completed: true,
        onboarding_step: 100,
        pinecone_namespace: `user_${user.id}`,
        preferred_name: onboardingData.preferredName,
        gender: onboardingData.gender,
        preferences: onboardingData.preferences
      });

      // Inicializar memoria en Pinecone
      await fetch('/api/ai/initialize-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      setCurrentStep('completion');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error completando onboarding');
    } finally {
      setIsLoading(false);
    }
  }, [user, onboardingData, updateUserProfile]);

  return {
    currentStep,
    onboardingData,
    isLoading,
    error,
    updateOnboardingData,
    nextStep,
    completeOnboarding,
    setCurrentStep,
    needsOnboarding: !user?.onboarding_completed
  };
}