import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';

const TEAL       = '#00BDB0';
const TEAL_DARK  = '#008F89';
const TEAL_LIGHT = '#E0F7F6';
const SLATE      = '#3D4A52';

interface Post {
  id: string;
  title: string;
  summary: string;
  tag: string;
  published_at: string;
}

export default function Noticias() {
  const navigate = useNavigate();
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('news_posts')
      .select('id,title,summary,tag,published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#f4fbfa', fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{
        background:'#fff',
        borderBottom:`1px solid ${TEAL}33`,
        padding:'0 clamp(14px,4vw,28px)',
        height:64,
        display:'flex', alignItems:'center', gap:12,
        position:'sticky', top:0, zIndex:50,
        flexWrap:'wrap',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background:'none', border:`1px solid ${TEAL}55`, borderRadius:8, padding:'6px 12px', fontSize:13, fontWeight:600, color:TEAL_DARK, cursor:'pointer', whiteSpace:'nowrap' }}
        >
          ← Voltar
        </button>
        <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        <div style={{ fontSize:12, color:'#8C9BAA', marginLeft:'auto', whiteSpace:'nowrap' }}>Noticias e updates</div>
      </div>

      {/* Conteudo */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'clamp(24px,5vw,40px) clamp(14px,4vw,24px)' }}>
        <h1 style={{ fontSize:'clamp(20px,5vw,28px)', fontWeight:800, color:SLATE, marginBottom:8 }}>
          Noticias e updates
        </h1>
        <p style={{ fontSize:'clamp(12px,2vw,14px)', color:'#8C9BAA', marginBottom:32 }}>
          Acompanhe as novidades da plataforma e da medicina diagnostica.
        </p>

        {loading && (
          <div style={{ textAlign:'center', padding:60, color:'#8C9BAA' }}>Carregando...</div>
        )}

        {!loading && posts.length === 0 && (
          <div style={{ textAlign:'center', padding:'clamp(32px,6vw,60px)', background:'#fff', borderRadius:16, border:`1px solid ${TEAL}33` }}>
            <div style={{ fontSize:36, marginBottom:12 }}>&#128240;</div>
            <div style={{ fontSize:15, fontWeight:600, color:SLATE }}>Nenhuma publicacao ainda</div>
            <div style={{ fontSize:13, color:'#8C9BAA', marginTop:6 }}>Em breve novidades por aqui.</div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {posts.map(p => (
            <div
              key={p.id}
              style={{ background:'#fff', borderRadius:14, border:`1px solid ${TEAL}33`, padding:'clamp(14px,3vw,20px) clamp(14px,4vw,24px)' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:10, fontWeight:700, background:TEAL_LIGHT, color:TEAL_DARK, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                  {p.tag}
                </span>
                <span style={{ fontSize:11, color:'#8C9BAA' }}>
                  {new Date(p.published_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
                </span>
              </div>
              <div style={{ fontSize:'clamp(14px,2.5vw,17px)', fontWeight:700, color:SLATE, marginBottom:8 }}>{p.title}</div>
              <div style={{ fontSize:'clamp(12px,1.8vw,13px)', color:'#6b7280', lineHeight:1.65 }}>{p.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
