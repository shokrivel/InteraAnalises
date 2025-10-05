import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
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

interface SaibaMaisCard {
  id: string;
  titulo: string;
  descricao?: string;
  url_imagem: string;
  ordem: number;
  ativo: boolean;
}

const SaibaMais = () => {
  const [content, setContent] = useState<PageContent | null>(null);
  const [cards, setCards] = useState<SaibaMaisCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch page content
        const { data: pageData, error: pageError } = await supabase
          .from('paginas_conteudo')
          .select('*')
          .eq('slug', 'saiba-mais')
          .maybeSingle();

        if (pageError && pageError.code !== 'PGRST116') {
          console.error('Error fetching page content:', pageError);
          setError('Erro ao carregar o conteúdo da página.');
          return;
        }

        if (pageData) {
          setContent(pageData);
        }

        // Fetch cards
        const { data: cardsData, error: cardsError } = await (supabase as any)
          .from('saiba_mais_cards')
          .select('*')
          .eq('ativo', true)
          .order('ordem', { ascending: true });

        if (cardsError) {
          console.error('Error fetching cards:', cardsError);
        } else {
          setCards(cardsData || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Erro inesperado ao carregar o conteúdo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
              src={interasaudeLogo} 
              alt="InteraSaúde Logo" 
              className="h-8 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
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

          {/* Image Cards Section */}
          {cards.length > 0 && (
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-bold text-center">Recursos Adicionais</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <Card key={card.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={card.url_imagem} 
                        alt={card.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{card.titulo}</h3>
                      {card.descricao && (
                        <p className="text-muted-foreground text-sm">{card.descricao}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SaibaMais;