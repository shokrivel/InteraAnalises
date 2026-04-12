import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, Clock, MessageSquare, Search, ChevronDown, ChevronUp, Download, Filter, File, Image, FileText, ExternalLink, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRole } from "@/hooks/useRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRecord | null>(null);
  const itemsPerPage = 5;

  // Wait for both auth AND role to finish loading before fetching
  useEffect(() => {
    if (!authLoading && !roleLoading && user) {
      fetchConsultations();
    }
  }, [user, authLoading, roleLoading, isAdmin]);

  const fetchConsultations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      let query = supabase
        .from('consultation_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('user_id', user.id as any);
      }

      const { data, error } = await query;
      if (error) {
        toast({ title: "Erro", description: "Não foi possível carregar o histórico", variant: "destructive" });
      } else {
        setConsultations((data || []) as unknown as ConsultationRecord[]);
      }
    } catch (err) {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filterConsultationsByPeriod = (consultations: ConsultationRecord[]) => {
    if (periodFilter === "all") return consultations;
    const now = new Date();
    const filterDate = new Date();
    switch (periodFilter) {
      case "week": filterDate.setDate(now.getDate() - 7); break;
      case "month": filterDate.setMonth(now.getMonth() - 1); break;
      case "quarter": filterDate.setMonth(now.getMonth() - 3); break;
      case "year": filterDate.setFullYear(now.getFullYear() - 1); break;
      default: return consultations;
    }
    return consultations.filter(c => c.created_at && new Date(c.created_at) >= filterDate);
  };

  const filteredConsultations = filterConsultationsByPeriod(consultations).filter(c =>
    c.symptoms?.some(s => typeof s === "string" && s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof c.ai_response === "string" && c.ai_response.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const paginatedConsultations = filteredConsultations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleCardExpansion = (id: string) => {
    const next = new Set(expandedCards);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedCards(next);
  };

  const exportToCSV = () => {
    const csv = [
      'Data,ID,Sintomas,Duração,Resposta IA',
      ...filteredConsultations.map(c =>
        `"${formatDate(c.created_at)}","${c.id}","${c.symptoms?.join('; ') || ''}","${formatDuration(c.symptom_duration)}","${c.ai_response?.replace(/"/g, '""') || ''}"`
      )
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "Data não disponível";
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (n: number | null) => {
    if (!n) return "Não informado";
    if (n === 1) return "1 dia";
    if (n < 7) return `${n} dias`;
    if (n < 30) return `${Math.floor(n / 7)} semanas`;
    return `${Math.floor(n / 30)} meses`;
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card><CardContent className="pt-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-4">Você precisa estar logado.</p>
          <Button onClick={() => navigate("/")}>Ir para Login</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
            <img src={interasaudeLogo} alt="InteraSaúde Logo" className="h-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/")} />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {filteredConsultations.length} de {consultations.length} consultas
            </Badge>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />Exportar CSV
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar por sintomas ou resposta da IA..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
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
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : paginatedConsultations.length === 0 ? (
            <Card><CardContent className="pt-6">
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta realizada"}</h3>
                <p className="text-muted-foreground mb-4">{searchTerm ? "Tente buscar por outros termos" : "Você ainda não realizou nenhuma consulta."}</p>
                <div className="flex gap-3 justify-center">
                  {searchTerm && <Button variant="outline" onClick={() => setSearchTerm("")}>Limpar Busca</Button>}
                  <Button onClick={() => navigate("/consultation")}>Nova Consulta</Button>
                </div>
              </div>
            </CardContent></Card>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedConsultations.map(consultation => (
                  <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">Consulta {consultation.id.slice(0, 8)}...</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(consultation.created_at)}</div>
                            {consultation.symptom_duration && (
                              <div className="flex items-center gap-1"><Clock className="w-4 h-4" />Duração: {formatDuration(consultation.symptom_duration)}</div>
                            )}
                          </div>
                        </div>
                        {consultation.family_symptoms && <Badge variant="secondary">Histórico familiar</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {consultation.symptoms && consultation.symptoms.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Sintomas Relatados:</h4>
                          <div className="flex flex-wrap gap-2">
                            {consultation.symptoms.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {consultation.ai_response && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="outline" className="w-full justify-between" onClick={() => toggleCardExpansion(consultation.id)}>
                              <span className="font-semibold text-sm">Resposta da IA</span>
                              {expandedCards.has(consultation.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{consultation.ai_response}</p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                      <div className="pt-4 border-t border-border mt-4">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedConsultation(consultation); setReopenModalOpen(true); }} className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4" />Reabrir Consulta
                        </Button>
                        {consultation.consulta_original_id && (
                          <Badge variant="secondary" className="ml-2">{consultation.status === 'atualizada' ? 'Atualizada' : 'Reaberta'}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </section>

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

export default ConsultationHistory;
