import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { if (data) setName((data as any).name || ''); });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, name: name.trim() });
    setLoading(false);
    if (error) toast.error('Erro ao salvar: ' + error.message);
    else toast.success('Perfil atualizado!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm"><Link to="/app">← Dashboard</Link></Button>
        <h1 className="text-xl font-bold">👤 Meu Perfil</h1>
      </header>
      <main className="max-w-lg mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>Informações pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-mail</label>
              <Input value={user?.email || ''} disabled className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="mt-1"
              />
            </div>
            <Button onClick={save} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
            <Button variant="outline" className="w-full" onClick={signOut}>Sair da conta</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
