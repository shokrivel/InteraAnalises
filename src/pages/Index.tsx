/**
 * Index.tsx — Homepage InteraAnalises
 * Layout fiel ao Canva: split hero (foto lab esq) + menu vertical direito
 * 5 seções: Entrar/Cadastre-se · Notícias · Assinatura · Quem somos · Contato
 */
import{useState,useEffect,useRef}from'react';
import{useNavigate}from'react-router-dom';
import{useAuth}from'@/contexts/AuthContext';
import AuthDialog from'@/components/auth/AuthDialog';
import{supabase}from'@/integrations/supabase/client';

type Section='auth'|'news'|'pricing'|'about'|'contact'|null;

const NEWS=[
  {date:'Mai 2026',tag:'Atualiza\u00e7\u00e3o',title:'IA Gemini 2.5 agora dispon\u00edvel',body:'A nova vers\u00e3o analisa exames com ainda mais precis\u00e3o e retorna indica\u00e7\u00f5es de especialistas em segundos.'},
  {date:'Abr 2026',tag:'Feature',title:'Busca de especialistas por localiza\u00e7\u00e3o',body:'Agora o sistema detecta automaticamente sua localiza\u00e7\u00e3o e sugere profissionais pr\u00f3ximos ap\u00f3s a an\u00e1lise.'},
  {date:'Mar 2026',tag:'Parceria',title:'InteraAnalises + InteraSa\u00fade',body:'Integra\u00e7\u00e3o completa com o ecossistema InteraSa\u00fade para acompanhamento longitudinal do paciente.'},
];

const PLANS=[
  {name:'Gratuito',price:'R$ 0',period:'/m\u00eas',features:['3 an\u00e1lises por m\u00eas','Indica\u00e7\u00e3o de especialista','Hist\u00f3rico b\u00e1sico'],cta:'Come\u00e7ar gr\u00e1tis',highlight:false},
  {name:'Profissional',price:'R$ 29,90',period:'/m\u00eas',features:['An\u00e1lises ilimitadas','Todos os perfis cl\u00ednicos','Relat\u00f3rio em PDF','Suporte priorit\u00e1rio'],cta:'Assinar agora',highlight:true},
  {name:'Cl\u00ednica',price:'R$ 99,90',period:'/m\u00eas',features:['M\u00faltiplos usu\u00e1rios','Dashboard administrativo','API de integra\u00e7\u00e3o','SLA 99,9%'],cta:'Falar com vendas',highlight:false},
];

const TEAM=[
  {name:'Dr. Igor Souza',role:'Fundador & Biom\u00e9dico',avatar:'\uD83D\uDD2C'},
  {name:'Dra. Ana Ferreira',role:'Parasitologia Cl\u00ednica',avatar:'\uD83E\uDDEB'},
  {name:'Prof. Carlos Lima',role:'Hematologia & IA M\u00e9dica',avatar:'\uD83E\uDE78'},
];

const MENU:Array<{id:Section;label:string;icon:string}>=[
  {id:'auth',   label:'Entrar / Cadastre-se',icon:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'},
  {id:'news',   label:'Not\u00edcias e updates',  icon:'M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10l6 6v10a2 2 0 0 1-2 2zM9 14h6M9 10h4'},
  {id:'pricing',label:'Assinatura',            icon:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'},
  {id:'about',  label:'Quem somos?',           icon:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'},
  {id:'contact',label:'Contato',               icon:'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6'},
];

export default function Index(){
  const{user,loading}=useAuth();
  const navigate=useNavigate();
  const[active,setActive]=useState<Section>(null);
  const[authOpen,setAuthOpen]=useState(false);
  const[sending,setSending]=useState(false);
  const[sent,setSent]=useState(false);
  const[contact,setContact]=useState({name:'',email:'',msg:''});
  const panelRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{if(!loading&&user)navigate('/dashboard');},[user,loading]);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{if(panelRef.current&&!panelRef.current.contains(e.target as Node))setActive(null);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const toggle=(s:Section)=>setActive(p=>p===s?null:s);

  const sendContact=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!contact.name||!contact.email||!contact.msg)return;
    setSending(true);
    await supabase.from('contact_messages').insert({name:contact.name,email:contact.email,message:contact.msg});
    setSending(false);setSent(true);
    setContact({name:'',email:'',msg:''});
    setTimeout(()=>setSent(false),4000);
  };

  const Ic=({d}:{d:string})=>(
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
  );

  const renderPanel=()=>{
    switch(active){
      case'auth': return(
        <div>
          <h2 style={ph2}>Acesse sua conta</h2>
          <p style={psub}>Entre para analisar seus exames ou crie uma conta gratuita.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:24}}>
            <button onClick={()=>{setAuthOpen(true);setActive(null);}} style={pbtnP}>Entrar na conta</button>
            <button onClick={()=>{setAuthOpen(true);setActive(null);}} style={pbtnO}>Criar conta gr\u00e1tis</button>
          </div>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.3)',marginTop:20,lineHeight:1.6}}>Ao criar uma conta voc\u00ea concorda com nossos Termos de Uso.</p>
        </div>
      );
      case'news': return(
        <div>
          <h2 style={ph2}>Not\u00edcias & Updates</h2>
          <p style={psub}>Novidades da plataforma e da medicina de diagn\u00f3stico.</p>
          <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:16}}>
            {NEWS.map((n,i)=>(
              <div key={i} style={{borderLeft:'2px solid rgba(13,122,95,0.8)',paddingLeft:14}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,background:'rgba(13,122,95,0.3)',color:'#6ee7b7',padding:'2px 8px',borderRadius:20,letterSpacing:.5}}>{n.tag}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{n.date}</span>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:4}}>{n.title}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',lineHeight:1.6}}>{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      );
      case'pricing': return(
        <div>
          <h2 style={ph2}>Planos & Assinatura</h2>
          <p style={psub}>Escolha o plano ideal para o seu perfil.</p>
          <div style={{marginTop:20,display:'flex',flexDirection:'column',gap:12}}>
            {PLANS.map((pl,i)=>(
              <div key={i} style={{border:pl.highlight?'1.5px solid #0d7a5f':'1px solid rgba(255,255,255,0.12)',borderRadius:14,padding:'14px 16px',background:pl.highlight?'rgba(13,122,95,0.15)':'rgba(255,255,255,0.04)',position:'relative'}}>
                {pl.highlight&&<span style={{position:'absolute',top:-10,right:14,background:'#0d7a5f',color:'#fff',fontSize:10,fontWeight:700,padding:'2px 10px',borderRadius:20}}>POPULAR</span>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <span style={{fontSize:14,fontWeight:700,color:'#fff'}}>{pl.name}</span>
                  <span style={{fontSize:18,fontWeight:800,color:pl.highlight?'#6ee7b7':'#fff'}}>{pl.price}<span style={{fontSize:11,fontWeight:400,opacity:.6}}>{pl.period}</span></span>
                </div>
                <ul style={{paddingLeft:0,listStyle:'none',margin:'0 0 12px',display:'flex',flexDirection:'column',gap:4}}>
                  {pl.features.map((f,j)=>(<li key={j} style={{fontSize:12,color:'rgba(255,255,255,0.65)',display:'flex',alignItems:'center',gap:6}}><span style={{color:'#6ee7b7',fontSize:13}}>\u2713</span> {f}</li>))}
                </ul>
                <button onClick={()=>{setAuthOpen(true);setActive(null);}} style={{...pbtnO,width:'100%',fontSize:12,padding:'8px 0',...(pl.highlight?{background:'#0d7a5f',borderColor:'#0d7a5f'}:{})}}>{pl.cta}</button>
              </div>
            ))}
          </div>
        </div>
      );
      case'about': return(
        <div>
          <h2 style={ph2}>Quem somos?</h2>
          <p style={{...psub,marginBottom:20}}>O InteraAnalises nasceu da necessidade de tornar a medicina diagn\u00f3stica acess\u00edvel e centrada no paciente. Somos uma startup brasileira de healthtech especializada em IA para an\u00e1lises laboratoriais.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {TEAM.map((t,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,background:'rgba(255,255,255,0.05)',borderRadius:12,padding:'12px 14px'}}>
                <span style={{fontSize:24}}>{t.avatar}</span>
                <div><div style={{fontSize:13,fontWeight:700,color:'#fff'}}>{t.name}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>{t.role}</div></div>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,background:'rgba(13,122,95,0.15)',borderRadius:12,padding:'14px 16px',border:'1px solid rgba(13,122,95,0.3)'}}>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.8}}>
              \uD83D\uDD2C Tecnologia baseada em literatura m\u00e9dica revisada por pares.{`\n`}\uD83C\uDFE5 Parceiro do ecossistema InteraSa\u00fade.{`\n`}\uD83C\uDDE7\uD83C\uDDF7 100% feito no Brasil.
            </div>
          </div>
        </div>
      );
      case'contact': return(
        <div>
          <h2 style={ph2}>Fale conosco</h2>
          <p style={psub}>D\u00favidas, sugest\u00f5es ou parcerias \u2014 estamos aqui.</p>
          {sent?(
            <div style={{background:'rgba(13,122,95,0.2)',border:'1px solid #0d7a5f',borderRadius:12,padding:20,marginTop:20,textAlign:'center'}}>
              <div style={{fontSize:32,marginBottom:10}}>\u2705</div>
              <div style={{fontSize:14,fontWeight:600,color:'#6ee7b7'}}>Mensagem enviada!</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.55)',marginTop:6}}>Retornaremos em at\u00e9 24h.</div>
            </div>
          ):(
            <form onSubmit={sendContact} style={{marginTop:20,display:'flex',flexDirection:'column',gap:10}}>
              {([{label:'Nome',key:'name',type:'text',ph:'Seu nome'},{label:'E-mail',key:'email',type:'email',ph:'seu@email.com'}] as any[]).map(f=>(
                <div key={f.key}>
                  <label style={plbl}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} required value={(contact as any)[f.key]} onChange={e=>setContact(p=>({...p,[f.key]:e.target.value}))} style={pinp}/>
                </div>
              ))}
              <div>
                <label style={plbl}>Mensagem</label>
                <textarea placeholder="Escreva sua mensagem\u2026" required rows={4} value={contact.msg} onChange={e=>setContact(p=>({...p,msg:e.target.value}))} style={{...pinp,resize:'none',height:96}}/>
              </div>
              <button type="submit" disabled={sending} style={{...pbtnP,opacity:sending?.7:1}}>{sending?'Enviando\u2026':'Enviar mensagem'}</button>
            </form>
          )}
          <div style={{marginTop:20,fontSize:12,color:'rgba(255,255,255,0.4)',lineHeight:1.8}}>\uD83D\uDCE7 contato@interaanalises.com.br{`\n`}\uD83C\uDF10 interaanalises.com.br</div>
        </div>
      );
      default:return null;
    }
  };

  return(
    <div style={{fontFamily:"'Syne','DM Sans',sans-serif",width:'100vw',height:'100vh',display:'flex',overflow:'hidden',position:'relative'}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>

      {/* ESQUERDA — hero */}
      <div style={{flex:1,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#0a0e1a 0%,#0d1f2d 50%,#091a14 100%)'}}>
        <div style={{position:'absolute',inset:0,background:'url(https://images.unsplash.com/photo-1576086213369-97a306d36557?w=1200&q=80) center/cover no-repeat',opacity:.3}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(9,26,20,0.85) 0%,rgba(10,14,26,0.6) 60%,transparent 100%)'}}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:'30%',background:'linear-gradient(to top,#0d7a5f 0%,transparent 100%)',opacity:.7}}/>
        <div style={{position:'relative',zIndex:2,height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'48px 52px'}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:4,color:'rgba(255,255,255,0.4)',textTransform:'uppercase'}}>healthtech \u00b7 diagn\u00f3stico</div>
          <div>
            <div style={{lineHeight:.92,marginBottom:28}}>
              <div style={{fontSize:'clamp(64px,8vw,110px)',fontWeight:800,color:'#fff',fontFamily:"'Syne',sans-serif",letterSpacing:'-3px',textShadow:'0 0 80px rgba(13,122,95,0.4)'}}>Intera</div>
              <div style={{fontSize:'clamp(64px,8vw,110px)',fontWeight:800,fontFamily:"'Syne',sans-serif",letterSpacing:'-3px',background:'linear-gradient(90deg,#0d7a5f,#6ee7b7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>An\u00e1lises</div>
            </div>
            <div style={{fontSize:'clamp(14px,1.5vw,18px)',fontWeight:400,color:'rgba(255,255,255,0.6)',letterSpacing:1,lineHeight:1.5,maxWidth:380}}>Diagn\u00f3sticos direcionais por IA \u2014 entenda seus exames, encontre o especialista certo.</div>
            {!loading&&!user&&(
              <button onClick={()=>setAuthOpen(true)} style={{marginTop:32,display:'inline-flex',alignItems:'center',gap:10,background:'#0d7a5f',color:'#fff',border:'none',borderRadius:12,padding:'14px 28px',fontSize:14,fontWeight:600,cursor:'pointer',letterSpacing:.3,boxShadow:'0 0 40px rgba(13,122,95,0.5)',fontFamily:"'DM Sans',sans-serif"}}>
                Come\u00e7ar agora \u2014 \u00e9 gr\u00e1tis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            )}
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.25)',letterSpacing:.5}}>\u00a9 2026 InteraAnalises \u00b7 Plataforma educativa em sa\u00fade</div>
        </div>
      </div>

      {/* DIREITA — menu + painel */}
      <div ref={panelRef} style={{width:active?480:280,transition:'width 0.35s cubic-bezier(0.4,0,0.2,1)',background:'linear-gradient(160deg,#0d1117 0%,#0a1628 100%)',borderLeft:'1px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
        {/* Menu items */}
        <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',height:'100%',zIndex:2,position:'relative'}}>
          {MENU.map((item,i)=>(
            <button key={item.id} onClick={()=>toggle(item.id)} style={{display:'flex',alignItems:'center',gap:16,padding:'22px 32px',background:active===item.id?'rgba(13,122,95,0.15)':'transparent',border:'none',borderLeft:active===item.id?'3px solid #0d7a5f':'3px solid transparent',cursor:'pointer',width:'100%',textAlign:'left',transition:'all 0.2s',borderBottom:i<MENU.length-1?'1px solid rgba(255,255,255,0.05)':'none',fontFamily:"'Syne',sans-serif"}}>
              <div style={{width:36,height:36,borderRadius:10,background:active===item.id?'rgba(13,122,95,0.4)':'rgba(255,255,255,0.07)',display:'flex',alignItems:'center',justifyContent:'center',color:active===item.id?'#6ee7b7':'rgba(255,255,255,0.4)',flexShrink:0,transition:'all 0.2s'}}>
                <Ic d={item.icon}/>
              </div>
              <span style={{fontSize:13,fontWeight:active===item.id?700:500,color:active===item.id?'#fff':'rgba(255,255,255,0.55)',letterSpacing:.2,transition:'color 0.2s'}}>{item.label}</span>
              <svg style={{marginLeft:'auto',opacity:active===item.id?1:.25,transform:active===item.id?'rotate(90deg)':'none',transition:'all .2s',flexShrink:0}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          ))}
        </div>
        {/* Painel expansivo */}
        <div style={{position:'absolute',left:280,top:0,right:0,bottom:0,overflowY:'auto',padding:active?'48px 32px':'48px 0',opacity:active?1:0,transition:'opacity 0.25s 0.1s',scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.1) transparent'}}>
          {renderPanel()}
        </div>
        <div style={{position:'absolute',right:0,top:'10%',bottom:'10%',width:1,background:'linear-gradient(to bottom,transparent,rgba(13,122,95,0.5),transparent)'}}/>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen}/>
    </div>
  );
}

const ph2:React.CSSProperties={fontSize:20,fontWeight:800,color:'#fff',letterSpacing:'-0.3px',marginBottom:8,fontFamily:"'Syne',sans-serif"};
const psub:React.CSSProperties={fontSize:13,color:'rgba(255,255,255,0.5)',lineHeight:1.65};
const pbtnP:React.CSSProperties={background:'#0d7a5f',color:'#fff',border:'none',borderRadius:10,padding:'12px 20px',fontSize:14,fontWeight:600,cursor:'pointer',width:'100%',letterSpacing:.2};
const pbtnO:React.CSSProperties={background:'transparent',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:10,padding:'12px 20px',fontSize:14,fontWeight:500,cursor:'pointer',width:'100%'};
const plbl:React.CSSProperties={display:'block',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.4)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:6};
const pinp:React.CSSProperties={width:'100%',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'#fff',outline:'none',boxSizing:'border-box'};
