import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bot, MapPin, Star, Navigation, Map, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import HealthcareProvidersMap from '@/components/maps/HealthcareProvidersMap';

interface Specialist {
  name: string; address: string; rating: number;
  userRatingsTotal: number; location: { lat: number; lng: number };
  placeId: string; specialty: string;
}
interface ConsultationResponse {
  response: string; consultationId?: string;
  profileType?: string; suggestedSpecialty?: string;
  specialists?: Specialist[];
}

// Extrai do texto da IA apenas a especialidade recomendada
function extractSpecialtyHint(text: string, suggested?: string): string {
  if (suggested) return suggested;
  const m = text.match(/especialista em ([^.\n,]+)/i)
    || text.match(/(?:procure|consulte|encaminhe)[^.]*?(\w+[olog|iatr|iatria|ologia]+)/i);
  return m ? m[1].trim() : 'especialista';
}

const ConsultationChat = () => {
  const [res, setRes] = useState<ConsultationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [ratingFilter, setRatingFilter] = useState(0);
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const processedRef = useRef(false);

  const consultationData  = location.state?.consultationData;
  const userLocation      = location.state?.userLocation;
  const locationPermission = location.state?.locationPermission;

  useEffect(() => {
    if (processedRef.current) return;
    if (!user || !consultationData) { navigate('/dashboard'); return; }
    const run = async () => {
      try {
        processedRef.current = true;
        setLoading(true);
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!s?.access_token) throw new Error('Sessão expirada.');
        const { data, error } = await supabase.functions.invoke('gemini-consultation', {
          body: { consultationData, userId: user.id, attachments: consultationData.anexos_e_documentos || [], userLocation, locationPermission },
          headers: { Authorization: `Bearer ${s.access_token}` },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);
        if (!data?.response) throw new Error('Não foi possível processar a consulta.');
        setRes(data);
        if (data.specialists?.length > 0) setSpecialists(data.specialists);
        toast({ title: 'Consulta processada!' });
      } catch (err: any) {
        processedRef.current = false;
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
        navigate('/dashboard');
      } finally { setLoading(false); }
    };
    run();
  }, [user, consultationData, navigate, toast]);

  const profileLabels: Record<string, string> = {
    patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde',
  };
  const filtered = specialists.filter(s => s.rating >= ratingFilter);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ width: 64, height: 64, background: '#e6f5f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <Bot size={30} color="#0d7a5f" />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 19, color: '#111827', marginBottom: 8 }}>Analisando suas informações…</h2>
        <p style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 24, maxWidth: 320 }}>
          A IA está processando sua consulta e identificando os melhores especialistas.
        </p>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#0d7a5f', animation: `bounce .9s ${d}s ease-in-out infinite` }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
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

  const specialtyHint = extractSpecialtyHint(res.response, res.suggestedSpecialty);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        {profile && (
          <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>
            {profileLabels[profile.profile_type]}
          </span>
        )}
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* ── CARD: Consulta concluída ── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '28px 28px 24px', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={28} color="#0d7a5f" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 8, letterSpacing: '-0.3px' }}>
            Consulta concluída
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 20px' }}>
            Suas informações foram analisadas. Com base nos dados fornecidos,
            recomendamos que você procure um <strong style={{ color: '#0d7a5f' }}>{specialtyHint}</strong> para
            avaliação presencial e acompanhamento.
          </p>
          {res.suggestedSpecialty && (
            <span style={{ display: 'inline-block', background: '#e6f5f0', color: '#065f46', fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 20 }}>
              Especialidade recomendada: {res.suggestedSpecialty}
            </span>
          )}
        </div>

        {/* ── CARD: Especialistas próximos ── */}
        {filtered.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={15} color="#0d7a5f" />
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Profissionais recomendados próximos</span>
              </div>
              <select
                value={ratingFilter}
                onChange={e => setRatingFilter(Number(e.target.value))}
                style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 10px', color: '#374151', background: '#fff', cursor: 'pointer' }}
              >
                <option value={0}>Todas avaliações</option>
                <option value={3}>3+ estrelas</option>
                <option value={4}>4+ estrelas</option>
                <option value={4.5}>4.5+ estrelas</option>
              </select>
            </div>

            {filtered.map((sp, i) => (
              <div
                key={sp.placeId}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f3f4f6' : 'none', background: i === 0 ? '#f0faf7' : '#fff', transition: 'background .15s' }}
                onMouseEnter={e => { if (i > 0) e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={e => { if (i > 0) e.currentTarget.style.background = '#fff'; }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 9, background: i === 0 ? '#0d7a5f' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: i === 0 ? '#fff' : '#6b7280' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{sp.name}</p>
                    {i === 0 && <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Mais próximo</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3, marginBottom: sp.rating > 0 ? 4 : 0 }}>
                    <MapPin size={11} /> {sp.address}
                  </p>
                  {sp.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {[1,2,3,4,5].map(star => <Star key={star} size={11} color="#f59e0b" fill={star <= sp.rating ? '#f59e0b' : 'transparent'} />)}
                      <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 3 }}>{sp.rating} ({sp.userRatingsTotal})</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/place/?q=place_id:${sp.placeId}`, '_blank')}
                    style={iconBtn} title="Ver no Maps"
                  ><MapPin size={13} /></button>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${sp.location.lat},${sp.location.lng}`, '_blank')}
                    style={{ ...iconBtn, background: '#0d7a5f', color: '#fff', border: 'none' }} title="Como chegar"
                  ><Navigation size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mapa ── */}
        {showMap && specialists.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Mapa interativo</span>
              <button onClick={() => setShowMap(false)} style={chipBtn}>Fechar</button>
            </div>
            <div style={{ padding: 16 }}>
              <HealthcareProvidersMap
                userAddress={profile?.address && profile?.city ? `${profile.address}, ${profile.city}` : undefined}
                providers={specialists}
                onClose={() => setShowMap(false)}
              />
            </div>
          </div>
        )}

        {/* ── Ações ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {specialists.length > 0 && (
            <button onClick={() => setShowMap(!showMap)} style={chipBtn}>
              <Map size={13} /> {showMap ? 'Ocultar mapa' : 'Ver no mapa'}
            </button>
          )}
          <button onClick={() => navigate('/consultation')} style={btnPrimary}>Nova consulta</button>
          <button onClick={() => navigate('/dashboard')} style={chipBtn}>Painel</button>
        </div>

        {/* ── Disclaimer ── */}
        <div style={{ background: '#fff8ec', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px' }}>
          <p style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.7 }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
            <strong>Importante:</strong> Esta análise é gerada por IA para fins de orientação e não substitui
            avaliação médica profissional. Consulte sempre um profissional de saúde habilitado.
          </p>
        </div>
      </div>
    </div>
  );
};

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const chipBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb', cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 };
const iconBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', cursor: 'pointer' };

export default ConsultationChat;
