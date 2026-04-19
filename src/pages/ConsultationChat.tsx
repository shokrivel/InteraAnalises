import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bot, Copy, CheckCheck, MapPin, Star, Navigation, Map, AlertTriangle, Lightbulb, FlaskConical, FileText } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import HealthcareProvidersMap from '@/components/maps/HealthcareProvidersMap';

interface Specialist { name: string; address: string; rating: number; userRatingsTotal: number; location: { lat: number; lng: number }; placeId: string; specialty: string; }
interface ConsultationResponse { response: string; consultationId?: string; profileType?: string; suggestedSpecialty?: string; specialists?: Specialist[]; }
type TabId = 'resumo' | 'achados' | 'orientacoes' | 'alertas';

const TABS: { id: TabId; label: string; Icon: any }[] = [
  { id: 'resumo',      label: 'Resumo',           Icon: FileText },
  { id: 'achados',     label: 'Achados',           Icon: FlaskConical },
  { id: 'orientacoes', label: 'Orientações',      Icon: Lightbulb },
  { id: 'alertas',     label: 'Alertas',           Icon: AlertTriangle },
];

function parseSections(text: string): Record<TabId, string[]> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const alertKW = /emergência|urgência|procure|atenção|alerta|convuls|desmaio|sangramento|hospital|pronto.socorro/i;
  const orientKW = /recomend|orient|hidrat|repouso|evit|monitor|acompanhe|retorn|consul|medir|verificar|tomar/i;
  const achadosKW = /hemogram|exame|result|valor|normal|alterado|elevad|reduzid|achado|laborat|dosagem/i;
  const s: Record<TabId, string[]> = { resumo: [], achados: [], orientacoes: [], alertas: [] };
  lines.forEach(line => {
    const c = line.replace(/\*\*/g, '').replace(/^[\*\-]\s*/, '').trim();
    if (!c) return;
    if (alertKW.test(c)) s.alertas.push(c);
    else if (achadosKW.test(c)) s.achados.push(c);
    else if (orientKW.test(c)) s.orientacoes.push(c);
    else s.resumo.push(c);
  });
  if (s.achados.length === 0 && s.resumo.length > 3) s.achados = s.resumo.splice(Math.ceil(s.resumo.length / 2));
  if (s.orientacoes.length === 0 && s.resumo.length > 2) s.orientacoes = s.resumo.splice(-2);
  return s;
}

const ConsultationChat = () => {
  const [res, setRes] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabId>('resumo');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const processedRef = useRef(false);

  const consultationData = location.state?.consultationData;
  const userLocation = location.state?.userLocation;
  const locationPermission = location.state?.locationPermission;

  useEffect(() => {
    if (processedRef.current) return;
    if (!user || !consultationData) { navigate('/dashboard'); return; }
    const run = async () => {
      try {
        processedRef.current = true; setLoading(true);
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s?.access_token) throw new Error('Sessão expirada.');
        const { data, error } = await supabase.functions.invoke('gemini-consultation', {
          body: { consultationData, userId: user.id, attachments: consultationData.anexos_e_documentos || [], userLocation, locationPermission },
          headers: { Authorization: `Bearer ${s.access_token}` },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        if (!data?.response) throw new Error('Não foi possível obter resposta da IA.');
        setRes(data);
        if (data.specialists?.length > 0) setSpecialists(data.specialists);
        toast({ title: 'Consulta processada com sucesso!' });
      } catch (err: any) {
        processedRef.current = false;
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        navigate('/dashboard');
      } finally { setLoading(false); }
    };
    run();
  }, [user, consultationData, navigate, toast]);

  const copy = () => {
    if (!res?.response) return;
    navigator.clipboard.writeText(res.response);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const profileLabels: Record<string, string> = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };
  const filtered = specialists.filter(s => s.rating >= ratingFilter);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: '#e6f5f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <Bot size={26} color="#0d7a5f" />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111827', marginBottom: 8 }}>Analisando suas informações...</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>A IA está processando sua consulta.</p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0, 0.15, 0.3].map((d, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d7a5f', animation: `bounce .9s ${d}s ease-in-out infinite` }} />)}
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      `}</style>
    </div>
  );

  if (!res) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Não foi possível processar a consulta.</p>
        <button onClick={() => navigate('/dashboard')} style={btnPrimary}>Voltar ao painel</button>
      </div>
    </div>
  );

  const sections = parseSections(res.response);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        {profile && <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>{profileLabels[profile.profile_type]}</span>}
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px' }}>

        {/* Summary pill */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="#0d7a5f" />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Consulta processada</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                {Array.isArray(consultationData?.symptoms) ? consultationData.symptoms.slice(0, 3).join(' · ') : 'Sintomas informados'}
              </p>
            </div>
          </div>
          {res.suggestedSpecialty && (
            <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20 }}>{res.suggestedSpecialty}</span>
          )}
        </div>

        {/* AI Response card */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
          {/* Card header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={14} color="#0d7a5f" /></div>
              <span style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>InteraAnalises AI</span>
              <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20 }}>Gemini 2.5</span>
            </div>
            <button onClick={copy} style={chipBtn}>{copied ? <><CheckCheck size={13} color="#0d7a5f" /> Copiado</> : <><Copy size={13} /> Copiar</>}</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', overflowX: 'auto' }}>
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '11px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === id ? '#0d7a5f' : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400, color: tab === id ? '#0d7a5f' : '#9ca3af', whiteSpace: 'nowrap', transition: 'color .15s' }}>
                <Icon size={13} />{label}
                {sections[id].length > 0 && (
                  <span style={{ background: tab === id ? '#e6f5f0' : '#f3f4f6', color: tab === id ? '#065f46' : '#9ca3af', fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, marginLeft: 2 }}>{sections[id].length > 9 ? '9+' : sections[id].length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: '18px 20px', minHeight: 180 }} key={tab}>
            {sections[tab].length === 0 ? (
              <p style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>Nenhuma informação nesta seção.</p>
            ) : sections[tab].map((line, i) => (
              <div key={i} style={{
                fontSize: 13.5, lineHeight: 1.7, padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                background: tab === 'alertas' ? '#fff8ec' : tab === 'orientacoes' ? '#f0faf7' : '#f9fafb',
                border: tab === 'alertas' ? '1px solid #fcd34d' : tab === 'orientacoes' ? '1px solid #d1fae5' : '1px solid #f3f4f6',
                color: tab === 'alertas' ? '#92400e' : '#374151',
                animation: `fadeUp .2s ${i * 0.04}s ease both`,
              }}>
                {tab === 'alertas' && <AlertTriangle size={13} color="#d97706" style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />}
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Specialists */}
        {filtered.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={15} color="#0d7a5f" />
                <span style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>Especialistas próximos</span>
                {res.suggestedSpecialty && <span style={{ fontSize: 12, color: '#9ca3af' }}>— {res.suggestedSpecialty}</span>}
              </div>
              <select value={ratingFilter} onChange={e => setRatingFilter(Number(e.target.value))} style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', color: '#374151', background: '#fff', cursor: 'pointer' }}>
                <option value={0}>Todas avaliações</option>
                <option value={3}>3+ estrelas</option>
                <option value={4}>4+ estrelas</option>
                <option value={4.5}>4.5+ estrelas</option>
              </select>
            </div>
            {filtered.map((s, i) => (
              <div key={s.placeId} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 18px', borderBottom: '1px solid #f9fafb', background: i === 0 ? '#f0faf7' : '#fff', transition: 'background .15s' }}
                onMouseEnter={e => { if (i > 0) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (i > 0) e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? '#0d7a5f' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: i === 0 ? '#fff' : '#6b7280' }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, fontSize: 13.5, color: '#111827' }}>{s.name}</p>
                    {i === 0 && <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Mais próximo</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} /> {s.address}</p>
                  {s.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      {[1,2,3,4,5].map(star => <Star key={star} size={11} color="#f59e0b" fill={star <= s.rating ? '#f59e0b' : 'transparent'} />)}
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 3 }}>{s.rating} ({s.userRatingsTotal})</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${s.placeId}`, '_blank')} style={iconBtn}><MapPin size={13} /></button>
                  <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}&destination_place_id=${s.placeId}`, '_blank')} style={{ ...iconBtn, background: '#0d7a5f', color: '#fff', border: 'none' }}><Navigation size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        {showMap && specialists.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>Mapa interativo</span>
              <button onClick={() => setShowMap(false)} style={chipBtn}>Fechar</button>
            </div>
            <div style={{ padding: 16 }}>
              <HealthcareProvidersMap userAddress={profile?.address && profile?.city ? `${profile.address}, ${profile.city}` : undefined} providers={specialists} onClose={() => setShowMap(false)} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {specialists.length > 0 && (
            <button onClick={() => setShowMap(!showMap)} style={chipBtn}><Map size={13} /> {showMap ? 'Ocultar mapa' : 'Ver mapa'}</button>
          )}
          <button onClick={() => navigate('/consultation')} style={btnPrimary}>Nova consulta</button>
          <button onClick={() => navigate('/dashboard')} style={chipBtn}>Painel</button>
        </div>

        {/* Disclaimer */}
        <div style={{ background: '#fff8ec', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px' }}>
          <p style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.7 }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            <strong>Importante:</strong> Esta resposta é gerada por IA para fins informativos e não substitui diagnóstico médico profissional.
            {res.consultationId && <span style={{ marginLeft: 6, opacity: 0.5 }}>ID: {res.consultationId.slice(0, 8)}…</span>}
          </p>
        </div>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const chipBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb', cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const iconBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' };

export default ConsultationChat;
