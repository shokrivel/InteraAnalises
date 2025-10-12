import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

export interface ConsultationField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date' | 'aglomerado' | 'file_upload' | 'imc';
  field_options?: any;
  required_for_levels: string[];
  visible_for_levels: string[];
  field_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useConsultationFields = () => {
  const [fields, setFields] = useState<ConsultationField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useProfile();

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_fields')
        .select('*')
        .eq('is_active', true as any)
        .order('field_order', { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        // Filter fields based on user's profile type
        const userProfileType = profile?.profile_type || 'patient';
        const visibleFields = (data as any[]).filter((field: any) => 
          field.visible_for_levels.includes(userProfileType)
        );
        setFields(visibleFields as unknown as ConsultationField[]);
        setError(null);
      }
    } catch (err) {
      setError('Erro ao buscar campos de consulta');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [profile?.profile_type]);

  const refetch = () => {
    fetchFields();
  };

  const isFieldRequired = (field: ConsultationField): boolean => {
    const userProfileType = profile?.profile_type || 'patient';
    return field.required_for_levels.includes(userProfileType);
  };

  return { 
    fields, 
    loading, 
    error, 
    refetch, 
    isFieldRequired,
    userProfileType: profile?.profile_type || 'patient'
  };
};