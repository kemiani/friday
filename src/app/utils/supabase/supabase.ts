// src/app/utils/supabase/supabase.ts
// Cliente de Supabase con tipos completamente corregidos

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Service key para backend

export const supabase = createClient(supabaseUrl, supabaseKey);

// Tipos TypeScript - COMPLETAMENTE CORREGIDOS
export type UserTier = 'free' | 'pro' | 'business';
export type AuthMethod = 'wallet' | 'google' | 'email' | 'telegram' | 'discord' | 'x' | 'phone';

export interface User {
  id: string;
  wallet_address?: string;
  auth_method: AuthMethod;
  name?: string;
  email?: string;
  avatar_url?: string;
  voice_key_hash?: string;
  tier: UserTier;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface UserContact {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  relationship: 'family' | 'friend' | 'colleague' | 'business' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JarvisSession {
  id: string;
  user_id: string;
  session_token: string;
  status: 'active' | 'ended' | 'error' | 'timeout';
  platform: 'web' | 'mobile' | 'desktop';
  user_agent?: string;
  ip_address?: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
  total_cost_usd: number;
  total_tokens_used: number;
  metadata: Record<string, any>;
}

export interface ConversationHistory {
  id: string;
  user_id: string;
  session_id: string;
  timestamp: string;
  message_type: 'user' | 'assistant' | 'system' | 'function_call' | 'error';
  content: string;
  tokens_used: number;
  processing_time_ms: number;
  context: Record<string, any>;
}

export interface UserLimits {
  id: string;
  user_id: string;
  daily_minutes_used: number;
  monthly_calls_used: number;
  monthly_cost_usd: number;
  daily_limit: number;
  monthly_limit: number;
  monthly_cost_limit: number;
  reset_strategy: 'daily' | 'monthly' | 'weekly';
  last_reset_date: string;
  created_at: string;
  updated_at: string;
}

export interface PhoneCall {
  id: string;
  user_id: string;
  session_id?: string;
  contact_id?: string;
  phone_number: string;
  call_type: 'outbound' | 'inbound';
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no_answer';
  initial_message?: string;
  conversation_summary?: string;
  user_listened: boolean;
  initiated_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds: number;
  cost_usd: number;
  external_call_id?: string;
  agent_session_id?: string;
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action_type: 'user_created' | 'profile_updated' | 'voice_key_set' | 'payment_initiated' | 'call_made' | 'session_started' | 'limit_exceeded' | 'security_violation';
  resource_type: 'user' | 'session' | 'call' | 'payment' | 'contact' | 'limit';
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Funciones helper para tipos
export function isValidUserTier(tier: string): tier is UserTier {
  return ['free', 'pro', 'business'].includes(tier);
}

export function isValidAuthMethod(method: string): method is AuthMethod {
  return ['wallet', 'google', 'email', 'telegram', 'discord', 'x', 'phone'].includes(method);
}

// Default values
export const DEFAULT_USER_LIMITS: Omit<UserLimits, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  daily_minutes_used: 0,
  monthly_calls_used: 0,
  monthly_cost_usd: 0,
  daily_limit: 60, // 1 hora gratis
  monthly_limit: 100, // 100 llamadas gratis
  monthly_cost_limit: 50, // $50 USD límite
  reset_strategy: 'daily',
  last_reset_date: new Date().toISOString().split('T')[0]
};

export const TIER_FEATURES = {
  free: {
    daily_minutes: 60,
    monthly_calls: 100,
    voice_calls: false,
    email_integration: false,
    priority_support: false
  },
  pro: {
    daily_minutes: 300,
    monthly_calls: 1000,
    voice_calls: true,
    email_integration: true,
    priority_support: false
  },
  business: {
    daily_minutes: -1, // unlimited
    monthly_calls: -1, // unlimited
    voice_calls: true,
    email_integration: true,
    priority_support: true
  }
} as const;

// Funciones de utilidad
export function getUserTierFeatures(tier: UserTier) {
  return TIER_FEATURES[tier];
}

export function canUserAccess(user: User | null, feature: keyof typeof TIER_FEATURES.free): boolean {
  if (!user) return false;
  
  const features = getUserTierFeatures(user.tier);
  return features[feature] !== false;
}

// Helper para crear usuario
export function createUserData(userData: Partial<User>): Omit<User, 'id' | 'created_at' | 'updated_at'> {
  return {
    wallet_address: userData.wallet_address,
    auth_method: userData.auth_method || 'wallet',
    name: userData.name,
    email: userData.email,
    avatar_url: userData.avatar_url,
    voice_key_hash: userData.voice_key_hash,
    tier: userData.tier || 'free',
    is_active: userData.is_active ?? true
  };
}