
-- Criar política RLS para permitir que a função log_profile_access insira logs
-- Esta política permite que usuários autenticados insiram logs de acesso
CREATE POLICY "Allow authenticated users to insert access logs"
ON public.profile_access_logs
FOR INSERT
TO authenticated
WITH CHECK (accessed_by = auth.uid());

-- Comentário: Esta política permite que usuários autenticados registrem seus próprios acessos
-- Funciona em conjunto com a função log_profile_access que é SECURITY DEFINER
