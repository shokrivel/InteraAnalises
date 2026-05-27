import{useState}from'react';
import{useNavigate}from'react-router-dom';
import{useAuth}from'@/contexts/AuthContext';
import AuthDialog from'@/components/auth/AuthDialog';
import{supabase}from'@/integrations/supabase/client';

type Section='auth'|'news'|'pricing'|'about'|'contact'|null;

const NEWS=[
  {date:'Mai 2026',tag:'Atualiza\u00e7\u00e3o',title:'IA Gemini 2.5 agora dispon\u00edvel',body:'A nova vers\u00e3o analisa exames com ainda mais precis\u00e3o e retorna indica\u00e7\u00f5es de especialistas em segundos.'},
  {date:'Abr 2026',tag:'Feature',title:'Busca de especialistas por localiza\u00e7\u00e3o',body:'O sistema detecta sua localiza\u00e7\u00e3o e sugere profissionais pr\u00f3ximos ap\u00f3s a an\u00e1lise.'},
  {date:'Mar 2026',tag:'Parceria',title:'InteraAnalises + InteraSa\u00fade',body:'Integra\u00e7\u00e3o completa com o ecossistema InteraSa\u00fade para acompanhamento longitudinal.'},
];
const PLANS=[
  {name:'Gratuito',price:'R$ 0',period:'/m\u00eas',features:['3 an\u00e1lises por m\u00eas','Indica\u00e7\u00e3o de especialista'],cta:'Come\u00e7ar gr\u00e1tis',hi:false},
  {name:'Profissional',price:'R$ 29,90',period:'/m\u00eas',features:['An\u00e1lises ilimitadas','Todos os perfis cl\u00ednicos','Relat\u00f3rio PDF'],cta:'Assinar agora',hi:true},
  {name:'Cl\u00ednica',price:'R$ 99,90',period:'/m\u00eas',features:['M\u00faltiplos usu\u00e1rios','API de integra\u00e7\u00e3o','SLA 99,9%'],cta:'Falar com vendas',hi:false},
];
const TEAM=[
  {name:'Dr. Igor Souza',role:'Fundador & Biom\u00e9dico'},
  {name:'Dra. Ana Ferreira',role:'Parasitologia Cl\u00ednica'},
  {name:'Prof. Carlos Lima',role:'Hematologia & IA M\u00e9dica'},
];

export default function Index(){
  const{user,loading}=useAuth();
  const navigate=useNavigate();
  const[active,setActive]=useState<Section>(null);
  const[authOpen,setAuthOpen]=useState(false);
  const[sending,setSending]=useState(false);
  const[sent,setSent]=useState(false);
  const[form,setForm]=useState({name:'',email:'',msg:''});

  if(!loading&&user){navigate('/dashboard');return null;}

  const toggle=(s:Section)=>setActive(p=>p===s?null:s);

  const sendContact=async(e:React.FormEvent)=>{
    e.preventDefault();
    setSending(true);
    await supabase.from('contact_messages').insert({name:form.name,email:form.email,message:form.msg});
    setSending(false);setSent(true);
    setForm({name:'',email:'',msg:''});
    setTimeout(()=>setSent(false),4000);
  };

  const MENU:Array<{id:Section;label:string}>= [
    {id:'auth',   label:'Entrar/Cadastre-se'},
    {id:'news',   label:'Not\u00edcias e updates'},
    {id:'pricing',label:'Assinatura'},
    {id:'about',  label:'Quem somos?'},
    {id:'contact',label:'Contato'},
  ];

  const renderContent=()=>{
    switch(active){
      case'auth':return(
        <div style={panel}>
          <h2 style={ptitle}>Acesse sua conta</h2>
          <p style={psub}>Entre para analisar seus exames com IA ou crie uma conta gratuita.</p>
          <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:24}}>
            <button onClick={()=>{setAuthOpen(true);setActive(null);}} style={btnP}>Entrar</button>
            <button onClick={()=>{setAuthOpen(true);setActive(null);}} style={btnO}>Criar conta gr\u00e1tis</button>
          </div>
        </div>
      );
      case'news':return(
        <div style={panel}>
          <h2 style={ptitle}>Not\u00edcias & Updates</h2>
          <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:16}}>
            {NEWS.map((n,i)=>(
              <div key={i} style={{borderLeft:'3px solid #00BCD4',paddingLeft:14}}>
                <div style={{display:'flex',gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,background:'rgba(0,188,212,0.2)',color:'#00BCD4',padding:'2px 8px',borderRadius:20}}>{n.tag}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{n.date}</span>
                </div>
                <div style={{fontSize:14,fontWeight:600,color:'#fff',marginBottom:4}}>{n.title}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.6)',lineHeight:1.6}}>{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      );
      case'pricing':return(
        <div style={panel}>
          <h2 style={ptitle}>Planos & Assinatura</h2>
          <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:10}}>
            {PLANS.map((pl,i)=>(
              <div key={i} style={{border:pl.hi?'1.5px solid #00BCD4':'1px solid rgba(255,255,255,0.15)',borderRadius:12,padding:'12px 14px',background:pl.hi?'rgba(0,188,212,0.1)':'rgba(255,255,255,0.04)',position:'relative'}}>
                {pl.hi&&<span style={{position:'absolute',top:-9,right:12,background:'#00BCD4',color:'#0d1b3e',fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:20}}>POPULAR</span>}
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:'#fff'}}>{pl.name}</span>
                  <span style={{fontSize:16,fontWeight:800,color:pl.hi?'#00BCD4':'#fff'}}>{pl.price}<span style={{fontSize:10,opacity:.6}}>{pl.period}</span></span>
                </div>
                <ul style={{margin:'0 0 10px',paddingLeft:0,listStyle:'none',display:'flex',flexDirection:'column',gap:3}}>
                  {pl.features.map((f,j)=>(<li key={j} style={{fontSize:12,color:'rgba(255,255,255,0.65)',display:'flex',gap:6}}><span style={{color:'#00BCD4'}}>\u2713</span>{f}</li>))}
                </ul>
                <button onClick={()=>{setAuthOpen(true);setActive(null);}} style={{...btnO,padding:'7px 0',fontSize:12,width:'100%',...(pl.hi?{background:'#00BCD4',borderColor:'#00BCD4',color:'#0d1b3e',fontWeight:700}:{})}}>{pl.cta}</button>
              </div>
            ))}
          </div>
        </div>
      );
      case'about':return(
        <div style={panel}>
          <h2 style={ptitle}>Quem somos?</h2>
          <p style={{...psub,marginBottom:16}}>Somos uma startup brasileira de healthtech que desenvolve IA especializada em an\u00e1lises laboratoriais — Parasitologia, Bioqu\u00edmica e Hematologia.</p>
          {TEAM.map((t,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:10,background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(0,188,212,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#00BCD4',flexShrink:0}}>{t.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
              <div><div style={{fontSize:13,fontWeight:600,color:'#fff'}}>{t.name}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginTop:2}}>{t.role}</div></div>
            </div>
          ))}
        </div>
      );
      case'contact':return(
        <div style={panel}>
          <h2 style={ptitle}>Contato</h2>
          {sent?(
            <div style={{background:'rgba(0,188,212,0.15)',border:'1px solid #00BCD4',borderRadius:10,padding:20,marginTop:16,textAlign:'center'}}>
              <div style={{fontSize:28,marginBottom:8}}>\u2705</div>
              <div style={{fontSize:14,fontWeight:600,color:'#00BCD4'}}>Mensagem enviada!</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:4}}>Retornaremos em at\u00e9 24h.</div>
            </div>
          ):(
            <form onSubmit={sendContact} style={{marginTop:16,display:'flex',flexDirection:'column',gap:10}}>
              {([{l:'Nome',k:'name',t:'text',p:'Seu nome'},{l:'E-mail',k:'email',t:'email',p:'email@exemplo.com'}]as any[]).map(f=>(
                <div key={f.k}>
                  <label style={plbl}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} required value={(form as any)[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={pinp}/>
                </div>
              ))}
              <div>
                <label style={plbl}>Mensagem</label>
                <textarea rows={4} required value={form.msg} onChange={e=>setForm(p=>({...p,msg:e.target.value}))} style={{...pinp,resize:'none',height:88}}/>
              </div>
              <button type="submit" disabled={sending} style={{...btnP,opacity:sending?.7:1}}>{sending?'Enviando\u2026':'Enviar'}</button>
            </form>
          )}
          <div style={{marginTop:14,fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.8}}>\uD83D\uDCE7 contato@interaanalises.com.br</div>
        </div>
      );
      default:return null;
    }
  };

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{overflow:hidden}
        .ia-root{width:100vw;height:100vh;display:flex;font-family:'Nunito',sans-serif;overflow:hidden}
        .ia-left{flex:1;position:relative;overflow:hidden}
        .ia-photo{position:absolute;inset:0;background:url('https://media.canva.com/v2/image-resize/format:PNG/height:133/quality:100/uri:ifs%3A%2F%2FM%2F05250f18-b7e7-40a9-8c32-a7c84e4e3d73/watermark:F/width:200?csig=AAAAAAAAAAAAAAAAAAAAAHmDmlZhRXP49LW2fzrM5Q40GxZJ4JCGxI3BzMl2Z3m6&exp=1779874422&osig=AAAAAAAAAAAAAAAAAAAAAOPhKfAJnFxownJOhuo6OjYqhmm3TmMgmDZ2VPF3djtK&signer=media-rpc&x-canva-quality=thumbnail') center/cover no-repeat;transform:scale(4);transform-origin:center}
        .ia-overlay{position:absolute;inset:0;background:rgba(255,255,255,0.02)}
        .ia-teal-bar{position:absolute;bottom:0;left:0;right:0;height:28%;background:#00BCD4;opacity:0.92}
        .ia-hero-txt{position:absolute;bottom:28%;left:0;right:0;padding:0 52px 32px}
        .ia-title{font-size:clamp(56px,7vw,96px);font-weight:900;color:#0d1b3e;line-height:0.9;letter-spacing:-2px}
        .ia-title span{display:block}
        .ia-sub{font-size:clamp(14px,1.5vw,20px);color:#0d1b3e;font-weight:700;margin-top:12px;opacity:0.8}
        .ia-right{width:360px;flex-shrink:0;background:#0d1b3e;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden}
        .ia-right-expanded{width:680px}
        .ia-menu{width:360px;flex-shrink:0}
        .ia-item{display:flex;align-items:center;padding:20px 28px;border-bottom:1px solid rgba(255,255,255,0.07);cursor:pointer;transition:background .15s;gap:14px;border:none;background:transparent;width:100%;text-align:left}
        .ia-item:hover,.ia-item.active{background:rgba(255,255,255,0.07)}
        .ia-item.active{border-left:3px solid #00BCD4}
        .ia-star{width:22px;height:22px;flex-shrink:0}
        .ia-item-label{flex:1;font-size:14px;font-weight:700;color:#fff;letter-spacing:0.2px}
        .ia-chevron{font-size:13px;color:rgba(255,255,255,0.4);margin-left:auto;transform:rotate(180deg);transition:transform .2s}
        .ia-item.active .ia-chevron{transform:rotate(0);color:#00BCD4}
        .ia-panel-wrap{flex:1;overflow-y:auto;border-left:1px solid rgba(255,255,255,0.1)}
        .ia-panel-wrap::-webkit-scrollbar{width:4px}
        .ia-panel-wrap::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15)}
        @media(max-width:900px){
          .ia-right,.ia-right-expanded{width:100%;position:absolute;inset:0}
          .ia-left{display:none}
        }
      `}</style>
      <div className="ia-root">
        {/* ESQUERDA */}
        <div className="ia-left">
          <div className="ia-photo" style={{backgroundImage:`url(https://media.canva.com/v2/image-resize/format:PNG/height:551/quality:100/uri:ifs%3A%2F%2FM%2F05250f18-b7e7-40a9-8c32-a7c84e4e3d73/watermark:F/width:826?csig=AAAAAAAAAAAAAAAAAAAAAHmDmlZhRXP49LW2fzrM5Q40GxZJ4JCGxI3BzMl2Z3m6&exp=1779874422&osig=AAAAAAAAAAAAAAAAAAAAAOPhKfAJnFxownJOhuo6OjYqhmm3TmMgmDZ2VPF3djtK&signer=media-rpc&x-canva-quality=screen)`,transform:'none',backgroundSize:'cover',backgroundPosition:'center'}}/>
          <div className="ia-teal-bar"/>
          <div className="ia-hero-txt">
            <div className="ia-title">
              <span>Intera</span>
              <span>An\u00e1lises</span>
            </div>
            <div className="ia-sub">Diagn\u00f3sticos direcionais</div>
          </div>
        </div>

        {/* DIREITA */}
        <div className={`ia-right${active?' ia-right-expanded':''}`} style={{transition:'width 0.3s cubic-bezier(0.4,0,0.2,1)',display:'flex',flexDirection:'row'}}>
          {/* Menu */}
          <div className="ia-menu" style={{display:'flex',flexDirection:'column',justifyContent:'center',borderRight:active?'1px solid rgba(255,255,255,0.1)':'none'}}>
            {MENU.map(item=>(
              <button key={item.id} className={`ia-item${active===item.id?' active':''}`} onClick={()=>toggle(item.id)} style={{borderLeft:active===item.id?'3px solid #00BCD4':'3px solid transparent'}}>
                {/* Estrela verde SVG — r\u00eplica exata do asset MAEWRAI7B-M */}
                <svg className="ia-star" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C10.5 7 7 10.5 2 12c5 1.5 8.5 5 10 10 1.5-5 5-8.5 10-10-5-1.5-8.5-5-10-10z" fill="#4CAF50"/>
                </svg>
                <span className="ia-item-label">{item.label}</span>
                {/* Seta branca < pequena — r\u00eplica do asset MADWz0YNEmk */}
                <svg width="8" height="13" viewBox="0 0 8 13" fill="none" className="ia-chevron">
                  <path d="M7 1L1 6.5 7 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>

          {/* Painel de conte\u00fado */}
          {active&&(
            <div className="ia-panel-wrap" style={{flex:1,padding:'40px 28px',overflowY:'auto'}}>
              {renderContent()}
            </div>
          )}
        </div>
      </div>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen}/>
    </>
  );
}

const panel:React.CSSProperties={maxWidth:280};
const ptitle:React.CSSProperties={fontSize:18,fontWeight:800,color:'#fff',marginBottom:8,letterSpacing:'-0.3px'};
const psub:React.CSSProperties={fontSize:13,color:'rgba(255,255,255,0.55)',lineHeight:1.65};
const btnP:React.CSSProperties={background:'#00BCD4',color:'#0d1b3e',border:'none',borderRadius:10,padding:'12px 18px',fontSize:13,fontWeight:800,cursor:'pointer',width:'100%'};
const btnO:React.CSSProperties={background:'transparent',color:'rgba(255,255,255,0.85)',border:'1px solid rgba(255,255,255,0.25)',borderRadius:10,padding:'12px 18px',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%'};
const plbl:React.CSSProperties={display:'block',fontSize:9,fontWeight:800,color:'rgba(255,255,255,0.4)',letterSpacing:1.5,textTransform:'uppercase',marginBottom:5};
const pinp:React.CSSProperties={width:'100%',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#fff',outline:'none'};
