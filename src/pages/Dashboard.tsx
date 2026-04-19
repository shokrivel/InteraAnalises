import { useNavigate } from 'react-router-dom';
import { MessageCircle, History, User, Shield, LogOut, ChevronRight, Activity } from 'lucide-react';
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
    try { await supabase.auth.signOut(); toast({ title: 'Logout realizado' }); navigate('/'); }
    catch { toast({ title: 'Erro ao sair', variant: 'destructive' }); }
  };

  const cards = [
    {
      icon: MessageCircle, color: '#e6f5f0', iconColor: '#0d7a5f',
      title: 'Nova consulta', desc: 'Descreva sintomas ou envie exames para receber uma análise personalizada.',
      btn: 'Iniciar consulta', primary: true, action: () => navigate('/consultation'),
    },
    {
      icon: History, color: '#e8f3fa', iconColor: '#1d6fa4',
      title: 'Histórico', desc: 'Veja todas as suas consultas anteriores e acompanhe a evolução.',
      btn: 'Ver histórico', primary: false, action: () => navigate('/consultation-history'),
    },
    {
      icon: User, color: '#fef3c7', iconColor: '#92400e',
      title: 'Meu perfil', desc: 'Atualize seus dados pessoais e tipo de perfil para respostas melhores.',
      btn: 'Editar perfil', primary: false, action: () => navigate('/profile'),
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>{user?.email}</span>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} style={chipBtn}>
              <Shield size={13} /> Admin
            </button>
          )}
          <button onClick={handleLogout} style={chipBtn}>
            <LogOut size={13} /> Sair
          </button>
        </div>
      </nav>

      {/* GREETING */}
      <div style={{ background: '#0d7a5f', padding: '36px 24px 32px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Activity size={18} color="rgba(255,255,255,0.7)" />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Painel</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.3px' }}>Olá! O que vamos analisar hoje?</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>Escolha uma opção abaixo para começar.</p>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ maxWidth: 800, margin: '-20px auto 0', padding: '0 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {cards.map(({ icon: Icon, color, iconColor, title, desc, btn, primary, action }) => (
            <div key={title} style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '24px 22px', display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s, transform .2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Icon size={20} color={iconColor} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, flexGrow: 1, marginBottom: 20 }}>{desc}</p>
              <button onClick={action} style={primary ? btnPrimary : btnOutline}>
                {btn} <ChevronRight size={14} />
              </button>
            </div>
          ))}

          {isAdmin && (
            <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '24px 22px', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Shield size={20} color="#92400e" />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 8 }}>
                Painel Admin
                <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, verticalAlign: 'middle', textTransform: 'uppercase' }}>Admin</span>
              </h3>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, flexGrow: 1, marginBottom: 20 }}>Gerencie usuários, consultas e configurações do sistema.</p>
              <button onClick={() => navigate('/admin')} style={btnOutline}>Acessar painel <ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: '#ffffff', borderTop: '1px solid #e5e7eb', padding: '20px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#9ca3af' }}>© 2026 InteraAnalises · Plataforma educativa em saúde</p>
      </footer>
    </div>
  );
};

const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#374151', fontWeight: 500, fontSize: 13.5, padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' };
const chipBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb', cursor: 'pointer' };

export default Dashboard;
