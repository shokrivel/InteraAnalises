// src/pages/ConsultationChat.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, ArrowLeft, Bot, User, Copy, CheckCheck, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../supabaseClient";
import HealthcareProvidersMap from "@/components/maps/HealthcareProvidersMap";
import NearbyDoctors from "@/components/NearbyDoctors";

interface ConsultationResponse {
  response: string;
  consultationId?: string;
  recommendedSpecialty?: string; // opcional — ideal se a Edge Function retornar
  profileType?: string;
}

const ConsultationChat: React.FC = () => {
  const [consultationResponse, setConsultationResponse] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // consulta enviada pela página anterior (Consultation)
  const consultationData = (location.state as any)?.consultationData;

  useEffect(() => {
    if (!user || !consultationData) {
      // se não tiver dados, volta ao dashboard (segurança)
      navigate("/dashboard");
      return;
    }

    const processConsultation = async () => {
      try {
        setLoading(true);

        console.log("Sending consultation data to Gemini (edge function):", consultationData);

        const { data, error } = await supabase.functions.invoke("gemini-consultation", {
          body: {
            consultationData,
            userId: user.id,
          },
        });

        console.log("Gemini response (edge function):", data, "error:", error);

        if (error) {
          throw new Error(error.message || "Erro na função do Supabase");
        }

        if (!data) {
          throw new Error("Resposta vazia da função de IA");
        }

        // esperamos que a função retorne: { response: string, consultationId?: string, recommendedSpecialty?: string }
        setConsultationResponse({
          response: data.response || "",
          consultationId: data.consultationId,
          recommendedSpecialty: data.recommendedSpecialty || undefined,
          profileType: data.profileType || undefined,
        });

        toast({
          title: "Consulta processada com sucesso!",
          description: "A IA analisou suas informações e gerou uma resposta personalizada.",
        });
      } catch (error: any) {
        console.error("Error processing consultation:", error);

        let errorMessage = "Tente novamente mais tarde.";
        if (error?.message) {
          try {
            const parsed = JSON.parse(error.message);
            if (parsed?.error) errorMessage = parsed.error;
            else errorMessage = error.message;
          } catch {
            errorMessage = error.message || errorMessage;
          }
        }

        toast({
          title: "Erro ao processar consulta",
          description: errorMessage,
          variant: "destructive",
        });

        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    processConsultation();
  }, [user, consultationData, navigate, toast]);

  const copyToClipboard = async () => {
    if (!consultationResponse?.response) return;
    try {
      await navigator.clipboard.writeText(consultationResponse.response);
      setCopied(true);
      toast({ title: "Copiado", description: "Resposta copiada para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", description: "Não foi possível copiar o texto.", variant: "destructive" });
    }
  };

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
          <p className="text-muted-foreground">A IA está analisando suas informações e preparando uma resposta.</p>
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
            <p className="text-muted-foreground mb-4">Não foi possível processar sua consulta.</p>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="border-b border-border bg-card/50">
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

          <Badge variant="secondary">{profile && profileLabels[profile.profile_type]}</Badge>
        </div>
      </header>

      {/* content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* user summary */}
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
                      <strong>Consulta enviada:</strong> {consultationData ? Object.keys(consultationData).length : 0} campos
                    </p>
                    {consultationData?.symptoms && <p className="mt-2"><strong>Sintomas:</strong> {consultationData.symptoms}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* IA response */}
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
                        Gemini 2.5 Pro
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center space-x-2">
                      {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copiado" : "Copiar"}</span>
                    </Button>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {consultationResponse.response.split("\n").map((paragraph, idx) => (
                      paragraph.trim() && (
                        <p key={idx} className="mb-3 leading-relaxed">{paragraph.trim()}</p>
                      )
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="font-medium">Próximos passos</h3>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setShowMap(!showMap)} variant="outline" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {showMap ? "Ocultar Mapa" : "Ver Profissionais Próximos"}
                  </Button>
                  <Button onClick={() => navigate("/consultation")}>Nova Consulta</Button>
                  <Button variant="outline" onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta consulta foi salva no seu histórico. ID: {consultationResponse.consultationId?.slice(0,8)}...
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Map card */}
          {showMap && profile && (
            <Card>
              <CardContent className="p-6">
                <HealthcareProvidersMap
                  userAddress={profile.address && profile.city ? `${profile.address}, ${profile.city}` : undefined}
                  onClose={() => setShowMap(false)}
                />
              </CardContent>
            </Card>
          )}

          {/* Nearby doctors card (passes prognosis and user address) */}
          <Card>
            <CardHeader>
              <CardTitle>Profissionais de Saúde Recomendados</CardTitle>
            </CardHeader>
            <CardContent>
              <NearbyDoctors
                prognosis={consultationResponse.recommendedSpecialty || consultationResponse.response || ""}
                userAddress={profile?.address && profile?.city ? `${profile.address}, ${profile.city}` : undefined}
              />
            </CardContent>
          </Card>

          {/* disclaimer */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent>
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> Esta resposta é gerada por IA para fins educativos. Não substitui consulta presencial.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsultationChat;
