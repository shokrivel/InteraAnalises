// src/pages/ConsultationChat.tsx
import NearbyDoctors from "../components/NearbyDoctors";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, ArrowLeft, Bot, User, Copy, CheckCheck, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import HealthcareProvidersMap from "@/components/maps/HealthcareProvidersMap";

interface ConsultationResponse {
  response: string;
  consultationId: string;
  profileType: string;
  suggestedSpecialties?: string[]; // agora array
  justification?: string;
  specialists?: any[]; // especialistas retornados (opcional)
}

const ConsultationChat = () => {
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const consultationData = location.state?.consultationData;

  useEffect(() => {
    if (!user || !consultationData) {
      navigate("/dashboard");
      return;
    }

    const processConsultation = async () => {
      try {
        setLoading(true);
        console.log('Enviando consulta para gemini-consultation', consultationData);

        const { data, error } = await supabase.functions.invoke('gemini-consultation', {
          body: {
            consultationData,
            userId: user.id
          }
        });

        console.log('Resposta gemini-consultation:', data, error);

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        setConsultationResponse(data);

        // se a função já retornou especialistas, usa diretamente
        if (Array.isArray(data.specialists) && data.specialists.length > 0) {
          console.log('Providers recebidos da função (specialists):', data.specialists);
          setProviders(data.specialists);
        } else if (Array.isArray(data.suggestedSpecialties) && data.suggestedSpecialties.length > 0) {
          // se veio apenas specialties, podemos chamar find-healthcare-providers (ex: fallback)
          try {
            const extracted = data.suggestedSpecialties[0];
            if (profile?.address && (extracted)) {
              const { data: pData, error: pError } = await supabase.functions.invoke('find-healthcare-providers', {
                body: {
                  address: profile.address && profile.city ? `${profile.address}, ${profile.city}` : profile.address || undefined,
                  keyword: extracted,
                  radius: 15000
                }
              });
              if (!pError && pData?.providers) {
                setProviders(pData.providers);
              }
            }
          } catch (e) {
            console.error('Erro buscando providers como fallback:', e);
          }
        }

        // abrir mapa automaticamente
        setShowMap(true);

        toast({
          title: "Consulta processada com sucesso!",
          description: "A IA analisou suas informações e sugeriu especialistas.",
        });

      } catch (error: any) {
        console.error('Error processing consultation:', error);
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
  }, [user, consultationData, navigate, toast, profile]);

  const copyToClipboard = async () => {
    if (consultationResponse?.response) {
      try {
        await navigator.clipboard.writeText(consultationResponse.response);
        setCopied(true);
        toast({
          title: "Copiado!",
          description: "Resposta copiada para a área de transferência.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto.",
          variant: "destructive",
        });
      }
    }
  };

  const profileLabels = {
    patient: 'Paciente',
    academic: 'Acadêmico',
    health_professional: 'Profissional de Saúde'
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
          </div>
        </div>
      </div>
    );
  }

  if (!consultationResponse) {
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
            <Button onClick={() => navigate("/dashboard")}>
              Voltar ao Dashboard
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Resultado da Consulta</h1>
          </div>
          <Badge variant="secondary">
            {profile && profileLabels[profile.profile_type]}
          </Badge>
        </div>
      </header>

      {/* Chat Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Message & AI Response (mantidos) */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium">InteraSaúde AI</h3>
              <div className="prose prose-sm max-w-none">
                {consultationResponse.response.split('\n').map((paragraph, index) =>
                  paragraph.trim() && <p key={index}>{paragraph.trim()}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
                {consultationResponse.suggestedSpecialties && (
                  <div className="text-sm text-muted-foreground px-3 py-1 border rounded">{`Especialidades sugeridas: ${consultationResponse.suggestedSpecialties.join(', ')}`}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Mapa + Providers */}
          {showMap && (
            <Card>
              <CardContent className="p-6">
                <HealthcareProvidersMap
                  userAddress={profile && profile.address && profile.city ? `${profile.address}, ${profile.city}` : profile?.address}
                  providers={providers.length ? providers : undefined}
                  specialties={consultationResponse.suggestedSpecialties}
                  onClose={() => setShowMap(false)}
                />

                {/* Debug / Fallback cards - caso queira manter uma listagem adicional */}
                {providers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {providers.map((prov, idx) => (
                      <Card key={idx} className="border">
                        <CardHeader>
                          <CardTitle>{prov.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{prov.specialty || consultationResponse.suggestedSpecialties?.[0]}</p>
                        </CardHeader>
                        <CardContent>
                          <p>{prov.address}</p>
                          {prov.rating && <p className="mt-2">⭐ {prov.rating} ({prov.userRatingsTotal} avaliações)</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Importante:</strong> Esta resposta é gerada por inteligência artificial para fins educativos e informativos. Não substitui o diagnóstico médico profissional. Em caso de emergência ou sintomas graves, procure atendimento médico imediatamente.
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ConsultationChat;
