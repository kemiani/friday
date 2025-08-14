// src/app/components/thirdweb/ConnectButton.tsx
// Botón de conexión personalizado - CORREGIDO

'use client';

import { ConnectButton } from "thirdweb/react";
import { client, wallets } from "../../thirdweb/thirdweb";

type ConnectButtonProps = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  // REMOVED: className no se usa, así que lo quitamos del tipo
};

export function CustomConnectButton({ 
  onConnect, 
  onDisconnect
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