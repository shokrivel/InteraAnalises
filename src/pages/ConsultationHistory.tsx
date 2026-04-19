import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, MessageSquare, ChevronDown, ChevronUp, Download, RotateCcw, Filter } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import ReopenConsultationModal from '@/components/consultation/ReopenConsultationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConsultationRecord {
  id: string; symptoms: string[] | null; symptom_duration: number | null;
  family_symptoms: boolean | null; exam_results: any; epidemiological_info: any;
  ai_response: string | null; created_at: string | null; attachments?: any;
  consulta_original_id?: string | null; status?: string;
}

const ConsultationHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reopenOpen, setReopenOpen] = useState(false);
  const [selected, setSelected] = useState<ConsultationRecord | null>(null);
  const PER_PAGE = 5;

  useEffect(() => { if (!authLoading && !roleLoading && user) fetch(); }, [user, authLoading, roleLoading, isAdmin]);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from('consultation_history').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('user_id', user.id as any);
      const { data, error } = await q;
      if (error) toast({ title: 'Erro ao carregar histórico', variant: 'destructive' });
      else setRecords((data || []) as unknown as ConsultationRecord[]);
    } catch { toast({ title: 'Erro inesperado', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const byPeriod = (r: ConsultationRecord[]) => {
    if (period === 'all') return r;
    const cut = new Date();
    if (period === 'week') cut.setDate(cut.getDate() - 7);
    if (period === 'month') cut.setMonth(cut.getMonth() - 1);
    if (period === 'quarter') cut.setMonth(cut.getMonth() - 3);
    if (period === 'year') cut.setFullYear(cut.getFullYear() - 1);
    return r.filter(x => x.created_at && new Date(x.created_at) >= cut);
  };

  const filtered = byPeriod(records).filter(r =>
    r.symptoms?.some(s => typeof s === 'string' && s.toLowerCase().includes(search.toLowerCase())) ||
    (typeof r.ai_response === 'string' && r.ai_response.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggle = (id: string) => { const n = new Set(expanded); n.has(id) ? n.delete(id) : n.add(id); setExpanded(n); };

  const exportCSV = () => {
    const csv = ['Data,ID,Sintomas,Duração,Resposta IA',
      ...filtered.map(r => `"${fDate(r.created_at)}","${r.id}","${r.symptoms?.join('; ') || ''}","${fDur(r.symptom_duration)}","${r.ai_response?.replace(/"/g, '""') || ''}"`)].join('\n');
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `consultas_${new Date().toISOString().split('T')[0]}.csv` }).click();
  };

  const fDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fDur = (n: number | null) => !n ? 'Não informado' : n === 1 ? '1 dia' : n < 7 ? `${n} dias` : n < 30 ? `${Math.floor(n / 7)} sem.` : `${Math.floor(n / 30)} meses`;

  if (authLoading || roleLoading) return <Loader />;
  if (!user) return <Blocked onLogin={() => navigate('/')} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={16} /></button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, background: '#f3f4f6', color: '#6b7280', padding: '3px 10px', borderRadius: 20 }}>{filtered.length} consulta{filtered.length !== 1 ? 's' : ''}</span>
          {isAdmin && <button onClick={exportCSV} style={ghostBtn}><Download size={14} /> Exportar CSV</button>}
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: '#111827', marginBottom: 6, letterSpacing: '-0.3px' }}>Histórico de Consultas</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Acompanhe suas análises anteriores e evolução clínica.</p>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por sintomas ou resposta da IA…"
              style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 14, fontFamily: "'Inter',sans-serif", outline: 'none', background: '#fff' }} />
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger style={{ borderRadius: 10 }}><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        {loading ? <Loader inline /> : paged.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
            <MessageSquare size={36} color="#d1d5db" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontWeight: 600, fontSize: 16, color: '#374151', marginBottom: 6 }}>{search ? 'Nenhum resultado' : 'Sem consultas ainda'}</h3>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 20 }}>{search ? 'Tente outros termos.' : 'Realize sua primeira consulta.'}</p>
            {search ? <button onClick={() => setSearch('')} style={btnOutline}>Limpar busca</button>
              : <button onClick={() => navigate('/consultation')} style={btnPrimary}>Nova consulta</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {paged.map(r => (
              <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>Consulta #{r.id.slice(0, 8)}</p>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#9ca3af' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{fDate(r.created_at)}</span>
                      {r.symptom_duration && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{fDur(r.symptom_duration)}</span>}
                    </div>
                  </div>
                  {r.family_symptoms && <span style={{ fontSize: 11, fontWeight: 600, background: '#e6f5f0', color: '#065f46', padding: '2px 8px', borderRadius: 20 }}>Hist. familiar</span>}
                </div>

                {/* Symptoms */}
                {r.symptoms && r.symptoms.length > 0 && (
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Sintomas</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.symptoms.map((s, i) => (
                        <span key={i} style={{ fontSize: 12, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', padding: '3px 10px', borderRadius: 20 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Response */}
                {r.ai_response && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button onClick={() => toggle(r.id)}
                        style={{ width: '100%', padding: '12px 20px', background: '#f9fafb', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#0d7a5f' }}>
                        <span>Ver análise da IA</span>
                        {expanded.has(r.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div style={{ padding: '16px 20px', background: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>
                        <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#1f2937', whiteSpace: 'pre-wrap' }}>{r.ai_response}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Actions */}
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => { setSelected(r); setReopenOpen(true); }} style={ghostBtn}><RotateCcw size={13} /> Reabrir consulta</button>
                  {r.consulta_original_id && <span style={{ fontSize: 11, background: '#e6f5f0', color: '#065f46', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>{r.status === 'atualizada' ? 'Atualizada' : 'Reaberta'}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <PaginationItem key={p}><PaginationLink onClick={() => setPage(p)} isActive={page === p} className="cursor-pointer">{p}</PaginationLink></PaginationItem>
                ))}
                <PaginationItem><PaginationNext onClick={() => setPage(Math.min(totalPages, page + 1))} className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {selected && <ReopenConsultationModal open={reopenOpen} onOpenChange={setReopenOpen} originalConsultation={selected} onSuccess={() => { fetch(); toast({ title: 'Consulta processada!' }); }} />}
    </div>
  );
};

const Loader = ({ inline }: { inline?: boolean }) => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: inline ? 40 : 0, minHeight: inline ? undefined : '100vh', alignItems: 'center' }}>
    <div style={{ width: 28, height: 28, border: '2.5px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
const Blocked = ({ onLogin }: { onLogin: () => void }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
    <p style={{ color: '#6b7280', marginBottom: 16 }}>Você precisa estar logado.</p>
    <button onClick={onLogin} style={btnPrimary}>Ir para login</button>
  </div>
);
const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#374151' };
const ghostBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 18px', fontWeight: 500, fontSize: 13, cursor: 'pointer' };

export default ConsultationHistory;
