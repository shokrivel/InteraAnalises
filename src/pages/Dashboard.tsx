import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Shield, LogOut, ChevronRight, FlaskConical } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Paleta da logo
const TEAL      = '#00BDB0';
const TEAL_DARK = '#008F89';
const TEAL_LIGHT= '#E0F7F6';
const SLATE     = '#3D4A52';

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); toast({ title: 'Ate logo!' }); navigate('/'); }
    catch { toast({ title: 'Erro ao sair', variant: 'destructive' }); }
  };

  const cards = [
    {
      icon: MessageCircle,
      title: 'Nova Consulta',
      desc: 'Descreva seus sintomas ou envie seus exames para receber uma indicacao de especialista.',
      btn: 'Iniciar consulta',
      action: () => navigate('/consultation'),
      accent: TEAL,
      light: TEAL_LIGHT,
    },
    {
      icon: User,
      title: 'Meu Perfil',
      desc: 'Atualize suas informacoes pessoais e escolha como prefere receber as explicacoes.',
      btn: 'Ver perfil',
      action: () => navigate('/profile'),
      accent: '#008F89',
      light: '#ccf0ee',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4fbfa', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${TEAL}33`, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </span>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} style={navBtn}>
              <Shield size={14} /> Admin
            </button>
          )}
          <button onClick={handleLogout} style={navBtnOutline}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      {/* BANNER */}
      <div style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`, padding: '40px 24px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={20} color="#fff" />
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Painel do usuario</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.3px' }}>
            Ola, bem-vindo ao InteraAnalises!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, maxWidth: 480 }}>
            Descreva seus sintomas para receber uma indicacao do especialista ideal para voce.
          </p>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ maxWidth: 900, margin: '-24px auto 0', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {cards.map(card => (
            <div key={card.title} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${card.accent}33`, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={card.accent} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: SLATE, marginBottom: 6 }}>{card.title}</h3>
                <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6 }}>{card.desc}</p>
              </div>
              <button onClick={card.action} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, background: card.light, color: card.accent, border: `1px solid ${card.accent}44`, borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', width: 'fit-content' }}>
                {card.btn} <ChevronRight size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const navBtn: React.CSSProperties        = { display:'inline-flex', alignItems:'center', gap:5, background:TEAL, color:'#fff', border:'none', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:600, cursor:'pointer' };
const navBtnOutline: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:5, background:'transparent', color:'#374151', border:'1px solid #e5e7eb', borderRadius:8, padding:'7px 14px', fontSize:13, fontWeight:500, cursor:'pointer' };
const TEAL = '#00BDB0'; const TEAL_DARK = '#008F89'; const TEAL_LIGHT = '#E0F7F6'; const SLATE = '#3D4A52';

export default Dashboard;
