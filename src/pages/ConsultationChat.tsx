import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Bot, Copy, CheckCheck, MapPin, Star,
  Navigation, Map, AlertTriangle, Lightbulb, FlaskConical, FileText,
} from "lucide-react";
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

type TabId = "resumo" | "achados" | "orientacoes" | "alertas";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "resumo",      label: "Resumo",            icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "achados",     label: "Achados clínicos",   icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: "orientacoes", label: "Orientações",        icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: "alertas",     label: "Alertas",            icon: <AlertTriangle className="w-3.5 h-3.5" /> },
];

/** Split raw AI text into 4 logical sections */
function parseSections(text: string): Record<TabId, string[]> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Heuristic keywords per section
  const alertKeywords = /emergência|urgência|procure|atenção|important|alerta|pior dor|convuls|desmaio|sangramento|hospital|pronto.socorro/i;
  const orientKeywords = /recomend|orient|hidrat|repouso|evit|monitor|acompanhe|próxim|retorn|consul|medir|verificar|tomar/i;
  const achadosKeywords = /hemogram|exame|result|valor|normal|alterado|elevad|reduzid|achado|laborat|dosagem|parâmet/i;

  const sections: Record<TabId, string[]> = { resumo: [], achados: [], orientacoes: [], alertas: [] };

  lines.forEach((line) => {
    const clean = line.replace(/\*\*/g, "").replace(/^\*/, "").replace(/^-\s*/, "").trim();
    if (!clean) return;
    if (alertKeywords.test(clean))       sections.alertas.push(clean);
    else if (achadosKeywords.test(clean)) sections.achados.push(clean);
    else if (orientKeywords.test(clean))  sections.orientacoes.push(clean);
    else                                  sections.resumo.push(clean);
  });

  // If a section is empty, move overflow from resumo
  if (sections.achados.length === 0 && sections.resumo.length > 3) {
    sections.achados = sections.resumo.splice(Math.ceil(sections.resumo.length / 2));
  }
  if (sections.orientacoes.length === 0 && sections.resumo.length > 2) {
    sections.orientacoes = sections.resumo.splice(-2);
  }

  return sections;
}

const ConsultationChat = () => {
  const [aiResponse, setAiResponse] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("resumo");
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const { user, session } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const hasProcessedRef = useRef(false);

  const consultationData = location.state?.consultationData;
  const userLocation     = location.state?.userLocation;
  const locationPermission = location.state?.locationPermission;

  useEffect(() => {
    if (hasProcessedRef.current) return;
    if (!user || !consultationData) { navigate("/dashboard"); return; }

    const run = async () => {
      try {
        hasProcessedRef.current = true;
        setLoading(true);
        const { data: { session: s } } = await supabase.auth.getSession();
        const token = s?.access_token;
        if (!token) throw new Error("Sessão expirada. Faça login novamente.");

        const { data, error } = await supabase.functions.invoke("gemini-consultation", {
          body: { consultationData, userId: user.id, attachments: consultationData.anexos_e_documentos || [], userLocation, locationPermission },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        if (!data?.response) throw new Error("Não foi possível obter resposta da IA.");

        setAiResponse(data);
        if (data.specialists?.length > 0) setSpecialists(data.specialists);
        toast({ title: "Consulta processada com sucesso!" });
      } catch (err: any) {
        hasProcessedRef.current = false;
        toast({ title: "Erro ao processar consulta", description: err.message, variant: "destructive" });
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, consultationData, navigate, toast]);

  const copyToClipboard = () => {
    if (!aiResponse?.response) return;
    navigator.clipboard.writeText(aiResponse.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const profileLabels: Record<string, string> = {
    patient: "Paciente",
    academic: "Acadêmico",
    health_professional: "Profissional de Saúde",
  };

  const filteredSpecialists = specialists.filter((s) => s.rating >= ratingFilter);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Processando sua consulta...</h2>
          <p className="text-sm text-muted-foreground">A IA está analisando suas informações.</p>
          <div className="flex items-center justify-center gap-1 pt-1">
            {[0, 0.15, 0.3].map((d, i) => (
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
        <div className="text-center space-y-4 max-w-sm px-4">
          <p className="text-muted-foreground">Não foi possível processar sua consulta.</p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const sections = parseSections(aiResponse.response);

  /* ── Main render ── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" />Voltar
            </Button>
            <img src={interasaudeLogo} alt="InteraSaúde" className="h-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/")} />
          </div>
          <Badge variant="secondary">{profile && profileLabels[profile.profile_type]}</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Summary bar */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Consulta processada</p>
                <p className="text-sm font-medium truncate">
                  {Array.isArray(consultationData?.symptoms)
                    ? consultationData.symptoms.slice(0, 3).join(" · ") + (consultationData.symptoms.length > 3 ? ` +${consultationData.symptoms.length - 3}` : "")
                    : "Sintomas informados"}
                </p>
              </div>
            </div>
            {aiResponse.suggestedSpecialty && (
              <div className="flex-shrink-0">
                <p className="text-xs text-muted-foreground mb-1">Especialidade indicada</p>
                <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  {aiResponse.suggestedSpecialty}
                </span>
              </div>
            )}
          </div>

          {/* AI response card */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">IA</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">InteraSaúde AI</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0">Gemini 2.5 Flash</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="gap-1.5 text-xs">
                {copied ? <><CheckCheck className="w-3.5 h-3.5 text-primary" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}{tab.label}
                  {sections[tab.id].length > 0 && (
                    <span className={`ml-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                      activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {sections[tab.id].length > 9 ? "9+" : sections[tab.id].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5 space-y-3 min-h-[200px]" key={activeTab}>
              {sections[activeTab].length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhuma informação nesta seção.</p>
              ) : (
                sections[activeTab].map((line, i) => {
                  const isAlert = activeTab === "alertas";
                  const isOrient = activeTab === "orientacoes";
                  return (
                    <div
                      key={i}
                      className={`text-sm leading-relaxed p-3 rounded-lg ${
                        isAlert
                          ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                          : isOrient
                          ? "bg-primary/5 border border-primary/10 text-foreground"
                          : "text-foreground"
                      }`}
                      style={{ animation: `fadeIn .25s ${i * 0.05}s ease both` }}
                    >
                      {isAlert && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />}
                      {line}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Specialists */}
          {filteredSpecialists.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Especialistas próximos</span>
                  {aiResponse.suggestedSpecialty && (
                    <span className="text-xs text-muted-foreground">— {aiResponse.suggestedSpecialty}</span>
                  )}
                </div>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(Number(e.target.value))}
                  className="text-xs border border-input rounded-md px-2 py-1 bg-background"
                >
                  <option value={0}>Todas avaliações</option>
                  <option value={3}>3+ estrelas</option>
                  <option value={4}>4+ estrelas</option>
                  <option value={4.5}>4.5+ estrelas</option>
                </select>
              </div>

              <div className="divide-y divide-border">
                {filteredSpecialists.map((s, i) => (
                  <div key={s.placeId} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${i === 0 ? "bg-primary/5" : ""}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
                      i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{s.name}</p>
                        {i === 0 && <Badge className="text-[10px] px-1.5 py-0 h-4">Mais próximo</Badge>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                      </div>
                      {s.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${star <= s.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-0.5">{s.rating} ({s.userRatingsTotal})</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${s.placeId}`, "_blank")}
                      >
                        <MapPin className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}&destination_place_id=${s.placeId}`, "_blank")}
                      >
                        <Navigation className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {showMap && specialists.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-medium">Mapa interativo</span>
                <Button variant="ghost" size="sm" onClick={() => setShowMap(false)} className="text-xs h-7">Fechar</Button>
              </div>
              <div className="p-4">
                <HealthcareProvidersMap
                  userAddress={profile?.address && profile?.city ? `${profile.address}, ${profile.city}` : undefined}
                  providers={specialists}
                  onClose={() => setShowMap(false)}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {specialists.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)} className="gap-1.5">
                <Map className="w-3.5 h-3.5" />{showMap ? "Ocultar mapa" : "Ver mapa"}
              </Button>
            )}
            <Button size="sm" onClick={() => navigate("/consultation")} className="gap-1.5">
              Nova consulta
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg px-4 py-3">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 text-amber-500" />
            <strong>Importante:</strong> Esta resposta é gerada por IA para fins informativos. Não substitui diagnóstico médico profissional.
            {aiResponse.consultationId && (
              <span className="ml-2 opacity-50">ID: {aiResponse.consultationId.slice(0, 8)}…</span>
            )}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConsultationChat;
