// src/app/layout.tsx
// Layout principal con ThirdWeb Provider

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppThirdWebProvider } from "./thirdweb/ThirdWebProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "J.A.R.V.I.S. - AI Voice Assistant",
  description: "Just A Rather Very Intelligent System - Tu asistente de IA de próxima generación con comando de voz y respuesta en tiempo real.",
  keywords: ["JARVIS", "AI", "Voice Assistant", "ThirdWeb", "Blockchain", "Crypto"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white overflow-x-hidden`}
        suppressHydrationWarning
      >
        <AppThirdWebProvider>
          {children}
        </AppThirdWebProvider>
      </body>
    </html>
  );
}