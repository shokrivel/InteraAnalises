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
  const [radiusFilter, setRadiusFilter] = useState(15);
  const [ratingFilter, setRatingFilter] = useState(0);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Flag para garantir que a consulta execute apenas uma vez
  const hasProcessedRef = useRef(false);

  const consultationData = location.state?.consultationData;
  const userLocation = location.state?.userLocation;
  const locationPermission = location.state?.locationPermission;

  useEffect(() => {
    // Evita re-execução ao trocar de aba ou perder/recuperar foco
    if (hasProcessedRef.current) {
      return;
    }

    if (!user || !consultationData) {
      navigate("/dashboard");
      return;
    }

    const processConsultation = async () => {
      try {
        // Marca como processado imediatamente para evitar múltiplas execuções
        hasProcessedRef.current = true;
        setLoading(true);

        console.log("📤 Enviando dados para Gemini:", consultationData);

        // Prepare attachments from consultation data
        const attachments = consultationData.anexos_e_documentos || [];

        const { data, error } = await supabase.functions.invoke("gemini-consultation", {
          body: {
            consultationData: consultationData,
            userId: user.id,
            attachments: attachments,
            userLocation: userLocation,
            locationPermission: locationPermission
          },
        });

        console.log("🤖 Resposta da IA:", data);

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        if (data.response) {
          setAiResponse(data);
          
          // Set specialists if available
          if (data.specialists && data.specialists.length > 0) {
            setSpecialists(data.specialists);
          }
        } else {
          throw new Error("Não foi possível obter uma resposta da IA.");
        }

        toast({
          title: "Consulta processada com sucesso!",
          description: "A IA analisou suas informações e gerou uma resposta personalizada.",
        });
      } catch (error: any) {
        console.error("Erro ao processar consulta:", error);
        // Em caso de erro, permite tentar novamente
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

  const openGoogleMaps = (specialist: Specialist) => {
    const url = `https://www.google.com/maps/place/?q=place_id:${specialist.placeId}`;
    window.open(url, '_blank');
  };

  const openDirections = (specialist: Specialist) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${specialist.location.lat},${specialist.location.lng}&destination_place_id=${specialist.placeId}`;
    window.open(url, '_blank');
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredSpecialists = specialists.filter(specialist => {
    if (specialist.rating < ratingFilter) return false;
    return true;
  });

  const profileLabels = {
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
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Processando sua consulta...</h2>
            <p className="text-muted-foreground">
              A IA está analisando suas informações e preparando uma resposta personalizada.
            </p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!aiResponse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erro na consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Não foi possível processar sua consulta.
            </p>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
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
          <Badge variant="secondary">
            {profile && profileLabels[profile.profile_type]}
          </Badge>
        </div>
      </header>

      {/* Chat Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Message */}
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="flex-1">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Você</span>
                    <Badge variant="outline" className="text-xs">
                      {profile && profileLabels[profile.profile_type]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <strong>Consulta enviada:</strong>{" "}
                      {Object.keys(consultationData).length} campos preenchidos
                    </p>
                    {consultationData.symptoms && (
                      <p className="mt-2">
                        <strong>Sintomas:</strong> {consultationData.symptoms}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Response */}
          <div className="flex items-start space-x-3">
            <Avatar>
              <AvatarFallback>
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <Card className="flex-1">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">InteraSaúde AI</span>
                      <Badge variant="secondary" className="text-xs">
                        Gemini 1.5 Flash
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center space-x-2"
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{copied ? "Copiado" : "Copiar"}</span>
                    </Button>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {aiResponse.response
                      .split("\n")
                      .map(
                        (paragraph, index) =>
                          paragraph.trim() && (
                            <p key={index} className="mb-3 leading-relaxed">
                              {paragraph.trim()}
                            </p>
                          )
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Specialists Section */}
          {specialists.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">
                  Especialistas próximos recomendados
                </h3>
                <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {aiResponse?.suggestedSpecialty}
                </span>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Avaliação mínima:</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(Number(e.target.value))}
                    className="px-3 py-1 border rounded-md bg-background"
                  >
                    <option value={0}>Todas</option>
                    <option value={3}>3+ estrelas</option>
                    <option value={4}>4+ estrelas</option>
                    <option value={4.5}>4.5+ estrelas</option>
                  </select>
                </div>
              </div>

              {/* Specialists Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                {filteredSpecialists.map((specialist, index) => (
                  <Card 
                    key={specialist.placeId} 
                    className={`transition-all duration-200 hover:shadow-lg ${
                      index === 0 ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {specialist.name}
                            {index === 0 && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                                Mais próximo
                              </span>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {specialist.specialty}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-foreground">{specialist.address}</p>
                      </div>
                      
                      {specialist.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= specialist.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{specialist.rating}</span>
                          <span className="text-sm text-muted-foreground">
                            ({specialist.userRatingsTotal} avaliações)
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => openGoogleMaps(specialist)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Ver no Maps
                        </Button>
                        <Button
                          onClick={() => openDirections(specialist)}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Iniciar rota
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredSpecialists.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum especialista encontrado com os filtros aplicados.</p>
                </div>
              )}
            </div>
          )}

          {/* Map display */}
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

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="font-medium">Próximos passos</h3>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Button to show/hide map */}
                  {specialists.length > 0 && (
                    <Button
                      onClick={() => setShowMap(!showMap)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Map className="h-4 w-4" />
                      {showMap ? 'Ocultar' : 'Ver'} Mapa Interativo
                    </Button>
                  )}
                  <Button onClick={() => navigate("/consultation")}>
                    Nova Consulta
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>
                    Voltar ao Dashboard
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta consulta foi salva no seu histórico. ID:{" "}
                  {aiResponse.consultationId?.slice(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Importante:</strong> Esta resposta é gerada por inteligência artificial
                para fins educativos e informativos. Não substitui o diagnóstico médico
                profissional. Em caso de emergência ou sintomas graves, procure atendimento
                médico imediatamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsultationChat;
