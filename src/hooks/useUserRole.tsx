import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user';

interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export const useUserRole = () => {
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
          .select('role')
          .eq('user_id', user.id as any)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No role found, user is not assigned any role yet
            setUserRole('user');
          } else {
            setError(error.message);
          }
        } else {
          setUserRole((data as any).role);
        }
      } catch (err) {
        setError('Erro ao buscar role do usuário');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  const isModerator = (): boolean => {
    return userRole === 'moderator';
  };

  const hasAdminAccess = (): boolean => {
    return userRole === 'admin' || userRole === 'moderator';
  };

  return { 
    userRole, 
    loading, 
    error, 
    hasRole, 
    isAdmin, 
    isModerator,
    hasAdminAccess
  };
};