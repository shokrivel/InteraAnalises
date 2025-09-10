import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

export const useRole = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setUserRole(data);
        }
      } catch (err) {
        setError('Erro ao buscar role do usuário');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = userRole?.role === 'admin';
  const isModerator = userRole?.role === 'moderator';
  const hasAdminAccess = isAdmin || isModerator;

  return { 
    userRole, 
    loading, 
    error, 
    isAdmin, 
    isModerator, 
    hasAdminAccess 
  };
};