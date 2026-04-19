import { useNavigate } from "react-router-dom";
import { MessageCircle, History, User, Shield, LogOut, ChevronRight } from "lucide-react";
import { InteraAnalisesLogo } from "@/components/InteraAnalisesLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); toast({ title: "Logout realizado", description: "Até logo!" }); navigate("/"); }
    catch { toast({ title: "Erro ao sair", variant: "destructive" }); }
  };

  const cards = [
    { icon: MessageCircle, title: 'Nova Consulta',   desc: 'Inicie uma análise com nossa IA especializada',       btn: 'Começar Consulta', action: () => navigate('/consultation'),        primary: true },
    { icon: History,       title: 'Histórico',        desc: 'Acesse consultas anteriores e acompanhe a evolução',  btn: 'Ver Histórico',    action: () => navigate('/consultation-history'), primary: false },
    { icon: User,          title: 'Perfil',           desc: 'Gerencie informações pessoais e preferências',        btn: 'Ver Perfil',       action: () => navigate('/profile'),              primary: true },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f5f0e8', fontFamily:"'DM Sans',sans-serif" }}>
      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(245,240,232,0.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(200,168,75,0.3)', padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <InteraAnalisesLogo onClick={() => navigate('/')} />
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ background:'#e8f5ee', color:'#1a7a4a', fontSize:'0.78rem', fontWeight:600, padding:'5px 12px', borderRadius:2 }}>{user?.email}</div>
          {isAdmin && (<button onClick={() => navigate('/admin')} style={navBtn}><Shield size={14} /> Admin</button>)}
          <button onClick={handleLogout} style={navBtnOut}><LogOut size={14} /> Sair</button>
        </div>
      </nav>

      {/* HERO STRIP */}
      <div style={{ background:'#0f4a2e', padding:'64px 60px 56px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.68rem', letterSpacing:3, textTransform:'uppercase', color:'#c8a84b', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ width:28, height:1, background:'#c8a84b', display:'inline-block' }} /> Painel do Usuário
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, color:'#fafaf8', lineHeight:1.1, marginBottom:12 }}>
            Bem-vindo ao <em style={{ fontStyle:'italic', color:'#e8c96a' }}>InteraAnalises</em>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'1rem', maxWidth:520 }}>Sua plataforma para consultas personalizadas em Parasitologia, Bioquímica e Hematologia.</p>
        </div>
      </div>

      {/* CARDS */}
      <section style={{ padding:'64px 60px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24 }}>
          {cards.map(({ icon:Icon, title, desc, btn, action, primary }) => (
            <div key={title} style={dashCard}
              onMouseEnter={e=>Object.assign(e.currentTarget.style,dashCardHover)}
              onMouseLeave={e=>Object.assign(e.currentTarget.style,dashCard)}
            >
              <div style={{ width:52, height:52, background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <Icon size={22} color="#1a7a4a" />
              </div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:700, marginBottom:8, color:'#1c1c1c' }}>{title}</h3>
              <p style={{ fontSize:'0.88rem', color:'#3d3d3d', lineHeight:1.65, marginBottom:28, flexGrow:1 }}>{desc}</p>
              <button onClick={action} style={primary ? btnPrimary : btnOutline}
                onMouseEnter={e=>Object.assign(e.currentTarget.style,primary?btnPrimaryH:btnOutlineH)}
                onMouseLeave={e=>Object.assign(e.currentTarget.style,primary?btnPrimary:btnOutline)}
              >
                {btn} <ChevronRight size={14} />
              </button>
            </div>
          ))}
          {isAdmin && (
            <div style={dashCard}
              onMouseEnter={e=>Object.assign(e.currentTarget.style,dashCardHover)}
              onMouseLeave={e=>Object.assign(e.currentTarget.style,dashCard)}
            >
              <div style={{ width:52, height:52, background:'rgba(200,168,75,0.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <Shield size={22} color="#c8a84b" />
              </div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.2rem', fontWeight:700, marginBottom:8, color:'#1c1c1c' }}>
                Painel Admin <span style={{ marginLeft:8, background:'#e8f5ee', color:'#1a7a4a', fontSize:'0.65rem', fontWeight:700, padding:'3px 7px', borderRadius:2, verticalAlign:'middle' }}>ADMIN</span>
              </h3>
              <p style={{ fontSize:'0.88rem', color:'#3d3d3d', lineHeight:1.65, marginBottom:28, flexGrow:1 }}>Gerencie usuários, consultas e configurações do sistema.</p>
              <button onClick={() => navigate('/admin')} style={btnGold}
                onMouseEnter={e=>Object.assign(e.currentTarget.style,btnGoldH)}
                onMouseLeave={e=>Object.assign(e.currentTarget.style,btnGold)}
              >
                Acessar Painel <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      <footer style={{ background:'#1c1c1c', padding:'28px 60px', textAlign:'center', fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>
        <span style={{ color:'#c8a84b', fontWeight:700 }}>InteraAnalises</span> · Plataforma Educativa em Saúde · 2026
      </footer>
    </div>
  );
};

const navBtn: React.CSSProperties = { display:'flex', alignItems:'center', gap:6, background:'#0f4a2e', color:'#fafaf8', fontWeight:700, fontSize:'0.72rem', letterSpacing:1, textTransform:'uppercase', padding:'8px 16px', borderRadius:2, border:'none', cursor:'pointer' };
const navBtnOut: React.CSSProperties = { display:'flex', alignItems:'center', gap:6, background:'transparent', color:'#c8a84b', border:'1px solid #c8a84b', fontWeight:700, fontSize:'0.72rem', letterSpacing:1, textTransform:'uppercase', padding:'7px 14px', borderRadius:2, cursor:'pointer' };
const dashCard: React.CSSProperties = { background:'#fafaf8', border:'1px solid rgba(26,122,74,0.15)', borderTop:'3px solid #c8a84b', padding:'36px 28px', borderRadius:4, display:'flex', flexDirection:'column', transition:'all .3s' };
const dashCardHover: React.CSSProperties = { ...dashCard, borderColor:'#1a7a4a', borderTopColor:'#c8a84b', boxShadow:'0 8px 32px rgba(26,122,74,0.1)', transform:'translateY(-4px)' };
const btnPrimary: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:8, background:'#0f4a2e', color:'#fafaf8', fontWeight:700, fontSize:'0.8rem', letterSpacing:1, textTransform:'uppercase', padding:'12px 22px', borderRadius:2, border:'none', cursor:'pointer', transition:'background .2s' };
const btnPrimaryH: React.CSSProperties = { ...btnPrimary, background:'#1a7a4a' };
const btnOutline: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:8, background:'transparent', color:'#0f4a2e', border:'2px solid #0f4a2e', fontWeight:700, fontSize:'0.8rem', letterSpacing:1, textTransform:'uppercase', padding:'10px 20px', borderRadius:2, cursor:'pointer', transition:'all .2s' };
const btnOutlineH: React.CSSProperties = { ...btnOutline, background:'#e8f5ee' };
const btnGold: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:8, background:'#c8a84b', color:'#0f4a2e', fontWeight:700, fontSize:'0.8rem', letterSpacing:1, textTransform:'uppercase', padding:'12px 22px', borderRadius:2, border:'none', cursor:'pointer', transition:'background .2s' };
const btnGoldH: React.CSSProperties = { ...btnGold, background:'#e8c96a' };

export default Dashboard;
