import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Rate limiting: max 5 tentativas em 5 minutos
const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getAttempts(): { count: number; windowStart: number } {
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : { count: 0, windowStart: Date.now() };
  } catch {
    return { count: 0, windowStart: Date.now() };
  }
}

function recordAttempt() {
  const attempts = getAttempts();
  const now = Date.now();
  if (now - attempts.windowStart > LOGIN_WINDOW_MS) {
    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 1, windowStart: now }));
  } else {
    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ ...attempts, count: attempts.count + 1 }));
  }
}

function isRateLimited(): boolean {
  const attempts = getAttempts();
  const now = Date.now();
  if (now - attempts.windowStart > LOGIN_WINDOW_MS) return false;
  return attempts.count >= MAX_ATTEMPTS;
}

// Sanitização XSS básica
function sanitize(input: string): string {
  return input.replace(/[<>"'&]/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;',
  }[char] || char));
}

// Validação de senha forte
export function validatePassword(password: string): { valid: boolean; score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;
  if (password.length >= 8) score++; else feedback.push('Mínimo 8 caracteres');
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++; else feedback.push('Uma letra maiúscula');
  if (/[a-z]/.test(password)) score++; else feedback.push('Uma letra minúscula');
  if (/[0-9]/.test(password)) score++; else feedback.push('Um número');
  if (/[^A-Za-z0-9]/.test(password)) score++; else feedback.push('Um caractere especial');
  return { valid: score >= 4, score, feedback };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isRateLimited()) {
      return { error: { message: 'Muitas tentativas. Aguarde 5 minutos.' } };
    }
    recordAttempt();
    const cleanEmail = sanitize(email.trim().toLowerCase());
    return supabase.auth.signInWithPassword({ email: cleanEmail, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const { valid } = validatePassword(password);
    if (!valid) return { error: { message: 'Senha não atende aos requisitos mínimos.' } };
    const cleanEmail = sanitize(email.trim().toLowerCase());
    const cleanName = name ? sanitize(name.trim()) : undefined;
    return supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName } },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  }, []);

  return { user, session, loading, signIn, signUp, signOut };
}
