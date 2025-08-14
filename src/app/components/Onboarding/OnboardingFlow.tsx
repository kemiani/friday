// src/app/components/Onboarding/OnboardingFlow.tsx
'use client';

import { useOnboarding } from '../../hooks/useOnboarding';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function OnboardingFlow() {
  const { user } = useAuth();
  const { 
    currentStep, 
    onboardingData, 
    updateOnboardingData, 
    nextStep, 
    completeOnboarding,
    isLoading, 
    error,
    needsOnboarding 
  } = useOnboarding();
  
  const router = useRouter();

  // Si no necesita onboarding, redirigir
  if (!needsOnboarding) {
    router.push('/agent');
    return null;
  }

  // Renderizar pasos según currentStep
  // ... componentes de UI existentes ...
}