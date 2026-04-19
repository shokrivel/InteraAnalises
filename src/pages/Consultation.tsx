import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useConsultationFields } from '@/hooks/useConsultationFields';
import { useToast } from '@/hooks/use-toast';
import DynamicField from '@/components/consultation/DynamicField';
import { useRef } from 'react';

const STEP_LABELS = ['Sintomas', 'Histórico', 'Exames', 'Anexos'];

const profileLabels: Record<string, string> = {
  patient: 'Paciente',
  academic: 'Acadêmico',
  health_professional: 'Profissional de Saúde',
};

const profileColors: Record<string, string> = {
  patient: '#e6f5f0',
  academic: '#e8f3fa',
  health_professional: '#fef3c7',
};

const profileTextColors: Record<string, string> = {
  patient: '#065f46',
  academic: '#1e3a5f',
  health_professional: '#92400e',
};

const Consultation = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
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
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { const l = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUserLocation(l); setLocationPermission('granted'); localStorage.setItem('userLocation', JSON.stringify(l)); },
        () => { setLocationPermission('denied'); localStorage.setItem('locationDenied', 'true'); }
      );
    } else setLocationPermission('denied');
  }, [user, profileLoading]);

  const hasVal = (v: any) => v !== undefined && v !== '' && v !== false && v !== null && !(Array.isArray(v) && v.length === 0);

  const handleChange = (name: string, value: any) => {
    setAnswers(p => ({ ...p, [name]: value }));
    if (hasVal(value)) {
      const idx = fields.findIndex(f => f.field_name === name);
      if (idx >= 0 && idx + 1 < fields.length && idx + 1 >= visibleCount) {
        setVisibleCount(idx + 2);
        setTimeout(() => fieldRefs.current[fields[idx + 1].field_name]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;
    const missing = fields.filter(f => isFieldRequired(f) && !hasVal(answers[f.field_name]));
    if (missing.length > 0) { toast({ title: 'Campos obrigatórios', description: `Preencha: ${missing.map(f => f.field_label).join(', ')}`, variant: 'destructive' }); return; }
    setLoading(true);
    try { navigate('/consultation-chat', { state: { consultationData: answers, userLocation, locationPermission } }); }
    catch { toast({ title: 'Erro', description: 'Tente novamente', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  if (profileLoading || fieldsLoading) return <LoadingScreen text="Carregando..." />;
  if (!profile) return (
    <div style={centerStyle}>
      <p style={{ color: '#6b7280', marginBottom: 20 }}>Complete seu perfil primeiro.</p>
      <button onClick={() => navigate('/profile')} style={btnPrimary}>Completar perfil</button>
    </div>
  );

  const progress = fields.length > 0 ? Math.min((visibleCount / fields.length) * 100, 95) : 0;
  const requiredDone = fields.filter(f => isFieldRequired(f)).every(f => hasVal(answers[f.field_name]));
  const stepIdx = Math.floor((visibleCount / fields.length) * (STEP_LABELS.length - 1));
  const profColor = profileColors[profile.profile_type] || '#e6f5f0';
  const profText = profileTextColors[profile.profile_type] || '#065f46';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <span style={{ background: profColor, color: profText, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
          {profileLabels[profile.profile_type]}
        </span>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: '#111827', marginBottom: 6, letterSpacing: '-0.3px' }}>Nova consulta</h1>
          <p style={{ fontSize: 13.5, color: '#6b7280' }}>Responda as perguntas abaixo. Novos campos aparecem conforme você avança.</p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: i <= stepIdx ? '#0d7a5f' : '#e5e7eb', color: i <= stepIdx ? '#fff' : '#9ca3af', fontWeight: 600, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: i === stepIdx ? '2px solid #065f46' : '2px solid transparent', transition: 'all .3s' }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: i <= stepIdx ? '#0d7a5f' : '#9ca3af', fontWeight: i === stepIdx ? 600 : 400 }}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <div style={{ width: 20, height: 1.5, background: i < stepIdx ? '#0d7a5f' : '#e5e7eb', transition: 'background .3s' }} />}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#0d7a5f', borderRadius: 99, width: `${progress}%`, transition: 'width .5s ease' }} />
          </div>
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>Nenhum campo configurado para seu perfil.</p>
            <button onClick={() => navigate('/dashboard')} style={btnOutline}>Voltar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.slice(0, visibleCount).map((field, idx) => {
                const v = answers[field.field_name];
                const answered = hasVal(v);
                const isLast = idx === visibleCount - 1;
                return (
                  <div key={field.id}
                    ref={el => { fieldRefs.current[field.field_name] = el; }}
                    style={{ background: '#ffffff', borderRadius: 12, border: `1.5px solid ${isLast ? '#0d7a5f' : answered ? '#d1fae5' : '#e5e7eb'}`, padding: '18px 20px', position: 'relative', animation: 'fadeUp .3s ease both', opacity: answered && !isLast ? 0.85 : 1 }}
                  >
                    {answered && !isLast && (
                      <div style={{ position: 'absolute', top: 14, right: 14 }}>
                        <CheckCircle2 size={15} color="#059669" />
                      </div>
                    )}
                    <DynamicField field={field} value={v} onChange={handleChange} required={isFieldRequired(field)} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => navigate('/dashboard')} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
              <button type="submit" disabled={loading || !requiredDone} style={{ ...btnPrimary, flex: 2, opacity: loading || !requiredDone ? 0.5 : 1, cursor: loading || !requiredDone ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Processando…' : <><Send size={15} /> Enviar para análise</>}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

const LoadingScreen = ({ text }: { text: string }) => (
  <div style={centerStyle}>
    <div style={{ width: 36, height: 36, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <p style={{ color: '#6b7280', marginTop: 14, fontSize: 14 }}>{text}</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const centerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 14, padding: '11px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#374151', fontSize: 14, fontWeight: 500, padding: '11px 20px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center' };

export default Consultation;
