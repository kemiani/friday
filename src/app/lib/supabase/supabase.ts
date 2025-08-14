// src/app/lib/supabase/supabase.ts
// Cliente de Supabase

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Service key para backend

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos TypeScript
export type User = {
  id: string;
  wallet_address?: string;
  auth_method: 'wallet' | 'google' | 'email' | 'telegram' | 'discord' | 'x' | 'phone';
  name?: string;
  email?: string;
  avatar_url?: string;
  voice_key_hash?: string;
  tier: 'free' | 'pro' | 'business';
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type UserContact = {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: 'family' | 'friend' | 'colleague' | 'business' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
};