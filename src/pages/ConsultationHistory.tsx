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
  const { isAdmin } = useRole(); // Only admins can view all medical records
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

  useEffect(() => {
    if (!authLoading && user) {
      fetchConsultations();
    }
  }, [user, authLoading]);

  const fetchConsultations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('consultation_history')
        .select('*')
        .order('created_at', { ascending: false });

      // Only administrators can view all medical consultations for healthcare oversight
      if (!isAdmin) {
        query = query.eq('user_id', user.id as any);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching consultations:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de consultas",
          variant: "destructive",
        });
      } else {
        setConsultations((data || []) as unknown as ConsultationRecord[]);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterConsultationsByPeriod = (consultations: ConsultationRecord[]) => {
    if (periodFilter === "all") return consultations;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (periodFilter) {
      case "week":
        filterDate.setDate(now.getDate() - 7);
        break;
      case "month":
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        filterDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return consultations;
    }
    
    return consultations.filter(consultation => 
      consultation.created_at && new Date(consultation.created_at) >= filterDate
    );
  };

  const filteredConsultations = filterConsultationsByPeriod(consultations || []).filter(consultation =>
  // Verifica se sintomas existem e são strings antes de chamar toLowerCase
  consultation.symptoms?.some(symptom =>
    typeof symptom === "string" && symptom.toLowerCase().includes(searchTerm.toLowerCase())
  ) ||
  // Verifica se ai_response existe e é string
  (typeof consultation.ai_response === "string" && consultation.ai_response.toLowerCase().includes(searchTerm.toLowerCase()))
);

  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedConsultations = filteredConsultations.slice(startIndex, startIndex + itemsPerPage);

  const toggleCardExpansion = (consultationId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(consultationId)) {
      newExpanded.delete(consultationId);
    } else {
      newExpanded.add(consultationId);
    }
    setExpandedCards(newExpanded);
  };

  const exportToCSV = () => {
    const csvContent = [
      'Data,ID,Sintomas,Duração,Resposta IA',
      ...filteredConsultations.map(c => 
        `"${formatDate(c.created_at)}","${c.id}","${c.symptoms?.join('; ') || ''}","${formatDuration(c.symptom_duration)}","${c.ai_response?.replace(/"/g, '""') || ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não disponível";
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (duration: number | null) => {
    if (!duration) return "Não informado";
    if (duration === 1) return "1 dia";
    if (duration < 7) return `${duration} dias`;
    if (duration < 30) return `${Math.floor(duration / 7)} semanas`;
    return `${Math.floor(duration / 30)} meses`;
  };

  const handleReopenSuccess = () => {
    // Refresh consultations after successful reopen
    fetchConsultations();
    toast({
      title: "Sucesso",
      description: "Consulta processada com sucesso!",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
              <p className="text-muted-foreground mb-4">
                Você precisa estar logado para ver seu histórico de consultas.
              </p>
              <Button onClick={() => navigate("/")}>
                Ir para Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!loading && consultations === undefined) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardContent className="pt-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar</h2>
          <p className="text-muted-foreground mb-4">
            O histórico de consultas não pôde ser carregado no momento.
          </p>
          <Button onClick={() => fetchConsultations()}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <img 
              src={interasaudeLogo} 
              alt="InteraSaúde Logo" 
              className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {filteredConsultations.length} de {consultations.length} consultas
            </Badge>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por sintomas ou resposta da IA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
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
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? "Nenhuma consulta encontrada" : "Nenhuma consulta realizada"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "Tente buscar por outros termos ou limpe o filtro"
                      : "Você ainda não realizou nenhuma consulta. Que tal começar agora?"
                    }
                  </p>
                  <div className="flex gap-3 justify-center">
                    {searchTerm && (
                      <Button variant="outline" onClick={() => setSearchTerm("")}>
                        Limpar Busca
                      </Button>
                    )}
                    <Button onClick={() => navigate("/consultation")}>
                      Nova Consulta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedConsultations.map((consultation) => (
                <Card key={consultation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Consulta {consultation.id.slice(0, 8)}...
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(consultation.created_at)}
                          </div>
                          {consultation.symptom_duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Duração: {formatDuration(consultation.symptom_duration)}
                            </div>
                          )}
                        </div>
                      </div>
                      {consultation.family_symptoms && (
                        <Badge variant="secondary">
                          Histórico familiar
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {consultation.symptoms && consultation.symptoms.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Sintomas Relatados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {consultation.symptoms.map((symptom, index) => (
                            <Badge key={index} variant="outline">
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {consultation.ai_response && (
                      <div>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-full justify-between"
                              onClick={() => toggleCardExpansion(consultation.id)}
                            >
                              <span className="font-semibold text-sm">Resposta da IA</span>
                              {expandedCards.has(consultation.id) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {consultation.ai_response}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )}

                    {/* Anexos */}
                    {consultation.attachments && Array.isArray(consultation.attachments) && consultation.attachments.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Anexos:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {(Array.isArray(consultation.attachments) ? consultation.attachments : []).map((attachment: any, index: number) => (
                            <div key={index} className="border rounded-lg p-2 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-2">
                                {attachment.type?.startsWith('image/') ? (
                                  <Image className="w-4 h-4 text-blue-500" />
                                ) : attachment.name?.endsWith('.pdf') ? (
                                  <FileText className="w-4 h-4 text-red-500" />
                                ) : (
                                  <File className="w-4 h-4 text-gray-500" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{attachment.name || 'Anexo'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : ''}
                                  </p>
                                </div>
                                {attachment.url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(consultation.exam_results || consultation.epidemiological_info) && (
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Informações adicionais: 
                          {consultation.exam_results && " Resultados de exames"}
                          {consultation.exam_results && consultation.epidemiological_info && " • "}
                          {consultation.epidemiological_info && " Dados epidemiológicos"}
                        </p>
                      </div>
                    )}

                    {/* Reopen consultation button */}
                    <div className="pt-4 border-t border-border mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedConsultation(consultation);
                          setReopenModalOpen(true);
                        }}
                        className="flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reabrir Consulta
                      </Button>
                      {consultation.consulta_original_id && (
                        <Badge variant="secondary" className="ml-2">
                          {consultation.status === 'atualizada' ? 'Atualizada' : 'Reaberta'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Reopen Consultation Modal */}
      {selectedConsultation && (
        <ReopenConsultationModal
          open={reopenModalOpen}
          onOpenChange={setReopenModalOpen}
          originalConsultation={selectedConsultation}
          onSuccess={handleReopenSuccess}
        />
      )}
    </div>
  );
};

export default ConsultationHistory;