import './ia-bg.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import { supabase } from '@/integrations/supabase/client';

type Section = 'auth' | 'news' | 'pricing' | 'about' | 'contact' | null;

const NEWS = [
  { date: 'Mai 2026', tag: 'Atualizacao', title: 'IA Gemini 2.5 agora disponivel', body: 'A nova versao analisa exames com ainda mais precisao e retorna indicacoes de especialistas em segundos.' },
  { date: 'Abr 2026', tag: 'Feature', title: 'Busca de especialistas por localizacao', body: 'O sistema detecta sua localizacao e sugere profissionais proximos apos a analise.' },
  { date: 'Mar 2026', tag: 'Parceria', title: 'InteraAnalises + InteraSaude', body: 'Integracao completa com o ecossistema InteraSaude para acompanhamento longitudinal.' },
];
const PLANS = [
  { name: 'Gratuito', price: 'R$ 0', period: '/mes', features: ['3 analises por mes', 'Indicacao de especialista'], cta: 'Comecar gratis', hi: false },
  { name: 'Profissional', price: 'R$ 29,90', period: '/mes', features: ['Analises ilimitadas', 'Todos os perfis clinicos', 'Relatorio PDF'], cta: 'Assinar agora', hi: true },
  { name: 'Clinica', price: 'R$ 99,90', period: '/mes', features: ['Multiplos usuarios', 'API de integracao', 'SLA 99,9%'], cta: 'Falar com vendas', hi: false },
];
const TEAM = [
  { name: 'Dr. Igor Souza', role: 'Fundador & Biomedico' },
  { name: 'Dra. Ana Ferreira', role: 'Parasitologia Clinica' },
  { name: 'Prof. Carlos Lima', role: 'Hematologia & IA Medica' },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', msg: '' });

  if (!loading && user) { navigate('/dashboard'); return null; }

  const toggle = (s: Section) => setActive(p => p === s ? null : s);

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await supabase.from('contact_messages').insert({ name: form.name, email: form.email, message: form.msg });
    setSending(false); setSent(true);
    setForm({ name: '', email: '', msg: '' });
    setTimeout(() => setSent(false), 4000);
  };

  const MENU: Array<{ id: Section; label: string }> = [
    { id: 'auth',    label: 'Entrar/Cadastre-se' },
    { id: 'news',    label: 'Noticias e updates' },
    { id: 'pricing', label: 'Assinatura' },
    { id: 'about',   label: 'Quem somos?' },
    { id: 'contact', label: 'Contato' },
  ];

  const renderContent = () => {
    switch (active) {
      case 'auth': return (
        <div style={{ maxWidth: 300 }}>
          <h2 style={ptitle}>Acesse sua conta</h2>
          <p style={psub}>Entre para analisar seus exames com IA ou crie uma conta gratuita.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
            <button onClick={() => { setAuthOpen(true); setActive(null); }} style={btnP}>Entrar</button>
            <button onClick={() => { setAuthOpen(true); setActive(null); }} style={btnO}>Criar conta gratis</button>
          </div>
        </div>
      );
      case 'news': return (
        <div style={{ maxWidth: 300 }}>
          <h2 style={ptitle}>Noticias & Updates</h2>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {NEWS.map((n, i) => (
              <div key={i} style={{ borderLeft: '3px solid #3b4da0', paddingLeft: 14 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(59,77,160,0.12)', color: '#3b4da0', padding: '2px 8px', borderRadius: 20 }}>{n.tag}</span>
                  <span style={{ fontSize: 10, color: '#999' }}>{n.date}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2d4e', marginBottom: 4 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'pricing': return (
        <div style={{ maxWidth: 300 }}>
          <h2 style={ptitle}>Planos & Assinatura</h2>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLANS.map((pl, i) => (
              <div key={i} style={{ border: pl.hi ? '1.5px solid #3b4da0' : '1px solid #d0d0e0', borderRadius: 12, padding: '12px 14px', background: pl.hi ? 'rgba(59,77,160,0.06)' : '#fff', position: 'relative' }}>
                {pl.hi && <span style={{ position: 'absolute', top: -9, right: 12, background: '#3b4da0', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>POPULAR</span>}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#2d2d4e' }}>{pl.name}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: pl.hi ? '#3b4da0' : '#2d2d4e' }}>{pl.price}<span style={{ fontSize: 10, opacity: .6 }}>{pl.period}</span></span>
                </div>
                <ul style={{ margin: '0 0 10px', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {pl.features.map((f, j) => (<li key={j} style={{ fontSize: 12, color: '#555', display: 'flex', gap: 6 }}><span style={{ color: '#3b4da0' }}>&#10003;</span>{f}</li>))}
                </ul>
                <button onClick={() => { setAuthOpen(true); setActive(null); }} style={{ ...btnO, padding: '7px 0', fontSize: 12, width: '100%', ...(pl.hi ? { background: '#3b4da0', borderColor: '#3b4da0', color: '#fff', fontWeight: 700 } : {}) }}>{pl.cta}</button>
              </div>
            ))}
          </div>
        </div>
      );
      case 'about': return (
        <div style={{ maxWidth: 300 }}>
          <h2 style={ptitle}>Quem somos?</h2>
          <p style={{ ...psub, marginBottom: 16 }}>Somos uma startup brasileira de healthtech que desenvolve IA especializada em analises laboratoriais - Parasitologia, Bioquimica e Hematologia.</p>
          {TEAM.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(59,77,160,0.05)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(59,77,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#3b4da0', flexShrink: 0 }}>{t.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: '#2d2d4e' }}>{t.name}</div><div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t.role}</div></div>
            </div>
          ))}
        </div>
      );
      case 'contact': return (
        <div style={{ maxWidth: 300 }}>
          <h2 style={ptitle}>Contato</h2>
          {sent ? (
            <div style={{ background: 'rgba(59,77,160,0.08)', border: '1px solid #3b4da0', borderRadius: 10, padding: 20, marginTop: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>OK</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#3b4da0' }}>Mensagem enviada!</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Retornaremos em ate 24h.</div>
            </div>
          ) : (
            <form onSubmit={sendContact} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([{ l: 'Nome', k: 'name', t: 'text', p: 'Seu nome' }, { l: 'E-mail', k: 'email', t: 'email', p: 'email@exemplo.com' }] as any[]).map(f => (
                <div key={f.k}>
                  <label style={plbl}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} required value={(form as any)[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={pinp} />
                </div>
              ))}
              <div>
                <label style={plbl}>Mensagem</label>
                <textarea rows={4} required value={form.msg} onChange={e => setForm(p => ({ ...p, msg: e.target.value }))} style={{ ...pinp, resize: 'none', height: 88 }} />
              </div>
              <button type="submit" disabled={sending} style={{ ...btnP, opacity: sending ? .7 : 1 }}>{sending ? 'Enviando...' : 'Enviar'}</button>
            </form>
          )}
          <div style={{ marginTop: 14, fontSize: 11, color: '#888', lineHeight: 1.8 }}>contato@interaanalises.com.br</div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        .ia-root { width: 100vw; height: 100vh; display: flex; font-family: 'Inter', sans-serif; overflow: hidden; position: fixed; top: 0; left: 0; }
        .ia-left { flex: 1; position: relative; overflow: hidden; min-width: 0; }
        .ia-bg { position: absolute; inset: 0; background-size: cover; background-position: center center; background-repeat: no-repeat; }
        .ia-hero { position: absolute; top: 50%; left: 0; transform: translateY(-60%); padding: 0 52px; }
        .ia-title { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(64px, 8vw, 108px); font-weight: 900; line-height: 0.88; letter-spacing: -1px; color: #3b4da0; }
        .ia-title span { display: block; }
        .ia-diag { display: inline-block; margin-top: 20px; border: 2px solid rgba(59,77,160,0.45); border-radius: 40px; padding: 10px 26px; font-family: 'Inter', sans-serif; font-size: clamp(13px, 1.4vw, 18px); font-weight: 600; color: #3b4da0; background: rgba(255,255,255,0.2); backdrop-filter: blur(3px); }
        .ia-right { width: 390px; flex-shrink: 0; background: #e8e9ea; display: flex; flex-direction: row; transition: width 0.3s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
        .ia-right.expanded { width: 690px; }
        .ia-menu { width: 390px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 0 36px; }
        .ia-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 40px; background: #fff; border: 1px solid rgba(0,0,0,0.08); cursor: pointer; transition: all .15s; box-shadow: 0 1px 4px rgba(0,0,0,0.06); font-family: 'Inter', sans-serif; width: 100%; text-align: left; }
        .ia-item:hover { background: #f5f5fa; border-color: rgba(59,77,160,0.3); }
        .ia-item.active { background: #eef0fa; border-color: rgba(59,77,160,0.5); box-shadow: 0 0 0 2px rgba(59,77,160,0.12); }
        .ia-star { width: 20px; height: 20px; flex-shrink: 0; }
        .ia-label { flex: 1; font-size: 14px; font-weight: 600; color: #2d2d4e; letter-spacing: 0.1px; }
        .ia-panel { flex: 1; overflow-y: auto; padding: 44px 32px; border-left: 1px solid rgba(0,0,0,0.08); background: #f0f1f5; }
        .ia-panel::-webkit-scrollbar { width: 4px; }
        .ia-panel::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }
      `}</style>

      <div className="ia-root">
        <div className="ia-left">
          <div className="ia-bg" />
          <div className="ia-hero">
            <div className="ia-title">
              <span>Intera</span>
              <span>Analises</span>
            </div>
            <div className="ia-diag">Diagnosticos direcionais</div>
          </div>
        </div>

        <div className={`ia-right${active ? ' expanded' : ''}`}>
          <div className="ia-menu">
            {MENU.map(item => (
              <button
                key={item.id}
                className={`ia-item${active === item.id ? ' active' : ''}`}
                onClick={() => toggle(item.id)}
              >
                <svg className="ia-star" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C10.5 7 7 10.5 2 12c5 1.5 8.5 5 10 10 1.5-5 5-8.5 10-10-5-1.5-8.5-5-10-10z" fill="#FF8A65" />
                </svg>
                <span className="ia-label">{item.label}</span>
                <svg width="7" height="12" viewBox="0 0 7 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M1 1l5 5-5 5" stroke={active === item.id ? '#3b4da0' : '#bbb'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>

          {active && (
            <div className="ia-panel">
              {renderContent()}
            </div>
          )}
        </div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}

const ptitle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#2d2d4e', marginBottom: 8, letterSpacing: '-0.2px' };
const psub: React.CSSProperties = { fontSize: 13, color: '#555', lineHeight: 1.65 };
const btnP: React.CSSProperties = { background: '#3b4da0', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' };
const btnO: React.CSSProperties = { background: 'transparent', color: '#3b4da0', border: '1.5px solid #3b4da0', borderRadius: 10, padding: '12px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' };
const plbl: React.CSSProperties = { display: 'block', fontSize: 9, fontWeight: 700, color: '#999', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 5 };
const pinp: React.CSSProperties = { width: '100%', background: '#f8f8fb', border: '1px solid #d0d0e0', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#2d2d4e', outline: 'none' };
