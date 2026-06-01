import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import { supabase } from '@/integrations/supabase/client';
// @ts-ignore
import logoImg from '@/assets/InteraAnalisesLogo.png';

type Panel = 'auth' | 'news' | 'newsletter' | 'about' | 'contact' | null;

const TEAL       = '#00BDB0';
const TEAL_DARK  = '#008F89';
const TEAL_LIGHT = '#E0F7F6';
const SLATE      = '#3D4A52';
const GRAY_BG    = '#e8e9ea';

const T = {
  ptitle:     { fontSize:18, fontWeight:700, color:SLATE, margin:'0 0 8px' } as React.CSSProperties,
  psub:       { fontSize:13, color:'#6b7280', lineHeight:1.65, margin:0 } as React.CSSProperties,
  plbl:       { display:'block', fontSize:9, fontWeight:700, color:'#8C9BAA', letterSpacing:1.5, textTransform:'uppercase' as const, marginBottom:5 },
  pinp:       { width:'100%', background:'#fff', border:'1px solid #d1d9de', borderRadius:8, padding:'9px 12px', fontSize:13, color:SLATE, outline:'none', fontFamily:"'Inter',sans-serif" } as React.CSSProperties,
  btnFill:    { background:TEAL, color:'#fff', border:'none', borderRadius:10, padding:'11px 18px', fontSize:13, fontWeight:600, cursor:'pointer', width:'100%', fontFamily:"'Inter',sans-serif" } as React.CSSProperties,
  btnOutline: { background:'transparent', color:TEAL_DARK, border:`1.5px solid ${TEAL}`, borderRadius:10, padding:'11px 18px', fontSize:13, fontWeight:600, cursor:'pointer', width:'100%', fontFamily:"'Inter',sans-serif" } as React.CSSProperties,
};

const MENU: Array<{ id: Panel; label: string }> = [
  { id: 'auth',       label: 'Entrar/Cadastre-se' },
  { id: 'news',       label: 'Noticias e updates'  },
  { id: 'newsletter', label: 'Assinatura'           },
  { id: 'about',      label: 'Quem somos?'          },
  { id: 'contact',    label: 'Contato'              },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen]               = useState<Panel>(null);
  const [authOpen, setAuthOpen]       = useState(false);
  const [email, setEmail]             = useState('');
  const [subDone, setSubDone]         = useState(false);
  const [subLoading, setSubLoading]   = useState(false);
  const [contactForm, setContactForm] = useState({ name:'', email:'', msg:'' });
  const [contactDone, setContactDone] = useState(false);
  const [contactSending, setContactSending] = useState(false);

  if (!loading && user) { navigate('/dashboard'); return null; }
  const toggle = (p: Panel) => setOpen(prev => prev === p ? null : p);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubLoading(true);
    await supabase.from('newsletter_subscribers').insert({ email });
    setSubLoading(false); setSubDone(true); setEmail('');
  };

  const sendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    await supabase.from('contact_messages').insert({ name:contactForm.name, email:contactForm.email, message:contactForm.msg });
    setContactSending(false); setContactDone(true);
    setContactForm({ name:'', email:'', msg:'' });
    setTimeout(() => setContactDone(false), 5000);
  };

  const panel = () => {
    switch (open) {
      case 'auth': return (
        <div>
          <h2 style={T.ptitle}>Bem-vindo</h2>
          <p style={T.psub}>Acesse sua conta ou crie uma gratuitamente para usar a plataforma.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:22 }}>
            <button style={T.btnFill}    onClick={() => { setAuthOpen(true); setOpen(null); }}>Entrar na conta</button>
            <button style={T.btnOutline} onClick={() => { setAuthOpen(true); setOpen(null); }}>Criar conta gratis</button>
          </div>
        </div>
      );
      case 'news': return (
        <div>
          <h2 style={T.ptitle}>Noticias e updates</h2>
          <p style={T.psub}>Fique por dentro das novidades da plataforma e da medicina diagnostica.</p>
          <button style={{ ...T.btnFill, marginTop:22 }} onClick={() => navigate('/noticias')}>Ver todas as noticias</button>
        </div>
      );
      case 'newsletter': return (
        <div>
          <h2 style={T.ptitle}>Assine nossa newsletter</h2>
          <p style={T.psub}>Receba novidades e conteudos exclusivos no seu e-mail.</p>
          {subDone ? (
            <div style={{ marginTop:20, background:TEAL_LIGHT, border:`1px solid ${TEAL}`, borderRadius:12, padding:18, textAlign:'center' }}>
              <div style={{ fontSize:24, color:TEAL }}>&#10003;</div>
              <div style={{ fontSize:14, fontWeight:600, color:TEAL_DARK, marginTop:6 }}>Inscricao confirmada!</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:4 }}>Obrigado por assinar!</div>
            </div>
          ) : (
            <form onSubmit={subscribe} style={{ marginTop:20, display:'flex', flexDirection:'column', gap:10 }}>
              <label style={T.plbl}>Seu e-mail</label>
              <input type="email" required placeholder="voce@email.com" value={email} onChange={e => setEmail(e.target.value)} style={T.pinp}/>
              <button type="submit" disabled={subLoading} style={{ ...T.btnFill, opacity:subLoading?.7:1 }}>
                {subLoading ? 'Aguarde...' : 'Quero receber novidades'}
              </button>
              <p style={{ fontSize:11, color:'#8C9BAA', margin:0 }}>Sem spam. Cancele quando quiser.</p>
            </form>
          )}
        </div>
      );
      case 'about': return (
        <div>
          <h2 style={T.ptitle}>Quem somos?</h2>
          <p style={{ ...T.psub, marginBottom:16 }}>O InteraAnalises e uma plataforma brasileira de saude digital que usa inteligencia artificial para auxiliar na interpretacao de exames laboratoriais e direcionar pacientes ao especialista correto.</p>
          <div style={{ background:TEAL_LIGHT, borderRadius:12, padding:'14px 16px', fontSize:13, color:SLATE, lineHeight:1.7, border:`1px solid ${TEAL}33` }}>
            <div style={{ fontWeight:700, marginBottom:6, color:TEAL_DARK }}>Nossa missao</div>
            Tornar o diagnostico medico mais acessivel, preciso e centrado no paciente.
          </div>
        </div>
      );
      case 'contact': return (
        <div>
          <h2 style={T.ptitle}>Contato</h2>
          <p style={T.psub}>Fale com nossa equipe. Respondemos em ate 24h em dias uteis.</p>
          {contactDone ? (
            <div style={{ marginTop:20, background:TEAL_LIGHT, border:`1px solid ${TEAL}`, borderRadius:12, padding:18, textAlign:'center' }}>
              <div style={{ fontSize:24, color:TEAL }}>&#10003;</div>
              <div style={{ fontSize:14, fontWeight:600, color:TEAL_DARK, marginTop:6 }}>Mensagem enviada!</div>
            </div>
          ) : (
            <form onSubmit={sendContact} style={{ marginTop:18, display:'flex', flexDirection:'column', gap:10 }}>
              <div><label style={T.plbl}>Nome</label><input type="text" required placeholder="Seu nome" value={contactForm.name} onChange={e => setContactForm(p => ({...p,name:e.target.value}))} style={T.pinp}/></div>
              <div><label style={T.plbl}>E-mail</label><input type="email" required placeholder="voce@email.com" value={contactForm.email} onChange={e => setContactForm(p => ({...p,email:e.target.value}))} style={T.pinp}/></div>
              <div>
                <label style={T.plbl}>Mensagem</label>
                <textarea required rows={4} value={contactForm.msg} onChange={e => setContactForm(p => ({...p,msg:e.target.value}))} style={{ ...T.pinp, resize:'none', height:88 }}/>
              </div>
              <button type="submit" disabled={contactSending} style={{ ...T.btnFill, opacity:contactSending?.7:1 }}>
                {contactSending ? 'Enviando...' : 'Enviar mensagem'}
              </button>
            </form>
          )}
          <div style={{ marginTop:16, fontSize:12, color:'#8C9BAA' }}>contato@interaanalises.com.br</div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', overflow:'hidden', fontFamily:"'Inter',sans-serif" }}>

      {/* ESQUERDA — fundo gradiente teal */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, #b8d4e8 0%, #cce4f0 40%, #e0f7f6 100%)' }}/>

        {/* Logo centralizada verticalmente */}
        <div style={{
          position:'absolute',
          top:'50%', left:'50%',
          transform:'translate(-50%, -50%)',
          display:'flex', flexDirection:'column',
          alignItems:'center', gap:24,
        }}>
          <img
            src={logoImg}
            alt="InteraAnalises"
            style={{
              width: 320,
              height: 'auto',
              display: 'block',
              filter: 'drop-shadow(0 4px 20px rgba(0,189,176,0.25))',
            }}
          />
          <div style={{
            display:'inline-block',
            border:`2px solid ${TEAL}88`,
            borderRadius:40, padding:'9px 28px',
            fontSize:'clamp(13px,1.3vw,17px)',
            fontWeight:600, color:TEAL_DARK,
            background:'rgba(255,255,255,0.45)',
            backdropFilter:'blur(4px)',
            letterSpacing:'0.3px',
          }}>
            Diagnosticos direcionais
          </div>
        </div>
      </div>

      {/* DIREITA — menu cinza */}
      <div style={{
        width: open ? 680 : 370,
        flexShrink:0, background:GRAY_BG,
        display:'flex', overflow:'hidden',
        transition:'width 0.32s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ width:370, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', gap:14, padding:'0 32px' }}>
          {MENU.map(item => (
            <button key={item.id} onClick={() => toggle(item.id)} style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'13px 18px', borderRadius:50,
              background: open===item.id ? TEAL_LIGHT : '#ffffff',
              border: open===item.id ? `1.5px solid ${TEAL}` : '1px solid rgba(0,0,0,0.1)',
              boxShadow: open===item.id ? `0 0 0 3px ${TEAL}22` : '0 1px 3px rgba(0,0,0,0.07)',
              cursor:'pointer', width:'100%',
              fontFamily:"'Inter',sans-serif",
              outline:'none', textAlign:'left', transition:'all 0.15s',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                <path d="M12 2C10.5 7 7 10.5 2 12c5 1.5 8.5 5 10 10 1.5-5 5-8.5 10-10-5-1.5-8.5-5-10-10z" fill={TEAL}/>
              </svg>
              <span style={{ flex:1, fontSize:14, fontWeight:600, color:SLATE, letterSpacing:'0.1px' }}>{item.label}</span>
              <svg width="7" height="11" viewBox="0 0 7 12" fill="none" style={{ flexShrink:0 }}>
                <path d="M1 1l5 5-5 5" stroke={open===item.id ? TEAL : '#bbb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>

        {open && (
          <div style={{ flex:1, overflowY:'auto', padding:'48px 28px', borderLeft:'1px solid rgba(0,0,0,0.07)', background:'#f5fafa' }}>
            {panel()}
          </div>
        )}
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen}/>
    </div>
  );
}
