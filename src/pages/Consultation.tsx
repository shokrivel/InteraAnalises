import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle2, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useConsultationFields } from "@/hooks/useConsultationFields";
import { useToast } from "@/hooks/use-toast";
import DynamicField from "@/components/consultation/DynamicField";

const STEP_LABELS = ["Sintomas", "Histórico", "Exames", "Anexos"];

const profileLabels: Record<string, string> = {
  patient: "Paciente",
  academic: "Acadêmico",
  health_professional: "Profissional de Saúde",
};

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
        pos => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc); setLocationPermission("granted");
          localStorage.setItem("userLocation", JSON.stringify(loc));
        },
        () => { setLocationPermission("denied"); localStorage.setItem("locationDenied", "true"); }
      );
    } else setLocationPermission("denied");
  }, [user, profileLoading]);

  const handleAnswerChange = (fieldName: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldName]: value }));
    const hasValue = value !== undefined && value !== "" && value !== false && value !== null && !(Array.isArray(value) && value.length === 0);
    if (hasValue) {
      const currentIdx = fields.findIndex(f => f.field_name === fieldName);
      if (currentIdx >= 0 && currentIdx + 1 < fields.length) {
        const nextIdx = currentIdx + 1;
        if (nextIdx >= visibleCount) {
          setVisibleCount(nextIdx + 1);
          setTimeout(() => {
            fieldRefs.current[fields[nextIdx].field_name]?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 120);
        }
      }
    }
  };

  const validateForm = () => {
    const missing = fields.filter(f => isFieldRequired(f)).filter(f => {
      const v = answers[f.field_name];
      return !v || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0);
    });
    if (missing.length > 0) {
      toast({ title: "Campos obrigatórios", description: `Preencha: ${missing.map(f => f.field_label).join(", ")}`, variant: "destructive" });
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
    } finally { setLoading(false); }
  };

  // ── Loading states ─────────────────────────────────────────────
  if (profileLoading || fieldsLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #1a7a4a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#3d3d3d', fontFamily: "'DM Sans', sans-serif" }}>Carregando formulário...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p style={{ color: '#3d3d3d', marginBottom: 20 }}>Você precisa completar seu perfil primeiro.</p>
          <button onClick={() => navigate("/profile")} style={btnPrimary}>Completar Perfil</button>
        </div>
      </div>
    );
  }

  const visibleFields = fields.slice(0, visibleCount);
  const progress = fields.length > 0 ? Math.min((visibleCount / fields.length) * 100, 95) : 0;
  const requiredDone = fields.filter(f => isFieldRequired(f)).every(f => {
    const v = answers[f.field_name];
    return v && (typeof v !== "string" || v.trim()) && (!Array.isArray(v) || v.length > 0);
  });
  const stepIdx = Math.floor((visibleCount / fields.length) * (STEP_LABELS.length - 1));

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(245,240,232,.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(200,168,75,.3)',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate("/dashboard")} style={navBackBtn}>
            <ArrowLeft size={16} /> Voltar
          </button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.2rem', color: '#0f4a2e', cursor: 'pointer', letterSpacing: '-0.5px' }} onClick={() => navigate('/')}>
            Intera<span style={{ color: '#c8a84b' }}>Análises</span>
          </div>
        </div>
        <div style={{ background: '#e8f5ee', color: '#1a7a4a', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 2, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {profileLabels[profile.profile_type]}
        </div>
      </header>

      {/* ── HERO STRIP ── */}
      <div style={{ background: '#0f4a2e', padding: '40px 60px 36px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', color: '#c8a84b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 24, height: 1, background: '#c8a84b', display: 'inline-block' }} />
            Nova Consulta
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: '#fafaf8', lineHeight: 1.1, marginBottom: 8 }}>
            Responda as perguntas <em style={{ fontStyle: 'italic', color: '#e8c96a' }}>abaixo</em>
          </h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '0.9rem' }}>Novos campos aparecem conforme você avança.</p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Steps + Progress */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                    background: i <= stepIdx ? '#0f4a2e' : '#e8f5ee',
                    color: i <= stepIdx ? '#fafaf8' : '#3d3d3d',
                    border: i === stepIdx ? '2px solid #c8a84b' : '2px solid transparent',
                    transition: 'all .3s',
                  }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: i <= stepIdx ? '#0f4a2e' : '#9ca3af', display: window.innerWidth < 500 ? 'none' : 'block' }}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div style={{ width: 28, height: 1, background: i < stepIdx ? '#1a7a4a' : '#d1d5db', transition: 'background .3s' }} />
                )}
              </div>
            ))}
          </div>
          <div style={{ height: 3, background: '#e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#1a7a4a,#c8a84b)', borderRadius: 8, width: `${progress}%`, transition: 'width .5s ease' }} />
          </div>
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#3d3d3d', marginBottom: 20 }}>Nenhum campo configurado para seu perfil.</p>
            <button onClick={() => navigate("/dashboard")} style={btnOutline}>Voltar ao Dashboard</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visibleFields.map((field, idx) => {
                const hasValue = (() => { const v = answers[field.field_name]; return v !== undefined && v !== "" && v !== false && v !== null && !(Array.isArray(v) && v.length === 0); })();
                const isLast = idx === visibleFields.length - 1;
                return (
                  <div
                    key={field.id}
                    ref={el => { fieldRefs.current[field.field_name] = el; }}
                    style={{
                      background: '#fafaf8',
                      borderRadius: 4,
                      border: isLast ? '1px solid rgba(200,168,75,.5)' : hasValue ? '1px solid rgba(26,122,74,.2)' : '1px solid rgba(200,168,75,.15)',
                      borderLeft: `3px solid ${isLast ? '#c8a84b' : hasValue ? '#1a7a4a' : '#e8e8e8'}`,
                      padding: '20px 24px',
                      position: 'relative',
                      animation: 'slideUp .3s ease both',
                      opacity: !isLast && hasValue ? 0.82 : 1,
                      transition: 'all .3s',
                    }}
                  >
                    {hasValue && !isLast && (
                      <div style={{ position: 'absolute', top: 16, right: 16 }}>
                        <CheckCircle2 size={16} color="#1a7a4a" opacity={0.6} />
                      </div>
                    )}
                    <DynamicField field={field} value={answers[field.field_name]} onChange={handleAnswerChange} required={isFieldRequired(field)} />
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              <button type="button" onClick={() => navigate("/dashboard")} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
              <button
                type="submit"
                disabled={loading || !requiredDone}
                style={{ ...btnPrimary, flex: 1, opacity: loading || !requiredDone ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? 'Processando…' : <><Send size={15} /> Iniciar Consulta</>}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Shared styles ────────────────────────────────────────────────
const navBackBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: 'transparent', border: '1px solid rgba(200,168,75,.4)',
  color: '#0f4a2e', fontWeight: 700, fontSize: '0.75rem',
  letterSpacing: 1, textTransform: 'uppercase',
  padding: '7px 14px', borderRadius: 2, cursor: 'pointer',
};
const btnPrimary: React.CSSProperties = {
  background: '#0f4a2e', color: '#fafaf8',
  fontWeight: 700, fontSize: '0.82rem', letterSpacing: 1,
  textTransform: 'uppercase', padding: '14px 24px',
  borderRadius: 2, border: 'none', cursor: 'pointer',
  transition: 'background .2s',
};
const btnOutline: React.CSSProperties = {
  background: 'transparent', color: '#0f4a2e',
  border: '2px solid #0f4a2e', fontWeight: 700,
  fontSize: '0.82rem', letterSpacing: 1, textTransform: 'uppercase',
  padding: '12px 24px', borderRadius: 2, cursor: 'pointer',
  transition: 'all .2s',
};

export default Consultation;
