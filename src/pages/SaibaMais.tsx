import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PageContent {
  id: string;
  slug: string;
  titulo: string;
  conteudo_texto: string;
  url_imagem?: string;
}

const SaibaMais = () => {
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('paginas_conteudo')
          .select('*')
          .eq('slug', 'saiba-mais')
          .single();

        if (error) {
          console.error('Error fetching page content:', error);
          setError('Erro ao carregar o conteúdo da página.');
          return;
        }

        setContent(data);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Erro inesperado ao carregar o conteúdo.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando conteúdo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="container mx-auto px-4 py-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
        </header>
        
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2 text-destructive">Erro</h2>
                <p className="text-muted-foreground mb-4">
                  {error || 'Conteúdo não encontrado.'}
                </p>
                <Button onClick={() => navigate('/')}>
                  Voltar para Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center space-x-3">
            <img 
              src="/logo-interasaude-new.png" 
              alt="InteraSaúde Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-foreground">InteraSaúde</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {content.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              {content.url_imagem && (
                <div className="mb-8 text-center">
                  <img 
                    src={content.url_imagem} 
                    alt="Imagem da página"
                    className="mx-auto rounded-lg shadow-md max-w-full h-auto"
                  />
                </div>
              )}
              
              <div className="space-y-6 text-foreground leading-relaxed">
                {content.conteudo_texto.split('\n\n').map((paragraph, index) => (
                  <div key={index}>
                    {paragraph.startsWith('•') ? (
                      // Handle bullet points
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        {paragraph.split('\n').map((item, itemIndex) => (
                          <li key={itemIndex} className="text-muted-foreground">
                            {item.replace('•', '').trim()}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      // Regular paragraph
                      <p className="text-lg leading-relaxed">
                        {paragraph}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/')}
                  className="bg-primary hover:bg-primary/90"
                >
                  Começar sua Consulta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SaibaMais;