import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Microscope, Droplet, Users, Shield, BookOpen, Heart, Menu, ChevronRight } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import { InteraAnalisesLogo } from "@/components/InteraAnalisesLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Page {
  id: string;
  title: string;
  slug: string;
  parent_id?: string;
  children?: Page[];
}

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPages, setMenuPages] = useState<Page[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuPages();
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const fetchMenuPages = async () => {
    try {
      const { data } = await supabase.from('pages').select('id, title, slug, parent_id').eq('is_active', true).order('order_index');
      const map = new Map<string, Page>();
      const roots: Page[] = [];
      (data || []).forEach(p => map.set(p.id, { ...p, children: [] }));
      (data || []).forEach(p => { const node = map.get(p.id)!; p.parent_id ? map.get(p.parent_id)?.children?.push(node) : roots.push(node); });
      setMenuPages(roots);
    } catch {}
  };

  const features = [
    { icon: Microscope, title: "Análise Especializada",    desc: "Parasitologia, Bioquímica e Hematologia com IA Gemini 2.5 Pro" },
    { icon: Users,      title: "Perfis Personalizados",    desc: "Linguagem adaptada para Pacientes, Acadêmicos e Profissionais" },
    { icon: Droplet,    title: "Histórico Completo",       desc: "Acompanhe sintomas, exames e evolução clínica ao longo do tempo" },
    { icon: Shield,     title: "Evidências Científicas",   desc: "Respostas baseadas em literatura confiável com referências" },
    { icon: BookOpen,   title: "Encaminhamentos",          desc: "Localização de profissionais de saúde próximos via Google Maps" },
    { icon: Heart,      title: "Interface Intuitiva",      desc: "Coleta de informações através de balões interativos simples" },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(245,240,232,0.94)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(200,168,75,0.3)', padding:'0 40px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <InteraAnalisesLogo onClick={() => navigate('/')} />
          {menuPages.length > 0 && (
            <div style={{ position:'relative' }}>
              <button onClick={() => setMenuOpen(p => !p)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:'0.72rem', fontWeight:600, letterSpacing:'1.5px', textTransform:'uppercase', color:'#3d3d3d', padding:'2px 0' }}>
                <Menu size={14} /> Menu
              </button>
              {menuOpen && (
                <div style={{ position:'absolute', top:'100%', left:0, background:'#fafaf8', border:'1px solid rgba(200,168,75,0.25)', borderRadius:4, padding:'12px 0', minWidth:220, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', zIndex:200 }}>
                  {menuPages.map(p => (
                    <a key={p.id} href={`/page/${p.slug}`} onClick={() => setMenuOpen(false)} style={{ display:'block', padding:'8px 20px', fontSize:'0.85rem', color:'#1c1c1c', textDecoration:'none' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#e8f5ee')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    >{p.title}</a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {!loading && (
          user ? (
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => navigate('/dashboard')} style={navBtnPrimary}>Dashboard</button>
              <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} style={navBtnOutline}>Sair</button>
            </div>
          ) : (
            <button onClick={() => setAuthDialogOpen(true)} style={navBtnPrimary}>Entrar / Cadastrar</button>
          )
        )}
      </nav>

      {/* HERO */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'100vh', paddingTop:0 }}>
        {/* left */}
        <div style={{ background:'#0f4a2e', display:'flex', flexDirection:'column', justifyContent:'center', padding:'120px 60px 80px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-60, top:0, bottom:0, width:120, background:'#0f4a2e', clipPath:'polygon(0 0, 0 100%, 100% 100%)', zIndex:2 }} />
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.7rem', letterSpacing:3, textTransform:'uppercase', color:'#c8a84b', marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ width:32, height:1, background:'#c8a84b', display:'inline-block' }} />
            Saúde Educativa · 2026
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2.8rem,5vw,4.8rem)', fontWeight:900, lineHeight:1.05, color:'#fafaf8', marginBottom:8 }}>
            Intera<em style={{ fontStyle:'italic', color:'#e8c96a' }}>Análises</em>
          </h1>
          <p style={{ fontSize:'1.05rem', color:'rgba(255,255,255,0.65)', maxWidth:400, marginTop:20, marginBottom:48, lineHeight:1.75 }}>
            Obtenha respostas personalizadas baseadas em evidências científicas para Parasitologia, Bioquímica e Hematologia — com linguagem adaptada ao seu perfil.
          </p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <button onClick={() => { if(!loading) user ? navigate('/consultation') : setAuthDialogOpen(true); }} style={heroBtnPrimary}
              onMouseEnter={e=>(e.currentTarget.style.background='#e8c96a')}
              onMouseLeave={e=>(e.currentTarget.style.background='#c8a84b')}
            >
              {loading ? 'Carregando…' : user ? 'Iniciar Consulta' : 'Começar Agora'} <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate('/saiba-mais')} style={heroBtnGhost}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,168,75,0.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}
            >
              Saiba Mais
            </button>
          </div>
        </div>
        {/* right */}
        <div style={{ background:'#fafaf8', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'120px 60px 80px 100px', position:'relative' }}>
          <div style={{ position:'relative', width:'100%', maxWidth:360 }}>
            <div style={{ width:300, height:300, borderRadius:'50%', background:'linear-gradient(135deg,#e8f5ee 0%,rgba(200,168,75,0.12) 100%)', border:'2px solid rgba(200,168,75,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto', position:'relative', animation:'pulse 4s ease-in-out infinite' }}>
              <span style={{ fontSize:'5rem' }}>🔬</span>
            </div>
            {[
              { n:'IA', l:'Gemini 2.5', top:20, right:-20 },
              { n:'24/7', l:'Disponível', bottom:30, left:-30 },
              { n:'3', l:'Especialidades', top:'50%', right:-40 },
            ].map(({ n, l, ...pos }) => (
              <div key={l} style={{ position:'absolute', background:'white', borderLeft:'3px solid #c8a84b', padding:'12px 18px', borderRadius:4, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', minWidth:130, transform: pos.top==='50%'?'translateY(-50%)':undefined, ...pos as any }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.55rem', fontWeight:900, color:'#1a7a4a' }}>{n}</div>
                <div style={{ fontSize:'0.7rem', fontWeight:500, letterSpacing:'0.5px', color:'#3d3d3d', textTransform:'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gold-divider" />

      {/* FEATURES */}
      <section style={{ padding:'100px 60px', maxWidth:1200, margin:'0 auto' }} className="fade-in">
        <div className="section-tag">Funcionalidades</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, lineHeight:1.1, color:'#1c1c1c', marginBottom:16 }}>
          Tudo que você precisa<br /><em style={{ fontStyle:'italic', color:'#1a7a4a' }}>para uma consulta informada</em>
        </h2>
        <p style={{ fontSize:'1rem', color:'#3d3d3d', maxWidth:560, marginBottom:60 }}>Plataforma completa de análise laboratorial com IA, adaptada ao seu nível de conhecimento.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:28 }}>
          {features.map(({ icon:Icon, title, desc }) => (
            <div key={title} style={featureCard}
              onMouseEnter={e=>Object.assign(e.currentTarget.style,featureCardHover)}
              onMouseLeave={e=>Object.assign(e.currentTarget.style,featureCard)}
            >
              <div style={{ width:52, height:52, background:'#e8f5ee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                <Icon size={22} color="#1a7a4a" />
              </div>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:700, marginBottom:10, color:'#1c1c1c' }}>{title}</h3>
              <p style={{ fontSize:'0.85rem', color:'#3d3d3d', lineHeight:1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="gold-divider" />

      {/* PÚBLICO */}
      <section style={{ background:'#fafaf8', padding:'100px 60px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }} className="fade-in">
          <div className="section-tag">Público-Alvo</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, lineHeight:1.1, color:'#1c1c1c', marginBottom:16 }}>
            Para quem foi<br /><em style={{ fontStyle:'italic', color:'#1a7a4a' }}>criada a plataforma?</em>
          </h2>
          <p style={{ fontSize:'1rem', color:'#3d3d3d', maxWidth:560, marginBottom:60 }}>Linguagem e profundidade adaptadas para cada tipo de usuário.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
            {[
              { icon:'👤', title:'Paciente', desc:'Compreenda seus exames de forma simples, segura e sem jargão técnico.', tag:'Linguagem acessível' },
              { icon:'🎓', title:'Estudante & Acadêmico', desc:'Suporte científico para estudos, estágios e pesquisas clínicas em saúde.', tag:'Linguagem técnica moderada' },
              { icon:'🩺', title:'Profissional de Saúde', desc:'Acesso rápido a protocolos, informações clínicas e suporte à decisão.', tag:'Linguagem técnica completa' },
            ].map(({ icon, title, desc, tag }) => (
              <div key={title} style={audienceCard}
                onMouseEnter={e=>Object.assign(e.currentTarget.style,{...audienceCard,borderColor:'#c8a84b',background:'rgba(200,168,75,0.05)'})}
                onMouseLeave={e=>Object.assign(e.currentTarget.style,audienceCard)}
              >
                <div style={{ fontSize:'2.4rem', marginBottom:20 }}>{icon}</div>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:700, marginBottom:10, color:'#1c1c1c' }}>{title}</h3>
                <p style={{ fontSize:'0.85rem', color:'#3d3d3d', lineHeight:1.65, marginBottom:16 }}>{desc}</p>
                <span style={{ display:'inline-block', background:'#e8f5ee', color:'#1a7a4a', fontSize:'0.72rem', fontWeight:700, padding:'4px 10px', borderRadius:2 }}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* CTA */}
      <section style={{ background:'#0f4a2e', padding:'100px 60px' }}>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }} className="fade-in">
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.68rem', letterSpacing:3, textTransform:'uppercase', color:'#c8a84b', marginBottom:24 }}>Pronto para começar?</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(2rem,4vw,3rem)', fontWeight:900, lineHeight:1.1, color:'#fafaf8', marginBottom:20 }}>
            Crie sua conta e acesse consultas baseadas em <em style={{ fontStyle:'italic', color:'#e8c96a' }}>evidências científicas</em>
          </h2>
          <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.65)', marginBottom:40 }}>Gratuito para começar. Linguagem adaptada ao seu perfil profissional.</p>
          <button onClick={() => { if(!loading) user ? navigate('/consultation') : setAuthDialogOpen(true); }} style={heroBtnPrimary}
            onMouseEnter={e=>(e.currentTarget.style.background='#e8c96a')}
            onMouseLeave={e=>(e.currentTarget.style.background='#c8a84b')}
          >
            {loading ? 'Carregando…' : user ? 'Iniciar Consulta' : 'Criar Conta Gratuita'} <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'#1c1c1c', padding:'32px 60px', textAlign:'center', fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', letterSpacing:'0.5px' }}>
        <span style={{ color:'#c8a84b', fontWeight:700 }}>InteraAnalises</span> · Plataforma Educativa em Saúde · <a href="https://interasaude.vercel.app" target="_blank" rel="noreferrer" style={{ color:'#c8a84b', textDecoration:'none' }}>InteraSaúde</a> · 2026
      </footer>

      <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}`}</style>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

const navBtnPrimary: React.CSSProperties = { background:'#0f4a2e', color:'#fafaf8', fontWeight:700, fontSize:'0.78rem', letterSpacing:1, textTransform:'uppercase', padding:'10px 22px', borderRadius:2, border:'none', cursor:'pointer' };
const navBtnOutline: React.CSSProperties = { background:'transparent', color:'#c8a84b', border:'1px solid #c8a84b', fontWeight:700, fontSize:'0.78rem', letterSpacing:1, textTransform:'uppercase', padding:'9px 20px', borderRadius:2, cursor:'pointer' };
const heroBtnPrimary: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:10, background:'#c8a84b', color:'#0f4a2e', fontWeight:700, fontSize:'0.85rem', letterSpacing:1, textTransform:'uppercase', padding:'16px 32px', borderRadius:2, border:'none', cursor:'pointer', transition:'background .2s' };
const heroBtnGhost: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:10, background:'transparent', color:'#c8a84b', border:'2px solid #c8a84b', fontWeight:700, fontSize:'0.85rem', letterSpacing:1, textTransform:'uppercase', padding:'14px 28px', borderRadius:2, cursor:'pointer', transition:'all .2s' };
const featureCard: React.CSSProperties = { background:'#fafaf8', border:'1px solid rgba(26,122,74,0.15)', padding:'36px 28px', borderRadius:4, transition:'all .3s' };
const featureCardHover: React.CSSProperties = { ...featureCard, borderColor:'#1a7a4a', boxShadow:'0 8px 32px rgba(26,122,74,0.1)', transform:'translateY(-4px)' };
const audienceCard: React.CSSProperties = { padding:'36px 28px', border:'1px solid rgba(200,168,75,0.2)', borderRadius:4, transition:'all .3s' };

export default Index;
