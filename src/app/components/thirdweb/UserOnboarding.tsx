// src/app/components/thirdweb/UserOnboarding.tsx
// Componente de onboarding para usuarios nuevos - CORREGIDO

'use client';

import { useState } from 'react';
import { useAuth, type UserProfile } from '../../hooks/useAuth';

type OnboardingStep = 'welcome' | 'name' | 'voice-key' | 'complete';

// FIXED: Agregado tipo UserProfile importado de useAuth
export function UserOnboarding({ user }: { user: UserProfile }) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [userData, setUserData] = useState({
    name: '',
    voiceKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { updateUserProfile } = useAuth();

  const handleNameSubmit = () => {
    if (userData.name.trim()) {
      setStep('voice-key');
    }
  };

  const handleVoiceKeySubmit = async () => {
    if (userData.voiceKey.trim()) {
      setIsLoading(true);
      try {
        await updateUserProfile({
          name: userData.name,
          voice_key: userData.voiceKey
        });
        setStep('complete');
      } catch (error) {
        console.error('Error actualizando perfil:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleComplete = () => {
    window.location.href = '/agent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-md bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-8 text-center">
        
        {step === 'welcome' && (
          <>
            <div className="text-6xl mb-6">👋</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              ¡Bienvenido a JARVIS!
            </h2>
            <p className="text-slate-300 mb-8">
              Vamos a configurar tu asistente personal en unos simples pasos.
            </p>
            <button
              onClick={() => setStep('name')}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              Comenzar Configuración
            </button>
          </>
        )}

        {step === 'name' && (
          <>
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              ¿Cómo prefieres que te llame?
            </h2>
            <p className="text-slate-400 mb-6">
              JARVIS usará este nombre para dirigirse a ti
            </p>
            <input
              type="text"
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              placeholder="Tu nombre o apodo"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 mb-6"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
            <button
              onClick={handleNameSubmit}
              disabled={!userData.name.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </>
        )}

        {step === 'voice-key' && (
          <>
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Clave de Seguridad por Voz
            </h2>
            <p className="text-slate-400 mb-6">
              Di una frase secreta para acciones importantes como pagos
            </p>
            <input
              type="password"
              value={userData.voiceKey}
              onChange={(e) => setUserData({ ...userData, voiceKey: e.target.value })}
              placeholder="Ej: villa del mar 2024"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 mb-6"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleVoiceKeySubmit()}
            />
            <button
              onClick={handleVoiceKeySubmit}
              disabled={!userData.voiceKey.trim() || isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Configurando...' : 'Finalizar Configuración'}
            </button>
          </>
        )}

        {step === 'complete' && (
          <>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              ¡Todo Listo!
            </h2>
            <p className="text-slate-300 mb-8">
              {userData.name}, tu JARVIS personal está configurado y listo para usar.
            </p>
            <button
              onClick={handleComplete}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              Abrir JARVIS
            </button>
          </>
        )}
      </div>
    </div>
  );
}