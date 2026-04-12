import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Painel Admin — separado visualmente para área restrita
export default function AdminResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('exam_results')
      .select('*, profiles:patient_id(name)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setResults(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header admin com faixa vermelha distintiva */}
      <header className="bg-red-700 text-white px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🔒</span>
            <span className="font-bold">PAINEL ADMINISTRATIVO — InteraAnalises</span>
            <span className="bg-red-900 text-red-100 text-xs px-2 py-0.5 rounded">ÁREA RESTRITA</span>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link to="/admin" className="text-red-200 hover:text-white font-medium">Resultados</Link>
            <Link to="/admin/users" className="text-red-200 hover:text-white">Usuários</Link>
            <Link to="/app" className="text-red-300 hover:text-white">← Área do paciente</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Todos os Resultados</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="space-y-3">
            {results.map(r => (
              <Card key={r.id}>
                <CardContent className="py-3 flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-28">
                    {new Date(r.result_date).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-sm font-medium">{(r.profiles as any)?.name || 'Sem nome'}</span>
                  <span className="text-xs font-mono text-muted-foreground truncate flex-1">{r.result_value}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'normal' ? 'bg-green-100 text-green-700' :
                    r.status === 'alterado' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{r.status}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
