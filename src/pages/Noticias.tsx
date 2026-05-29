import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Post {
  id: string;
  title: string;
  summary: string;
  tag: string;
  published_at: string;
}

export default function Noticias() {
  const navigate = useNavigate();
  const [posts, setPosts]   = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('news_posts')
      .select('id,title,summary,tag,published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const BLUE = '#3b4da0';

  return (
    <div style={{ minHeight:'100vh', background:'#f8f9ff', fontFamily:"'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e8eaf0', padding:'14px 28px', display:'flex', alignItems:'center', gap:16 }}>
        <button
          onClick={() => navigate('/')}
          style={{ background:'none', border:'1px solid #e0e0e8', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, color:'#555', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}
        >
          ← Voltar
        </button>
        <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:20, fontWeight:900, color:BLUE }}>
          Intera<span style={{ color:'#5562c4' }}>Analises</span>
        </div>
        <div style={{ fontSize:13, color:'#888', marginLeft:'auto' }}>Noticias e updates</div>
      </div>

      {/* Conteudo */}
      <div style={{ maxWidth:760, margin:'0 auto', padding:'40px 24px' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:BLUE, marginBottom:8 }}>
          Noticias e updates
        </h1>
        <p style={{ fontSize:14, color:'#888', marginBottom:36 }}>
          Acompanhe as novidades da plataforma e da medicina diagnostica.
        </p>

        {loading && (
          <div style={{ textAlign:'center', padding:60, color:'#aaa' }}>Carregando...</div>
        )}

        {!loading && posts.length === 0 && (
          <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:16, border:'1px solid #e8eaf0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📰</div>
            <div style={{ fontSize:15, fontWeight:600, color:'#555' }}>Nenhuma publicacao ainda</div>
            <div style={{ fontSize:13, color:'#aaa', marginTop:6 }}>Em breve novidades por aqui.</div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {posts.map(p => (
            <div key={p.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #e8eaf0', padding:'20px 24px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontSize:10, fontWeight:700, background:'rgba(59,77,160,0.1)', color:BLUE, padding:'3px 10px', borderRadius:20 }}>
                  {p.tag}
                </span>
                <span style={{ fontSize:11, color:'#aaa' }}>
                  {new Date(p.published_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}
                </span>
              </div>
              <div style={{ fontSize:17, fontWeight:700, color:'#2d2d4e', marginBottom:8 }}>{p.title}</div>
              <div style={{ fontSize:13, color:'#666', lineHeight:1.65 }}>{p.summary}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
