import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useConsultationFields } from '@/hooks/useConsultationFields';
import { useToast } from '@/hooks/use-toast';
import DynamicField from '@/components/consultation/DynamicField';

const STEPS = ['Sintomas', 'Histórico', 'Exames', 'Anexos'];
const PROFILE_LABEL: Record<string, string> = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };
const PROFILE_COLOR: Record<string, string> = { patient: '#0d7a5f', academic: '#2563eb', health_professional: '#7c3aed' };
const PROFILE_BG: Record<string, string> = { patient: '#e6f5f0', academic: '#eff6ff', health_professional: '#f5f3ff' };

const Consultation = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { fields, loading: fieldsLoading, isFieldRequired } = useConsultationFields();
  const navigate = useNavigate();
  const { toast } = useToast();
  const locationRef = useRef(false);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { if (!profileLoading && !user) navigate('/'); }, [user, profileLoading, navigate]);

  useEffect(() => {
    if (!user || profileLoading || locationRef.current) return;
    locationRef.current = true;
    const saved = localStorage.getItem('userLocation');
    const denied = localStorage.getItem('locationDenied');
    if (saved) { setUserLocation(JSON.parse(saved)); setLocationPermission('granted'); return; }
    if (denied === 'true') { setLocationPermission('denied'); return; }
    navigator.geolocation?.getCurrentPosition(
      pos => { const l = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUserLocation(l); setLocationPermission('granted'); localStorage.setItem('userLocation', JSON.stringify(l)); },
      () => { setLocationPermission('denied'); localStorage.setItem('locationDenied', 'true'); }
    ) ?? setLocationPermission('denied');
  }, [user, profileLoading]);

  const handleChange = (fieldName: string, value: any) => {
    setAnswers(p => ({ ...p, [fieldName]: value }));
    const hasVal = value !== undefined && value !== '' && value !== false && value !== null && !(Array.isArray(value) && value.length === 0);
    if (hasVal) {
      const idx = fields.findIndex(f => f.field_name === fieldName);
      if (idx >= 0 && idx + 1 < fields.length && idx + 1 >= visibleCount) {
        setVisibleCount(idx + 2);
        setTimeout(() => fieldRefs.current[fields[idx + 1].field_name]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
      }
    }
  };

  const validate = () => {
    const missing = fields.filter(f => isFieldRequired(f)).filter(f => { const v = answers[f.field_name]; return !v || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length); });
    if (missing.length) { toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(f => f.field_label).join(', ')}`, variant: 'destructive' }); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user || !validate()) return;
    setSubmitting(true);
    try { navigate('/consultation-chat', { state: { consultationData: answers, userLocation, locationPermission } }); }
    catch { toast({ title: 'Erro ao processar consulta', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  if (profileLoading || fieldsLoading) return <Loading msg="Carregando formulário..." />;
  if (!profile) return <Fallback msg="Complete seu perfil primeiro." btnText="Completar perfil" onBtn={() => navigate('/profile')} />;

  const visible = fields.slice(0, visibleCount);
  const progress = fields.length ? Math.min((visibleCount / fields.length) * 100, 95) : 0;
  const allRequired = fields.filter(f => isFieldRequired(f)).every(f => { const v = answers[f.field_name]; return v && (typeof v !== 'string' || v.trim()) && (!Array.isArray(v) || v.length); });
  const stepIdx = Math.floor((visibleCount / fields.length) * (STEPS.length - 1));
  const pColor = PROFILE_COLOR[profile.profile_type] ?? '#0d7a5f';
  const pBg = PROFILE_BG[profile.profile_type] ?? '#e6f5f0';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <span style={{ background: pBg, color: pColor, fontWeight: 600, fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>{PROFILE_LABEL[profile.profile_type]}</span>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontWeight: 700, fontSize: 24, color: '#111827', marginBottom: 6, letterSpacing: '-0.3px' }}>Nova consulta</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Responda as perguntas abaixo — novos campos aparecem conforme você avança.</p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i <= stepIdx ? pColor : '#e5e7eb', color: i <= stepIdx ? '#fff' : '#9ca3af', transition: 'all .3s' }}>
                  {i < stepIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: i <= stepIdx ? pColor : '#9ca3af', display: 'none' /* hide on mobile */ }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, borderRadius: 1, background: i < stepIdx ? pColor : '#e5e7eb', transition: 'background .3s' }} />}
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>{Math.round(progress)}%</span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg, ${pColor}, #34d399)`, borderRadius: 4, width: `${progress}%`, transition: 'width .5s ease' }} />
        </div>

        {/* Fields */}
        {!fields.length ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>Nenhum campo configurado para seu perfil.</p>
            <button onClick={() => navigate('/dashboard')} style={btnPrimary(pColor)}>Voltar ao painel</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visible.map((field, idx) => {
                const val = answers[field.field_name];
                const hasVal = val !== undefined && val !== '' && val !== false && val !== null && !(Array.isArray(val) && !val.length);
                const isLast = idx === visible.length - 1;
                return (
                  <div key={field.id} ref={el => { fieldRefs.current[field.field_name] = el; }}
                    style={{ background: '#fff', borderRadius: 12, border: `1px solid ${isLast ? pColor + '60' : hasVal ? '#d1fae5' : '#e5e7eb'}`, borderLeft: `3px solid ${isLast ? pColor : hasVal ? '#10b981' : '#e5e7eb'}`, padding: '20px 22px', position: 'relative', animation: 'fadeUp .3s ease both', opacity: !isLast && hasVal ? 0.78 : 1, transition: 'all .25s' }}
                  >
                    {hasVal && !isLast && <CheckCircle2 size={15} color="#10b981" style={{ position: 'absolute', top: 16, right: 16, opacity: 0.7 }} />}
                    <DynamicField field={field} value={answers[field.field_name]} onChange={handleChange} required={isFieldRequired(field)} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button type="button" onClick={() => navigate('/dashboard')} style={btnCancel}>Cancelar</button>
              <button type="submit" disabled={submitting || !allRequired} style={{ ...btnPrimary(pColor), flex: 1, justifyContent: 'center', opacity: submitting || !allRequired ? 0.5 : 1 }}>
                {submitting ? 'Processando…' : <><Send size={15} /> Iniciar consulta</>}
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
};

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 500, fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' };
const btnPrimary = (color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 6, background: color, color: '#fff', fontWeight: 600, fontSize: 14, padding: '11px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', flex: 1 });
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 14, padding: '11px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', minWidth: 120 };

const Loading = ({ msg }: { msg: string }) => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}><div style={{ textAlign: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 14px' }} /><p style={{ color: '#6b7280', fontSize: 14 }}>{msg}</p></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Fallback = ({ msg, btnText, onBtn }: { msg: string; btnText: string; onBtn: () => void }) => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}><div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: '#6b7280', marginBottom: 20 }}>{msg}</p><button onClick={onBtn} style={{ background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 14, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{btnText}</button></div></div>);

export default Consultation;
