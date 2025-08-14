// src/app/page.tsx
// Landing page actualizada con wake word global - CORREGIDA

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './hooks/useAuth';
import { useGlobalWakeWord } from './hooks/useGlobalWakeWord';
import { CustomConnectButton } from './components/thirdweb/ConnectButton';
import { UserOnboarding } from './components/thirdweb/UserOnboarding';

export default function LandingPage() {
  const { user, isLoading, isAuthenticated, isNewUser } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [showWakeIndicator, setShowWakeIndicator] = useState(false);

  // Wake word global - solo para usuarios autenticados
  const { 
    listening: wakeListening, 
    error: wakeError,
    enabled: wakeEnabled
  } = useGlobalWakeWord({
    enabled: isClient && isAuthenticated && !isNewUser,
    onWakeDetected: () => {
      setShowWakeIndicator(true);
      setTimeout(() => setShowWakeIndicator(false), 2000);
    }
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Loading state
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Inicializando J.A.R.V.I.S.
          </h2>
          <p className="text-cyan-400 text-lg">
            Conectando sistemas...
          </p>
        </div>
      </div>
    );
  }

  // Usuario autenticado pero nuevo - mostrar onboarding
  if (isAuthenticated && isNewUser) {
    return <UserOnboarding user={user!} />;
  }

  // Usuario autenticado y configurado - mostrar página de bienvenida con wake word
  if (isAuthenticated && !isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden relative">
        {/* Efectos de fondo */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Indicador de Wake Word */}
        {wakeEnabled && (
          <div className="absolute top-6 right-6 z-20">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
              wakeListening 
                ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300' 
                : 'bg-slate-800/50 border-slate-600/50 text-slate-400'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                wakeListening ? 'bg-yellow-400 animate-pulse' : 'bg-slate-500'
              }`}></div>
              <span className="text-sm font-medium">
                {wakeListening ? 'Escuchando "Jarvis"...' : 'Wake Word Activo'}
              </span>
            </div>
          </div>
        )}

        {/* Indicador de activación */}
        {showWakeIndicator && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/50 rounded-2xl px-8 py-4 text-center animate-pulse">
              <div className="text-4xl mb-2">🚀</div>
              <p className="text-cyan-300 text-lg font-semibold">
                Activando JARVIS...
              </p>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
          {/* Usuario Info */}
          <div className="absolute top-6 left-6">
            <div className="flex items-center gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-2">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-white font-medium">
                {user?.name || 'Usuario'}
              </span>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                {user?.tier?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bienvenida personalizada */}
          <div className="text-center mb-16 group">
            <h1 className="text-6xl md:text-8xl font-black tracking-wider mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
              ¡Hola, {user?.name}!
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
              <span className="text-cyan-400 font-medium">J.A.R.V.I.S.</span> está listo para asistirte
              <br />
              <span className="text-sm text-slate-400 mt-2 block">
                {wakeEnabled 
                  ? 'Di "Jarvis" para activar o haz clic en el botón' 
                  : 'Haz clic en el botón para activar'
                }
              </span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl">
            <Link 
              href="/agent"
              className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎤</div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Hablar con JARVIS</h3>
              <p className="text-slate-400 text-sm">Activar asistente de voz</p>
            </Link>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Mis Contactos</h3>
              <p className="text-slate-400 text-sm">Gestionar contactos y llamadas</p>
            </div>
            
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Configuración</h3>
              <p className="text-slate-400 text-sm">Preferencias y seguridad</p>
            </div>
          </div>

          {/* Main Action Button */}
          <div className="relative group">
            <Link
              href="/agent"
              className="inline-block px-12 py-4 text-xl font-semibold rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              🚀 Activar JARVIS
            </Link>
          </div>

          {/* Wake Word Error */}
          {wakeError && (
            <div className="mt-6 bg-red-500/20 border border-red-400/50 rounded-lg px-4 py-2">
              <p className="text-red-300 text-sm">
                Error en wake word: {wakeError}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Usuario no autenticado - mostrar landing page original
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 text-white overflow-hidden relative">
      {/* Efectos de fondo */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo/Title */}
        <div className="text-center mb-16 group">
          <h1 className="text-8xl md:text-9xl font-black tracking-wider mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
            J.A.R.V.I.S.
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
            <span className="text-cyan-400 font-medium">Just A Rather Very Intelligent System</span>
            <br />
            Tu asistente de IA de próxima generación
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl">
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-4">🎤</div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Comando de Voz</h3>
            <p className="text-slate-400 text-sm">Actívalo con "Jarvis" y habla naturalmente</p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Pagos Crypto</h3>
            <p className="text-slate-400 text-sm">Gestiona facturas y pagos en stablecoins</p>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Agente Personal</h3>
            <p className="text-slate-400 text-sm">Puede hacer llamadas y enviar emails</p>
          </div>
        </div>

        {/* Connect Button */}
        <div className="relative group">
          <CustomConnectButton/>
        </div>

        {/* Subtitle */}
        <p className="text-slate-500 text-sm mt-8 text-center max-w-md">
          Conecta tu wallet para comenzar
          <br />
          <span className="text-cyan-400">Compatible con MetaMask, Coinbase Wallet y más</span>
        </p>
      </div>
    </div>
  );
}