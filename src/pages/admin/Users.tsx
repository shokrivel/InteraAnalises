import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setUsers(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔒</span>
            <span className="font-bold">PAINEL ADMINISTRATIVO — Usuários</span>
            <span className="bg-red-900 text-red-100 text-xs px-2 py-0.5 rounded">ÁREA RESTRITA</span>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/admin" className="text-red-200 hover:text-white">Resultados</Link>
            <Link to="/admin/users" className="text-red-200 hover:text-white font-medium">Usuários</Link>
            <Link to="/app" className="text-red-300 hover:text-white">← Área do paciente</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">👥 Gerenciamento de Usuários</h2>
        <p className="text-sm text-muted-foreground mb-4">{users.length} usuário(s) cadastrado(s)</p>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="space-y-2">
            {users.map(u => (
              <Card key={u.id}>
                <CardContent className="py-3 flex items-center gap-4">
                  <span className="text-sm font-medium w-48 truncate">{u.name || 'Sem nome'}</span>
                  <span className="text-xs text-muted-foreground flex-1">{u.user_id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.user_roles?.role === 'admin' ? 'bg-red-100 text-red-700' :
                    u.user_roles?.role === 'moderator' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {u.user_roles?.role || 'paciente'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
