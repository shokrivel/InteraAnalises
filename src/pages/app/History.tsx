import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type HistoryItem = {
  id: string;
  exam_type_id: string | null;
  result_value: string;
  result_date: string;
  status: string;
};

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('exam_results')
      .select('id, exam_type_id, result_value, result_date, status')
      .eq('patient_id', user.id)
      .order('result_date', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setHistory((data as HistoryItem[]) || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm"><Link to="/app">← Dashboard</Link></Button>
        <h1 className="text-xl font-bold">📄 Histórico de Exames</h1>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground">Nenhum histórico encontrado.</p>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <Card key={h.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="text-sm">{new Date(h.result_date).toLocaleDateString('pt-BR')}</span>
                  <span className="text-xs font-mono text-muted-foreground truncate max-w-xs">{h.result_value}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    h.status === 'normal' ? 'bg-green-100 text-green-700' :
                    h.status === 'alterado' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{h.status}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
