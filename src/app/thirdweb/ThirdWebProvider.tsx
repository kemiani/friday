// src/app/thirdweb/ThirdWebProvider.tsx
'use client';

import { ThirdwebProvider } from "thirdweb/react";
import { client } from "./thirdweb";

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