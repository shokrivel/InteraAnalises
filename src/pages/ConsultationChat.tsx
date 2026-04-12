import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Bot, User, Copy, CheckCheck, MapPin, Star, Navigation, Map } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import HealthcareProvidersMap from "@/components/maps/HealthcareProvidersMap";

interface Specialist {
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  location: { lat: number; lng: number };
  placeId: string;
  specialty: string;
}

interface ConsultationResponse {
  response: string;
  consultationId?: string;
  profileType?: string;
  suggestedSpecialty?: string;
  specialists?: Specialist[];
}

const ConsultationChat = () => {
  const [aiResponse, setAiResponse] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const hasProcessedRef = useRef(false);

  const consultationData = location.state?.consultationData;
  const userLocation = location.state?.userLocation;
  const locationPermission = location.state?.locationPermission;

  useEffect(() => {
    if (hasProcessedRef.current) return;
    if (!user || !consultationData) {
      navigate("/dashboard");
      return;
    }

    const processConsultation = async () => {
      try {
        hasProcessedRef.current = true;
        setLoading(true);

        const attachments = consultationData.anexos_e_documentos || [];

        // Pegar token atualizado da sessão
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const token = currentSession?.access_token;

        if (!token) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const { data, error } = await supabase.functions.invoke("gemini-consultation", {
          body: {
            consultationData,
            userId: user.id,
            attachments,
            userLocation,
            locationPermission,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        if (data?.response) {
          setAiResponse(data);
          if (data.specialists?.length > 0) setSpecialists(data.specialists);
        } else {
          throw new Error("Não foi possível obter uma resposta da IA.");
        }

        toast({ title: "Consulta processada com sucesso!" });
      } catch (error: any) {
        console.error("Erro ao processar consulta:", error);
        hasProcessedRef.current = false;
        toast({
          title: "Erro ao processar consulta",
          description: error.message || "Tente novamente mais tarde.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    processConsultation();
  }, [user, consultationData, navigate, toast]);

  const copyToClipboard = () => {
    if (aiResponse?.response) {
      navigator.clipboard.writeText(aiResponse.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openGoogleMaps = (s: Specialist) =>
    window.open(`https://www.google.com/maps/place/?q=place_id:${s.placeId}`, "_blank");

  const openDirections = (s: Specialist) =>
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}&destination_place_id=${s.placeId}`, "_blank");

  const filteredSpecialists = specialists.filter(s => s.rating >= ratingFilter);

  const profileLabels: Record<string, string> = {
    patient: "Paciente",
    academic: "Acadêmico",
    health_professional: "Profissional de Saúde",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Processando sua consulta...</h2>
          <p className="text-muted-foreground">A IA está analisando suas informações.</p>
          <div className="flex items-center justify-center space-x-1">
            {[0, 0.1, 0.2].map((d, i) => (
              <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!aiResponse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Erro na consulta</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Não foi possível processar sua consulta.</p>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
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
          <Badge variant="secondary">{profile && profileLabels[profile.profile_type]}</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Mensagem do usuário */}
          <div className="flex items-start space-x-3">
            <Avatar><AvatarFallback><User className="w-4 h-4" /></AvatarFallback></Avatar>
            <Card className="flex-1">
              <CardContent className="pt-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-foreground">Você</span>
                  <Badge variant="outline" className="text-xs">{profile && profileLabels[profile.profile_type]}</Badge>
                </div>
                <p><strong>Consulta enviada:</strong> {Object.keys(consultationData).length} campos preenchidos</p>
                {consultationData.symptoms && <p className="mt-1"><strong>Sintomas:</strong> {consultationData.symptoms}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Resposta da IA */}
          <div className="flex items-start space-x-3">
            <Avatar><AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback></Avatar>
            <Card className="flex-1">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">InteraSaúde AI</span>
                    <Badge variant="secondary" className="text-xs">Gemini 2.0 Flash</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center space-x-2">
                    {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copiado" : "Copiar"}</span>
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none">
                  {aiResponse.response.split("\n").map((p, i) => p.trim() && (
                    <p key={i} className="mb-3 leading-relaxed">{p.trim()}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Especialistas */}
          {specialists.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Especialistas próximos recomendados</h3>
                <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">{aiResponse?.suggestedSpecialty}</span>
              </div>
              <div className="flex gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Avaliação mínima:</label>
                  <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))} className="px-3 py-1 border rounded-md bg-background">
                    <option value={0}>Todas</option>
                    <option value={3}>3+ estrelas</option>
                    <option value={4}>4+ estrelas</option>
                    <option value={4.5}>4.5+ estrelas</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4">
                {filteredSpecialists.map((s, i) => (
                  <Card key={s.placeId} className={`transition-all hover:shadow-lg ${i === 0 ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {s.name}
                        {i === 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Mais próximo</span>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{s.specialty}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm">{s.address}</p>
                      </div>
                      {s.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} className={`h-4 w-4 ${star <= s.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{s.rating}</span>
                          <span className="text-sm text-muted-foreground">({s.userRatingsTotal} avaliações)</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => openGoogleMaps(s)} variant="outline" size="sm" className="flex-1">
                          <MapPin className="h-4 w-4 mr-2" />Ver no Maps
                        </Button>
                        <Button onClick={() => openDirections(s)} variant="default" size="sm" className="flex-1">
                          <Navigation className="h-4 w-4 mr-2" />Iniciar rota
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {showMap && specialists.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Mapa interativo</h3>
              <HealthcareProvidersMap
                userAddress={profile?.address && profile?.city ? `${profile.address}, ${profile.city}` : undefined}
                providers={specialists}
                onClose={() => setShowMap(false)}
              />
            </div>
          )}

          {/* Ações */}
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="font-medium">Próximos passos</h3>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {specialists.length > 0 && (
                  <Button onClick={() => setShowMap(!showMap)} variant="outline" className="gap-2">
                    <Map className="h-4 w-4" />{showMap ? 'Ocultar' : 'Ver'} Mapa Interativo
                  </Button>
                )}
                <Button onClick={() => navigate("/consultation")}>Nova Consulta</Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Consulta salva. ID: {aiResponse.consultationId?.slice(0, 8)}...
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Importante:</strong> Esta resposta é gerada por inteligência artificial para fins educativos e informativos. Não substitui o diagnóstico médico profissional.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsultationChat;
