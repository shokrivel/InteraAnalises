import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type ExamResult = {
  id: string;
  exam_type_id: string | null;
  result_value: string;
  result_date: string;
  status: string;
  ai_interpretation: string | null;
  created_at: string;
};

export default function Results() {
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('exam_results')
      .select('*')
      .eq('patient_id', user.id)
      .order('result_date', { ascending: false })
      .then(({ data }) => {
        setResults((data as ExamResult[]) || []);
        setLoading(false);
      });
  }, [user]);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      normal: 'bg-green-100 text-green-800',
      alterado: 'bg-yellow-100 text-yellow-800',
      critico: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm"><Link to="/app">← Dashboard</Link></Button>
        <h1 className="text-xl font-bold">🧪 Resultados de Exames</h1>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-4xl mb-4">📄</p>
              <p className="text-muted-foreground">Nenhum resultado cadastrado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map(r => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{new Date(r.result_date).toLocaleDateString('pt-BR')}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">{r.result_value}</p>
                  {r.ai_interpretation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 mb-1">🤖 Interpretação IA</p>
                      <p className="text-sm text-blue-900">{r.ai_interpretation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
