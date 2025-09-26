import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: any;
  page_type: string;
  is_active: boolean;
}

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (error) {
          console.error("Erro ao buscar página:", error);
          navigate("/404");
          return;
        }

        if (!data) {
          navigate("/404");
          return;
        }

        setPageData(data);
      } catch (error) {
        console.error("Erro ao carregar página:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar a página.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return null;
  }

  const renderContent = () => {
    if (pageData.page_type === 'informational') {
      return (
        <div className="prose prose-lg max-w-none">
          {pageData.content?.sections?.map((section: any, index: number) => (
            <div key={index} className="mb-8">
              {section.type === 'text' && (
                <div 
                  className="text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}
              {section.type === 'heading' && (
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {section.content}
                </h2>
              )}
              {section.type === 'image' && section.url && (
                <div className="my-6">
                  <img 
                    src={section.url} 
                    alt={section.alt || ''} 
                    className="rounded-lg shadow-sm max-w-full h-auto"
                  />
                  {section.caption && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {section.caption}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Fallback para conteúdo simples
    if (typeof pageData.content === 'string') {
      return (
        <div 
          className="prose prose-lg max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Esta página ainda não possui conteúdo configurado.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <img 
              src={interasaudeLogo} 
              alt="InteraSaúde Logo" 
              className="h-8"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center">
                {pageData.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;