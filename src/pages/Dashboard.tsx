import { useNavigate } from 'react-router-dom';
import { MessageCircle, History, User, Shield, LogOut, ChevronRight, Microscope } from 'lucide-react';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); toast({ title: 'Até logo!' }); navigate('/'); }
    catch { toast({ title: 'Erro ao sair', variant: 'destructive' }); }
  };

  const cards = [
    {
      icon: MessageCircle, color: '#0d7a5f', bg: '#e6f5f0',
      title: 'Nova Consulta',
      desc: 'Descreva seus sintomas ou envie resultados de exames para análise com IA.',
      btn: 'Iniciar consulta', action: () => navigate('/consultation'), primary: true,
    },
    {
      icon: History, color: '#2563eb', bg: '#eff6ff',
      title: 'Histórico',
      desc: 'Veja todas as suas consultas anteriores e acompanhe sua evolução.',
      btn: 'Ver histórico', action: () => navigate('/consultation-history'), primary: false,
    },
    {
      icon: User, color: '#7c3aed', bg: '#f5f3ff',
      title: 'Meu Perfil',
      desc: 'Atualize suas informações e preferências de linguagem.',
      btn: 'Editar perfil', action: () => navigate('/profile'), primary: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} style={navBtn('#0d7a5f')}>
              <Shield size={13} /> Admin
            </button>
          )}
          <button onClick={handleLogout} style={navBtnOutline}><LogOut size={13} /> Sair</button>
        </div>
      </nav>

      {/* WELCOME BANNER */}
      <div style={{ background: 'linear-gradient(135deg, #0d7a5f 0%, #0a9974 100%)', padding: '40px 32px 36px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Microscope size={20} color="#fff" />
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 2 }}>Bem-vindo de volta</p>
              <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: '-0.3px' }}>InteraAnalises</h1>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, maxWidth: 480, lineHeight: 1.6 }}>
            Sua plataforma de análise de exames laboratoriais com IA. O que deseja fazer hoje?
          </p>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {cards.map(({ icon: Icon, color, bg, title, desc, btn, action, primary }) => (
            <div key={title} style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, card)}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 17, color: '#111827', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65, marginBottom: 24, flexGrow: 1 }}>{desc}</p>
              <button onClick={action}
                style={primary ? btnPrimary : btnSecondary}
                onMouseEnter={e => Object.assign(e.currentTarget.style, primary ? btnPrimaryH : btnSecondaryH)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, primary ? btnPrimary : btnSecondary)}
              >
                {btn} <ChevronRight size={15} />
              </button>
            </div>
          ))}

          {isAdmin && (
            <div style={card}
              onMouseEnter={e => Object.assign(e.currentTarget.style, cardHover)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, card)}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Shield size={22} color="#d97706" />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 17, color: '#111827', marginBottom: 8 }}>Painel Admin</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.65, marginBottom: 24, flexGrow: 1 }}>Gerencie usuários, consultas e configurações do sistema.</p>
              <button onClick={() => navigate('/admin')} style={btnAdmin}
                onMouseEnter={e => Object.assign(e.currentTarget.style, btnAdminH)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, btnAdmin)}
              >
                Acessar <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '24px', fontSize: 12, color: '#9ca3af', borderTop: '1px solid #e5e7eb', marginTop: 'auto' }}>
        InteraAnalises · Plataforma educativa em saúde · 2026
      </footer>
    </div>
  );
};

const navBtn = (bg: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 5, background: bg, color: '#fff', fontWeight: 600, fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' });
const navBtnOutline: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontWeight: 500, fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 28, display: 'flex', flexDirection: 'column', transition: 'all .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
const cardHover: React.CSSProperties = { ...card, boxShadow: '0 8px 24px rgba(0,0,0,0.09)', transform: 'translateY(-3px)', borderColor: '#d1fae5' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background .15s' };
const btnPrimaryH: React.CSSProperties = { ...btnPrimary, background: '#0a6550' };
const btnSecondary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13.5, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background .15s' };
const btnSecondaryH: React.CSSProperties = { ...btnSecondary, background: '#e5e7eb' };
const btnAdmin: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: 13.5, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'background .15s' };
const btnAdminH: React.CSSProperties = { ...btnAdmin, background: '#fde68a' };

export default Dashboard;
