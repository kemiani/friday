// src/app/thirdweb/ThirdWebProvider.tsx
// FIXED: Removido import no usado
'use client';

import { ThirdwebProvider } from "thirdweb/react";
// REMOVED: import { client } from "./thirdweb"; - No se usa

export function AppThirdWebProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}