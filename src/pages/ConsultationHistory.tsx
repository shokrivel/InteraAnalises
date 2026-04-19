import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Filter, Calendar, Clock,
  MessageSquare, ChevronDown, ChevronUp, Download, RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import ReopenConsultationModal from "@/components/consultation/ReopenConsultationModal";

interface ConsultationRecord {
  id: string;
  symptoms: string[] | null;
  symptom_duration: number | null;
  family_symptoms: boolean | null;
  exam_results: any;
  epidemiological_info: any;
  ai_response: string | null;
  created_at: string | null;
  attachments?: any;
  consulta_original_id?: string | null;
  status?: string;
}

const ConsultationHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!authLoading && !roleLoading && user) fetchConsultations();
  }, [user, authLoading, roleLoading, isAdmin]);

  const fetchConsultations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase.from('consultation_history').select('*').order('created_at', { ascending: false });
      if (!isAdmin) query = query.eq('user_id', user.id as any);
      const { data, error } = await query;
      if (error) toast({ title: "Erro", description: "Não foi possível carregar o histórico", variant: "destructive" });
      else setConsultations((data || []) as unknown as ConsultationRecord[]);
    } catch { toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const filterByPeriod = (c: ConsultationRecord[]) => {
    if (periodFilter === "all") return c;
    const cutoff = new Date();
    if (periodFilter === "week")    cutoff.setDate(cutoff.getDate() - 7);
    if (periodFilter === "month")   cutoff.setMonth(cutoff.getMonth() - 1);
    if (periodFilter === "quarter") cutoff.setMonth(cutoff.getMonth() - 3);
    if (periodFilter === "year")    cutoff.setFullYear(cutoff.getFullYear() - 1);
    return c.filter(x => x.created_at && new Date(x.created_at) >= cutoff);
  };

  const filtered = filterByPeriod(consultations).filter(c =>
    c.symptoms?.some(s => typeof s === "string" && s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof c.ai_response === "string" && c.ai_response.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleExpand = (id: string) => {
    const n = new Set(expandedCards);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpandedCards(n);
  };

  const exportCSV = () => {
    const csv = ['Data,ID,Sintomas,Duração,Resposta IA',
      ...filtered.map(c => `"${fmtDate(c.created_at)}","${c.id}","${c.symptoms?.join('; ') || ''}","${fmtDur(c.symptom_duration)}","${c.ai_response?.replace(/"/g, '""') || ''}"`)].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `consultas_${new Date().toISOString().split('T')[0]}.csv` });
    a.click();
  };

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data não disponível';
  const fmtDur = (n: number | null) => !n ? 'Não informado' : n === 1 ? '1 dia' : n < 7 ? `${n} dias` : n < 30 ? `${Math.floor(n / 7)} semanas` : `${Math.floor(n / 30)} meses`;

  if (authLoading || roleLoading) return <Spinner />;
  if (!user) return <Blocked onBack={() => navigate("/")} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(245,240,232,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,168,75,.3)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate("/dashboard")} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.2rem', color: '#0f4a2e', cursor: 'pointer', letterSpacing: '-0.5px' }} onClick={() => navigate('/')}>Intera<span style={{ color: '#c8a84b' }}>Análises</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#e8f5ee', color: '#1a7a4a', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 2 }}>{filtered.length} de {consultations.length} consultas</div>
          {isAdmin && (<button onClick={exportCSV} style={ghostBtn}><Download size={14} /> Exportar CSV</button>)}
        </div>
      </header>

      {/* HERO STRIP */}
      <div style={{ background: '#0f4a2e', padding: '40px 60px 36px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', color: '#c8a84b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 1, background: '#c8a84b', display: 'inline-block' }} /> Histórico de Consultas
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: '#fafaf8', lineHeight: 1.1 }}>
            Suas consultas <em style={{ fontStyle: 'italic', color: '#e8c96a' }}>anteriores</em>
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginBottom: 28 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              placeholder="Buscar por sintomas ou resposta da IA..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 40px', border: '1px solid rgba(200,168,75,.3)', borderRadius: 4, background: '#fafaf8', fontSize: '0.9rem', color: '#1c1c1c', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}
            />
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os períodos</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? <Spinner /> : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fafaf8', borderRadius: 4, border: '1px solid rgba(200,168,75,.15)' }}>
            <MessageSquare size={40} color="#c8a84b" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: 8, color: '#1c1c1c' }}>
              {searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta realizada"}
            </h3>
            <p style={{ color: '#3d3d3d', fontSize: '0.9rem', marginBottom: 24 }}>
              {searchTerm ? "Tente buscar por outros termos." : "Você ainda não realizou nenhuma consulta."}
            </p>
            {searchTerm ? (
              <button onClick={() => setSearchTerm("")} style={btnOutline}>Limpar Busca</button>
            ) : (
              <button onClick={() => navigate("/consultation")} style={btnPrimary}>Nova Consulta</button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paginated.map(c => (
                <div key={c.id} style={cardStyle}>
                  {/* Card header */}
                  <div style={{ borderBottom: '1px solid rgba(200,168,75,.15)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.05rem', color: '#1c1c1c', marginBottom: 6 }}>Consulta #{c.id.slice(0, 8)}</h3>
                      <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: '#3d3d3d' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {fmtDate(c.created_at)}</span>
                        {c.symptom_duration && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={13} /> {fmtDur(c.symptom_duration)}</span>}
                      </div>
                    </div>
                    {c.family_symptoms && (
                      <span style={{ background: '#e8f5ee', color: '#1a7a4a', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 2 }}>Histórico familiar</span>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '20px 24px' }}>
                    {c.symptoms && c.symptoms.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Sintomas Relatados</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {c.symptoms.map((s, i) => (
                            <span key={i} style={{ background: 'transparent', border: '1px solid rgba(200,168,75,.4)', color: '#3d3d3d', fontSize: '0.78rem', fontWeight: 500, padding: '3px 10px', borderRadius: 2 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {c.ai_response && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <button
                            onClick={() => toggleExpand(c.id)}
                            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f4a2e', color: '#fafaf8', border: 'none', borderRadius: 2, padding: '10px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
                          >
                            <span>Resposta da IA</span>
                            {expandedCards.has(c.id) ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div style={{ background: '#e8f5ee', borderRadius: '0 0 2px 2px', padding: '16px', borderTop: 'none' }}>
                            <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#1c1c1c', whiteSpace: 'pre-wrap' }}>{c.ai_response}</p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(200,168,75,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button
                        onClick={() => { setSelectedConsultation(c); setReopenModalOpen(true); }}
                        style={ghostBtn}
                      >
                        <RotateCcw size={14} /> Reabrir Consulta
                      </button>
                      {c.consulta_original_id && (
                        <span style={{ background: '#e8f5ee', color: '#1a7a4a', fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 2 }}>
                          {c.status === 'atualizada' ? 'Atualizada' : 'Reaberta'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <PaginationItem key={page}><PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                    ))}
                    <PaginationItem><PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {selectedConsultation && (
        <ReopenConsultationModal
          open={reopenModalOpen}
          onOpenChange={setReopenModalOpen}
          originalConsultation={selectedConsultation}
          onSuccess={() => { fetchConsultations(); toast({ title: "Sucesso", description: "Consulta processada com sucesso!" }); }}
        />
      )}
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
    <div style={{ width: 36, height: 36, border: '3px solid #1a7a4a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
  </div>
);
const Blocked = ({ onBack }: { onBack: () => void }) => (
  <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', padding: 40 }}>
      <p style={{ color: '#3d3d3d', marginBottom: 20 }}>Você precisa estar logado.</p>
      <button onClick={onBack} style={btnPrimary}>Ir para Login</button>
    </div>
  </div>
);

// ── Style objects ────────────────────────────────────────────────
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(200,168,75,.4)', color: '#0f4a2e', fontWeight: 700, fontSize: '0.72rem', letterSpacing: 1, textTransform: 'uppercase', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(200,168,75,.4)', color: '#0f4a2e', fontWeight: 600, fontSize: '0.78rem', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0f4a2e', color: '#fafaf8', fontWeight: 700, fontSize: '0.82rem', letterSpacing: 1, textTransform: 'uppercase', padding: '12px 24px', borderRadius: 2, border: 'none', cursor: 'pointer' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#0f4a2e', border: '2px solid #0f4a2e', fontWeight: 700, fontSize: '0.82rem', letterSpacing: 1, textTransform: 'uppercase', padding: '10px 22px', borderRadius: 2, cursor: 'pointer' };
const cardStyle: React.CSSProperties = { background: '#fafaf8', borderRadius: 4, borderTop: '3px solid #c8a84b', border: '1px solid rgba(200,168,75,.2)', transition: 'box-shadow .3s' };

export default ConsultationHistory;
