// src/app/page.tsx
// Landing page actualizada con autenticación

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from './hooks/useAuth';
import { CustomConnectButton } from './components/thirdweb/ConnectButton';
import { UserOnboarding } from './components/thirdweb/UserOnboarding';

export default function LandingPage() {
  const { user, isLoading, isAuthenticated, isNewUser } = useAuth();
  const [isClient, setIsClient] = useState(false);

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

  // Usuario autenticado y configurado - ir directo a JARVIS
  if (isAuthenticated && !isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-8">🤖</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            ¡Bienvenido de vuelta, {user?.name || 'Usuario'}!
          </h1>
          <p className="text-cyan-400 text-xl mb-8">
            JARVIS está listo para asistirte
          </p>
          <Link 
            href="/agent"
            className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full hover:scale-105 transition-transform"
          >
            Abrir JARVIS
          </Link>
        </div>
      </div>
    );
  }

  // Usuario no autenticado - mostrar landing page
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
          <CustomConnectButton
            className="px-12 py-4 text-xl font-semibold rounded-full transition-all duration-300 hover:scale-110"
          />
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