// src/app/components/ConnectButton.tsx
// Botón de conexión personalizado

'use client';

import { ConnectButton } from "thirdweb/react";
import { client, wallets } from "../../thirdweb/thirdweb";

type ConnectButtonProps = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
};

export function CustomConnectButton({ 
  onConnect, 
  onDisconnect, 
  className = "" 
}: ConnectButtonProps) {
  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      connectModal={{ 
        size: "compact",
        title: "Conectar a JARVIS",
        showThirdwebBranding: false
      }}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
    />
  );
}