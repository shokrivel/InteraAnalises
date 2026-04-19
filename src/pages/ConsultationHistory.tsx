import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, Clock, MessageSquare, ChevronDown, ChevronUp, Download, RotateCcw, Filter } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRole } from '@/hooks/useRole';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import ReopenConsultationModal from '@/components/consultation/ReopenConsultationModal';

interface C {
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
  const [consultations, setConsultations] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [reopenOpen, setReopenOpen] = useState(false);
  const [selected, setSelected] = useState<C | null>(null);
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
      else setConsultations((data || []) as unknown as C[]);
    } catch { toast({ title: 'Erro inesperado', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const byPeriod = (list: C[]) => {
    if (period === 'all') return list;
    const cut = new Date();
    if (period === 'week') cut.setDate(cut.getDate() - 7);
    else if (period === 'month') cut.setMonth(cut.getMonth() - 1);
    else if (period === 'quarter') cut.setMonth(cut.getMonth() - 3);
    else cut.setFullYear(cut.getFullYear() - 1);
    return list.filter(c => c.created_at && new Date(c.created_at) >= cut);
  };

  const filtered = byPeriod(consultations).filter(c =>
    c.symptoms?.some(s => typeof s === 'string' && s.toLowerCase().includes(search.toLowerCase())) ||
    (typeof c.ai_response === 'string' && c.ai_response.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggle = (id: string) => { const n = new Set(expanded); n.has(id) ? n.delete(id) : n.add(id); setExpanded(n); };

  const exportCSV = () => {
    const csv = ['Data,ID,Sintomas,Duração,Resposta IA',
      ...filtered.map(c => `"${fmtDate(c.created_at)}","${c.id}","${c.symptoms?.join('; ') || ''}","${fmtDur(c.symptom_duration)}","${c.ai_response?.replace(/"/g, '""') || ''}"`)].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `consultas_${new Date().toISOString().split('T')[0]}.csv` });
    a.click();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDur = (n: number | null) => !n ? '—' : n === 1 ? '1 dia' : n < 7 ? `${n} dias` : n < 30 ? `${Math.floor(n / 7)} sem.` : `${Math.floor(n / 30)} meses`;

  if (authLoading || roleLoading) return <Spin />;
  if (!user) return <Gated onBack={() => navigate('/')} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} consulta{filtered.length !== 1 ? 's' : ''}
          </span>
          {isAdmin && <button onClick={exportCSV} style={ghostBtn}><Download size={13} /> CSV</button>}
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 700, fontSize: 24, color: '#111827', marginBottom: 4, letterSpacing: '-0.3px' }}>Histórico de Consultas</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Acompanhe todas as suas análises anteriores.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input placeholder="Buscar por sintomas ou resposta da IA…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger style={{ width: 170, borderRadius: 8, fontSize: 13 }}><Filter size={13} /><SelectValue placeholder="Período" /></SelectTrigger>
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
        {loading ? <Spin /> : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
            <MessageSquare size={36} color="#0d7a5f" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 6 }}>{search ? 'Nenhum resultado encontrado' : 'Nenhuma consulta ainda'}</h3>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>{search ? 'Tente outros termos.' : 'Inicie sua primeira consulta agora.'}</p>
            {search ? <button onClick={() => setSearch('')} style={btnSec}>Limpar busca</button>
              : <button onClick={() => navigate('/consultation')} style={btnGreen}>Nova consulta</button>}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {paginated.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  {/* Header */}
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 5 }}>Consulta #{c.id.slice(0, 8)}</h3>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}><Calendar size={12} /> {fmtDate(c.created_at)}</span>
                        {c.symptom_duration && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}><Clock size={12} /> {fmtDur(c.symptom_duration)}</span>}
                      </div>
                    </div>
                    {c.family_symptoms && <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>Histórico familiar</span>}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 22px' }}>
                    {c.symptoms && c.symptoms.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Sintomas</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {c.symptoms.map((s, i) => <span key={i} style={{ background: '#f3f4f6', color: '#374151', fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 20 }}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    {c.ai_response && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <button onClick={() => toggle(c.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                            Resposta da IA {expanded.has(c.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '14px 16px' }}>
                            <p style={{ fontSize: 13, lineHeight: 1.75, color: '#374151', whiteSpace: 'pre-wrap' }}>{c.ai_response}</p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => { setSelected(c); setReopenOpen(true); }} style={ghostBtn}><RotateCcw size={13} /> Reabrir consulta</button>
                      {c.consulta_original_id && <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{c.status === 'atualizada' ? 'Atualizada' : 'Reaberta'}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
          </>
        )}
      </div>

      {selected && <ReopenConsultationModal open={reopenOpen} onOpenChange={setReopenOpen} originalConsultation={selected} onSuccess={() => { fetch(); toast({ title: 'Consulta processada com sucesso!' }); }} />}
    </div>
  );
};

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 500, fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 500, fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' };
const btnGreen: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' };
const btnSec: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' };
const Spin = () => (<div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={{ width: 32, height: 32, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Gated = ({ onBack }: { onBack: () => void }) => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: '#6b7280', marginBottom: 20 }}>Você precisa estar logado.</p><button onClick={onBack} style={{ background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 14, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Ir para login</button></div></div>);

export default ConsultationHistory;
