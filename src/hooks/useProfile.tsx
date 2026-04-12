import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  profile_type: 'patient' | 'academic' | 'health_professional';
  birth_date: string;
  address: string;
  city: string;
  zip_code?: string;
  enable_family_history?: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        setError(error.message);
      } else {
        setProfile(data as unknown as Profile);
        setError(null);
      }
    } catch (err) {
      setError('Erro ao buscar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Usar user.id como dependência (string estável) em vez do objeto user inteiro
  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetchProfile(user.id);
  }, [user?.id]);

  return { profile, loading, error, refetch: () => user?.id && fetchProfile(user.id) };
};
