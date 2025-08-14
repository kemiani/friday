// src/app/hooks/useAuth.ts
// Hook personalizado para manejar autenticación

'use client';

import { useActiveAccount, useActiveWallet, useConnect, useDisconnect } from "thirdweb/react";
import { useEffect, useState } from "react";
import { wallets } from "../thirdweb/thirdweb";

export type UserProfile = {
  id: string;
  wallet_address?: string;
  auth_method: 'wallet' | 'google' | 'email' | 'telegram' | 'discord' | 'x' | 'phone';
  name?: string;
  email?: string;
  avatar_url?: string;
  voice_key?: string;
  created_at: string;
  updated_at: string;
  tier: 'free' | 'pro' | 'business';
  is_new_user: boolean;
};

export function useAuth() {
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detectar cuando se conecta/desconecta wallet
  useEffect(() => {
    if (activeAccount?.address) {
      loadUserProfile(activeAccount.address);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [activeAccount?.address]);

  const loadUserProfile = async (address: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar usuario en Supabase
      const response = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet_address: address,
          auth_method: getAuthMethod()
        })
      });

      if (response.ok) {
        const profile = await response.json();
        setUser(profile);
      } else if (response.status === 404) {
        // Usuario nuevo - crear perfil
        await createNewUser(address);
      } else {
        throw new Error('Error cargando perfil');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error en loadUserProfile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewUser = async (address: string) => {
    try {
      const authMethod = getAuthMethod();
      const walletInfo = await getWalletInfo();

      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          auth_method: authMethod,
          email: walletInfo?.email,
          name: walletInfo?.name,
          avatar_url: walletInfo?.avatar
        })
      });

      if (response.ok) {
        const newUser = await response.json();
        setUser({ ...newUser, is_new_user: true });
      } else {
        throw new Error('Error creando usuario');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando usuario');
    }
  };

  const getAuthMethod = (): UserProfile['auth_method'] => {
    if (!activeWallet) return 'wallet';
    
    const walletId = activeWallet.id;
    
    if (walletId.includes('inApp')) {
      // Determinar método específico del inApp wallet
      // Esto requiere acceso a los detalles de autenticación
      return 'email'; // Por defecto, luego refinamos
    }
    
    return 'wallet';
  };

  const getWalletInfo = async () => {
    try {
      if (activeWallet?.id.includes('inApp')) {
        // Obtener info del usuario autenticado
        // Esto depende de cómo ThirdWeb v5 expone la info del usuario
        return {
          email: undefined, // Se obtiene del wallet conectado
          name: undefined,
          avatar: undefined
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const connectWallet = async (walletId?: string) => {
    try {
      setError(null);
      
      if (walletId) {
        const wallet = wallets.find(w => w.id === walletId) || wallets[0];
        await connect(async () => wallet);
      } else {
        await connect(async () => wallets[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error conectando wallet');
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect(activeWallet!);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconectando');
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...updates
        })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
      } else {
        throw new Error('Error actualizando perfil');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando');
    }
  };

  return {
    // Estados
    user,
    isLoading,
    error,
    isAuthenticated: !!user && !!activeAccount,
    isNewUser: user?.is_new_user || false,
    
    // Acciones
    connectWallet,
    disconnectWallet,
    updateUserProfile,
    
    // Info de wallet
    activeAccount,
    activeWallet,
    walletAddress: activeAccount?.address
  };
}