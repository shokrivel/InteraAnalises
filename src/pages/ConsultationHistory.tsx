import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, ChevronDown, ChevronUp, Download, RotateCcw, MessageSquare } from 'lucide-react';
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
  const [list, setList] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reopenOpen, setReopenOpen] = useState(false);
  const [selected, setSelected] = useState<ConsultationRecord | null>(null);
  const PER = 5;

  useEffect(() => { if (!authLoading && !roleLoading && user) fetch(); }, [user, authLoading, roleLoading, isAdmin]);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from('consultation_history').select('*').order('created_at', { ascending: false });
      if (!isAdmin) q = q.eq('user_id', user.id as any);
      const { data, error } = await q;
      if (error) toast({ title: 'Erro', description: 'Não foi possível carregar', variant: 'destructive' });
      else setList((data || []) as unknown as ConsultationRecord[]);
    } finally { setLoading(false); }
  };

  const byPeriod = (c: ConsultationRecord[]) => {
    if (period === 'all') return c;
    const cut = new Date();
    if (period === 'week') cut.setDate(cut.getDate() - 7);
    if (period === 'month') cut.setMonth(cut.getMonth() - 1);
    if (period === 'quarter') cut.setMonth(cut.getMonth() - 3);
    if (period === 'year') cut.setFullYear(cut.getFullYear() - 1);
    return c.filter(x => x.created_at && new Date(x.created_at) >= cut);
  };

  const filtered = byPeriod(list).filter(c =>
    c.symptoms?.some(s => typeof s === 'string' && s.toLowerCase().includes(search.toLowerCase())) ||
    (typeof c.ai_response === 'string' && c.ai_response.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / PER);
  const paginated = filtered.slice((page - 1) * PER, page * PER);

  const toggle = (id: string) => { const n = new Set(expanded); n.has(id) ? n.delete(id) : n.add(id); setExpanded(n); };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDur = (n: number | null) => !n ? 'Não informado' : n === 1 ? '1 dia' : n < 7 ? `${n} dias` : n < 30 ? `${Math.floor(n / 7)} sem.` : `${Math.floor(n / 30)} mes.`;

  const exportCSV = () => {
    const csv = ['Data,ID,Sintomas,Duração,Resposta IA',
      ...filtered.map(c => `"${fmtDate(c.created_at)}","${c.id}","${c.symptoms?.join('; ') || ''}","${fmtDur(c.symptom_duration)}","${c.ai_response?.replace(/"/g, '""') || ''}"`)].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `consultas_${new Date().toISOString().split('T')[0]}.csv` });
    a.click();
  };

  if (authLoading || roleLoading) return <Spinner />;
  if (!user) return <Blocked onBack={() => navigate('/')} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>{filtered.length} de {list.length}</span>
          {isAdmin && <button onClick={exportCSV} style={chipBtn}><Download size={13} /> Exportar</button>}
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ background: '#0d7a5f', padding: '28px 24px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 4 }}>Histórico de consultas</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Todas as suas análises anteriores em um só lugar.</p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por sintoma ou resposta da IA..." style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger style={{ borderRadius: 8, fontSize: 13, borderColor: '#e5e7eb', height: 40 }}><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? <Spinner /> : paginated.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '48px 24px', textAlign: 'center' }}>
            <MessageSquare size={32} color="#d1d5db" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 600, color: '#111827', marginBottom: 8 }}>{search ? 'Nenhum resultado' : 'Nenhuma consulta ainda'}</p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>{search ? 'Tente outros termos.' : 'Sua primeira análise vai aparecer aqui.'}</p>
            <button onClick={() => search ? setSearch('') : navigate('/consultation')} style={btnPrimary}>
              {search ? 'Limpar busca' : 'Fazer primeira consulta'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paginated.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 5 }}>Consulta #{c.id.slice(0, 8)}</p>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#9ca3af' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {fmtDate(c.created_at)}</span>
                      {c.symptom_duration && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {fmtDur(c.symptom_duration)}</span>}
                    </div>
                  </div>
                  {c.family_symptoms && <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Histórico familiar</span>}
                </div>
                {/* Symptoms */}
                {c.symptoms && c.symptoms.length > 0 && (
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>Sintomas</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {c.symptoms.map((s, i) => <span key={i} style={{ background: '#f3f4f6', color: '#374151', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>{s}</span>)}
                    </div>
                  </div>
                )}
                {/* AI Response collapsible */}
                {c.ai_response && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button onClick={() => toggle(c.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'none', border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                        <span>Ver resposta da IA</span>
                        {expanded.has(c.id) ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div style={{ background: '#f9fafb', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap' }}>{c.ai_response}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
                {/* Actions */}
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => { setSelected(c); setReopenOpen(true); }} style={chipBtn}>
                    <RotateCcw size={12} /> Reabrir consulta
                  </button>
                  {c.consulta_original_id && (
                    <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>
                      {c.status === 'atualizada' ? 'Atualizada' : 'Reaberta'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
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

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
    <div style={{ width: 32, height: 32, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
const Blocked = ({ onBack }: { onBack: () => void }) => (
  <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>Você precisa estar logado.</p>
      <button onClick={onBack} style={btnPrimary}>Ir para login</button>
    </div>
  </div>
);

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const chipBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb', cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 14px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };

export default ConsultationHistory;
