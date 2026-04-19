import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import AuthDialog from '@/components/auth/AuthDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Microscope, Users, Clock, Shield, ChevronRight, Menu, X } from 'lucide-react';

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const goOrAuth = () => { if (!loading) user ? navigate('/consultation') : setAuthOpen(true); };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#ffffff', color: '#111827', minHeight: '100vh' }}>

      {/* ─── NAV ───────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loading && (
            user ? (
              <button onClick={() => navigate('/dashboard')} style={btnPrimary}>Ir para o painel</button>
            ) : (
              <>
                <button onClick={() => setAuthOpen(true)} style={btnGhost}>Entrar</button>
                <button onClick={() => setAuthOpen(true)} style={btnPrimary}>Criar conta grátis</button>
              </>
            )
          )}
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────── */}
      <section style={{ padding: '80px 24px 72px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={badge}>IA Gemini 2.5 · Gratuito para começar</div>
        <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.15, color: '#111827', margin: '20px 0 18px', letterSpacing: '-0.5px' }}>
          Entenda seus exames<br />
          <span style={{ color: '#0d7a5f' }}>de forma simples e segura</span>
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#6b7280', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Descreva seus sintomas ou envie seus resultados. Nossa IA explica tudo em uma linguagem que qualquer pessoa entende.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={goOrAuth} style={{ ...btnPrimary, padding: '14px 32px', fontSize: 16, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? 'Iniciar consulta' : 'Começar agora — é grátis'} <ChevronRight size={18} />
          </button>
          <button onClick={() => navigate('/saiba-mais')} style={{ ...btnGhost, padding: '14px 28px', fontSize: 15, borderRadius: 10 }}>Saiba mais</button>
        </div>
        {/* Trust strip */}
        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
          {[
            { n: '3', l: 'áreas médicas' },
            { n: '24/7', l: 'disponível' },
            { n: '100%', l: 'baseado em ciência' },
          ].map(({ n, l }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#0d7a5f' }}>{n}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────── */}
      <section style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '64px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }} className="fade-up">
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0d7a5f', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Como funciona</p>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Três passos simples</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { step: '1', title: 'Descreva', desc: 'Informe seus sintomas, hábitos e resultados de exames no formulário guiado.' },
              { step: '2', title: 'IA analisa', desc: 'O Gemini 2.5 interpreta suas informações com base em literatura médica atual.' },
              { step: '3', title: 'Entenda', desc: 'Receba uma explicação clara, alertas e indicação de especialista quando necessário.' },
            ].map(({ step, title, desc }, i) => (
              <div key={step} className="fade-up" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 28, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -8, right: -4, fontFamily: "'Inter',sans-serif", fontSize: 80, fontWeight: 800, color: '#0d7a5f', opacity: 0.06, lineHeight: 1, userSelect: 'none' }}>{step}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#0d7a5f' }}>{step}</span>
                </div>
                <h3 style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AREAS ─────────────────────────────────── */}
      <section style={{ padding: '64px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#0d7a5f', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Especialidades</p>
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>O que podemos analisar</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { emoji: '🤬', title: 'Parasitologia', desc: 'Exames de fezes, infecções parasitárias, doenças tropicais e mais.', color: '#e6f5f0', textC: '#065f46' },
            { emoji: '🧪', title: 'Bioquímica', desc: 'Glicemia, colesterol, função renal, hepática e marcadores gerais.', color: '#e8f3fa', textC: '#1e3a5f' },
            { emoji: '🩸', title: 'Hematologia', desc: 'Hemograma completo, anemias, plaquetas e doenças do sangue.', color: '#fef2f2', textC: '#7f1d1d' },
          ].map(({ emoji, title, desc, color, textC }) => (
            <div key={title} className="fade-up" style={{ background: color, borderRadius: 14, padding: '28px 24px', border: '1px solid transparent' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{emoji}</div>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: textC, marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: textC, opacity: 0.75, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PARA QUEM ─────────────────────────────── */}
      <section style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '64px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#0d7a5f', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>Para quem é</p>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Serve para qualquer pessoa</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '👤', title: 'Paciente comum', desc: 'Receba explicações simples, sem termos técnicos difíceis de entender.', tag: 'Linguagem simples' },
              { icon: '🎓', title: 'Estudante de saúde', desc: 'Aprofunde seu estudo com respostas baseadas em literatura atualizada.', tag: 'Nível técnico' },
              { icon: '🩺', title: 'Profissional de saúde', desc: 'Consulte rápido, compare valores de referência e acesse sugestões clínicas.', tag: 'Nível avançado' },
            ].map(({ icon, title, desc, tag }) => (
              <div key={title} className="fade-up" style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <h3 style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.65, marginBottom: 14 }}>{desc}</p>
                <span style={{ display: 'inline-block', background: '#e6f5f0', color: '#065f46', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DISCLAIMER ─────────────────────────────── */}
      <section style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto', textAlign: 'center' }} className="fade-up">
        <div style={{ background: '#fff8ec', border: '1px solid #fcd34d', borderRadius: 12, padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
            <strong>Importante:</strong> O InteraAnalises fornece informações educativas baseadas em IA. As respostas não substituem consulta médica. Em caso de dúvida, procure sempre um profissional de saúde.
          </p>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────── */}
      <section style={{ background: '#0d7a5f', padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }} className="fade-up">
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: '#ffffff', marginBottom: 16, letterSpacing: '-0.3px' }}>Pronto para entender seus exames?</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginBottom: 32 }}>Sem custo. Sem burocracia. Resultado em segundos.</p>
          <button onClick={goOrAuth} style={{ background: '#ffffff', color: '#0d7a5f', fontWeight: 700, fontSize: 15, padding: '14px 36px', borderRadius: 10, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Começar agora <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────── */}
      <footer style={{ background: '#111827', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <InteraAnalisesLogo size="sm" inverted />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          © 2026 InteraAnalises · <a href="https://interasaude.vercel.app" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>InteraSaúde</a> · Plataforma educativa em saúde
        </p>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
};

const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#ffffff', fontWeight: 600, fontSize: 14, padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'opacity .15s' };
const btnGhost: React.CSSProperties = { background: 'transparent', color: '#374151', fontWeight: 500, fontSize: 14, padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const badge: React.CSSProperties = { display: 'inline-block', background: '#e6f5f0', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.3px' };

export default Index;
