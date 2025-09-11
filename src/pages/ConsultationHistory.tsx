import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Calendar, Clock, MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConsultationRecord {
  id: string;
  symptoms: string[] | null;
  symptom_duration: number | null;
  family_symptoms: boolean | null;
  exam_results: any;
  epidemiological_info: any;
  ai_response: string | null;
  created_at: string | null;
}

const ConsultationHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchConsultations();
    }
  }, [user, authLoading]);

  const fetchConsultations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consultations:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de consultas",
          variant: "destructive",
        });
      } else {
        setConsultations(data || []);
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

  const filteredConsultations = consultations.filter(consultation =>
    consultation.symptoms?.some(symptom => 
      symptom.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    consultation.ai_response?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Histórico de Consultas</h1>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {consultations.length} consultas
          </Badge>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por sintomas ou resposta da IA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando histórico...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
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
            <div className="space-y-4">
              {filteredConsultations.map((consultation) => (
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
                        <h4 className="font-semibold text-sm mb-2">Resposta da IA:</h4>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm leading-relaxed">
                            {consultation.ai_response.length > 300 
                              ? `${consultation.ai_response.substring(0, 300)}...`
                              : consultation.ai_response
                            }
                          </p>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ConsultationHistory;