import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, FlaskConical } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useConsultationFields } from '@/hooks/useConsultationFields';
import { useToast } from '@/hooks/use-toast';
import DynamicField from '@/components/consultation/DynamicField';

const STEPS = ['Sintomas', 'Histórico', 'Exames', 'Anexos'];
const PROFILE_LABEL: Record<string, string> = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };

const Consultation = () => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { fields, loading: fieldsLoading, isFieldRequired } = useConsultationFields();
  const navigate = useNavigate();
  const { toast } = useToast();
  const locRef = useRef(false);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { if (!profileLoading && !user) navigate('/'); }, [user, profileLoading]);

  useEffect(() => {
    if (!user || profileLoading || locRef.current) return;
    locRef.current = true;
    const saved = localStorage.getItem('userLocation');
    const denied = localStorage.getItem('locationDenied');
    if (saved) { setUserLocation(JSON.parse(saved)); setLocationPermission('granted'); return; }
    if (denied === 'true') { setLocationPermission('denied'); return; }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        p => { const l = { lat: p.coords.latitude, lng: p.coords.longitude }; setUserLocation(l); setLocationPermission('granted'); localStorage.setItem('userLocation', JSON.stringify(l)); },
        () => { setLocationPermission('denied'); localStorage.setItem('locationDenied', 'true'); }
      );
    } else setLocationPermission('denied');
  }, [user, profileLoading]);

  const onChange = (name: string, value: any) => {
    setAnswers(p => ({ ...p, [name]: value }));
    const hasVal = value !== undefined && value !== '' && value !== false && value !== null && !(Array.isArray(value) && value.length === 0);
    if (hasVal) {
      const idx = fields.findIndex(f => f.field_name === name);
      if (idx >= 0 && idx + 1 < fields.length && idx + 1 >= visible) {
        setVisible(idx + 2);
        setTimeout(() => refs.current[fields[idx + 1].field_name]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
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
    catch { toast({ title: 'Erro ao processar', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  if (profileLoading || fieldsLoading) return <Loader />;
  if (!profile) return (
    <div style={centered}>
      <p style={{ color: '#6b7280', marginBottom: 16 }}>Complete seu perfil para iniciar uma consulta.</p>
      <button onClick={() => navigate('/profile')} style={btnPrimary}>Completar perfil</button>
    </div>
  );

  const progress = fields.length ? Math.min((visible / fields.length) * 100, 95) : 0;
  const stepIdx = Math.floor((visible / fields.length) * (STEPS.length - 1));
  const allRequiredDone = fields.filter(f => isFieldRequired(f)).every(f => { const v = answers[f.field_name]; return v && (typeof v !== 'string' || v.trim()) && (!Array.isArray(v) || v.length); });

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={16} /></button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, background: '#e6f5f0', color: '#065f46', padding: '3px 10px', borderRadius: 20 }}>
          {PROFILE_LABEL[profile.profile_type]}
        </span>
      </header>

      {/* PROGRESS BAR */}
      <div style={{ height: 3, background: '#e5e7eb' }}>
        <div style={{ height: '100%', background: '#0d7a5f', width: `${progress}%`, transition: 'width .4s ease' }} />
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, color: '#111827', marginBottom: 6, letterSpacing: '-0.3px' }}>Nova Consulta</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Responda as perguntas. Novos campos aparecem conforme você avança.</p>
          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: i <= stepIdx ? '#0d7a5f' : '#e5e7eb', color: i <= stepIdx ? '#fff' : '#9ca3af', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: i === stepIdx ? '2px solid #0d7a5f' : '2px solid transparent', transition: 'all .3s' }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: i <= stepIdx ? '#0d7a5f' : '#9ca3af', fontWeight: i === stepIdx ? 600 : 400 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: i < stepIdx ? '#0d7a5f' : '#e5e7eb' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Fields */}
        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#6b7280' }}>Nenhum campo configurado para seu perfil.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.slice(0, visible).map((field, idx) => {
                const hasVal = (() => { const v = answers[field.field_name]; return v !== undefined && v !== '' && v !== false && v !== null && !(Array.isArray(v) && !v.length); })();
                const isLast = idx === visible - 1;
                return (
                  <div key={field.id} ref={el => { refs.current[field.field_name] = el; }}
                    style={{ background: '#fff', borderRadius: 12, border: `1.5px solid ${isLast ? '#0d7a5f' : hasVal ? '#d1fae5' : '#e5e7eb'}`, padding: '20px 20px 18px', position: 'relative', animation: 'slideUp .3s ease both', transition: 'border-color .2s', opacity: !isLast && hasVal ? 0.8 : 1 }}
                  >
                    {hasVal && !isLast && <CheckCircle2 size={16} color="#0d7a5f" style={{ position: 'absolute', top: 14, right: 14, opacity: 0.6 }} />}
                    <DynamicField field={field} value={answers[field.field_name]} onChange={onChange} required={isFieldRequired(field)} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button type="button" onClick={() => navigate('/dashboard')} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
              <button type="submit" disabled={submitting || !allRequiredDone} style={{ ...btnPrimary, flex: 1, opacity: submitting || !allRequiredDone ? 0.5 : 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
                {submitting ? 'Processando…' : <><Send size={15} /> Iniciar consulta</>}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

const centered: React.CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif", padding: 24 };
const Loader = () => <div style={centered}><div style={{ width: 32, height: 32, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#374151' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'opacity .15s' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 20px', fontWeight: 500, fontSize: 14, cursor: 'pointer' };

export default Consultation;
