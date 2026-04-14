import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useConsultationFields } from "@/hooks/useConsultationFields";
import { useToast } from "@/hooks/use-toast";
import DynamicField from "@/components/consultation/DynamicField";

const STEP_LABELS = ["Sintomas", "Histórico", "Exames", "Anexos"];

const Consultation = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"pending" | "granted" | "denied">("pending");
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { fields, loading: fieldsLoading, isFieldRequired } = useConsultationFields();
  const navigate = useNavigate();
  const { toast } = useToast();
  const locationRequestedRef = useRef(false);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!profileLoading && !user) navigate("/");
  }, [user, profileLoading, navigate]);

  useEffect(() => {
    if (!user || profileLoading || locationRequestedRef.current) return;
    locationRequestedRef.current = true;
    const saved = localStorage.getItem("userLocation");
    const denied = localStorage.getItem("locationDenied");
    if (saved) { setUserLocation(JSON.parse(saved)); setLocationPermission("granted"); return; }
    if (denied === "true") { setLocationPermission("denied"); return; }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationPermission("granted");
          localStorage.setItem("userLocation", JSON.stringify(loc));
        },
        () => { setLocationPermission("denied"); localStorage.setItem("locationDenied", "true"); }
      );
    } else {
      setLocationPermission("denied");
    }
  }, [user, profileLoading]);

  const handleAnswerChange = (fieldName: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }));
    const hasValue =
      value !== undefined &&
      value !== "" &&
      value !== false &&
      value !== null &&
      !(Array.isArray(value) && value.length === 0);

    if (hasValue) {
      const currentIdx = fields.findIndex((f) => f.field_name === fieldName);
      if (currentIdx >= 0 && currentIdx + 1 < fields.length) {
        const next = fields[currentIdx + 1];
        const nextIdx = currentIdx + 1;
        // Always reveal file_upload; for others check if not already visible
        if (nextIdx >= visibleCount) {
          setVisibleCount(nextIdx + 1);
          setTimeout(() => {
            fieldRefs.current[next.field_name]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 120);
        }
      }
    }
  };

  const validateForm = () => {
    const missing = fields
      .filter((f) => isFieldRequired(f))
      .filter((f) => {
        const v = answers[f.field_name];
        return !v || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);
      });
    if (missing.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missing.map((f) => f.field_label).join(", ")}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !validateForm()) return;
    setLoading(true);
    try {
      navigate("/consultation-chat", { state: { consultationData: answers, userLocation, locationPermission } });
    } catch {
      toast({ title: "Erro ao processar consulta", description: "Tente novamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading || fieldsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Heart className="w-8 h-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground text-sm">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm px-4">
          <p className="text-muted-foreground">Você precisa completar seu perfil primeiro.</p>
          <Button onClick={() => navigate("/profile")}>Completar Perfil</Button>
        </div>
      </div>
    );
  }

  const profileLabels: Record<string, string> = {
    patient: "Paciente",
    academic: "Acadêmico",
    health_professional: "Profissional de Saúde",
  };

  const visibleFields = fields.slice(0, visibleCount);
  const progress = fields.length > 0 ? Math.min((visibleCount / fields.length) * 100, 95) : 0;
  const requiredDone = fields
    .filter((f) => isFieldRequired(f))
    .every((f) => {
      const v = answers[f.field_name];
      return v && (typeof v !== "string" || v.trim()) && (!Array.isArray(v) || v.length > 0);
    });

  // Step indicator: 4 macro steps
  const stepIdx = Math.floor((visibleCount / fields.length) * (STEP_LABELS.length - 1));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <img
              src={interasaudeLogo}
              alt="InteraSaúde"
              className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
          </div>
          <Badge variant="secondary">{profileLabels[profile.profile_type]}</Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Page title + step indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                    i < stepIdx ? "text-primary" : i === stepIdx ? "text-primary" : "text-muted-foreground"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                      i < stepIdx
                        ? "bg-primary text-primary-foreground"
                        : i === stepIdx
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {i < stepIdx ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:block">{label}</span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`h-px w-8 transition-colors ${i < stepIdx ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h1 className="text-2xl font-semibold text-foreground">Nova Consulta</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Responda as perguntas abaixo — novos campos aparecem conforme você avança.
            </p>
          </div>

          {/* Fields */}
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum campo configurado para seu perfil.</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="mt-4">
                Voltar ao Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {visibleFields.map((field, idx) => {
                const hasValue = (() => {
                  const v = answers[field.field_name];
                  return v !== undefined && v !== "" && v !== false && v !== null &&
                    !(Array.isArray(v) && v.length === 0);
                })();
                const isLast = idx === visibleFields.length - 1;

                return (
                  <div
                    key={field.id}
                    ref={(el) => { fieldRefs.current[field.field_name] = el; }}
                    className={`relative bg-card rounded-xl border transition-all duration-300 p-5 ${
                      isLast
                        ? "border-primary/30 shadow-sm"
                        : hasValue
                        ? "border-primary/20 opacity-80"
                        : "border-border"
                    }`}
                    style={{ animation: "slideUp .3s ease both" }}
                  >
                    {/* Completed indicator */}
                    {hasValue && !isLast && (
                      <CheckCircle2 className="absolute top-4 right-4 w-4 h-4 text-primary opacity-60" />
                    )}
                    <DynamicField
                      field={field}
                      value={answers[field.field_name]}
                      onChange={handleAnswerChange}
                      required={isFieldRequired(field)}
                    />
                  </div>
                );
              })}

              {/* Submit */}
              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !requiredDone}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    "Processando..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Iniciar Consulta
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Consultation;
