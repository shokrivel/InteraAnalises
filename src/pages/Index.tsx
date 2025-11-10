import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import interasaudeLogo from "@/assets/interasaude-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Microscope, Droplet, Users, Shield, BookOpen, Menu } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface Page {
  id: string;
  title: string;
  slug: string;
  parent_id?: string;
  children?: Page[];
}

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [menuPages, setMenuPages] = useState<Page[]>([]);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuPages();
  }, []);

  const fetchMenuPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, slug, parent_id')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      const organized = organizePages((data || []) as Page[]);
      setMenuPages(organized);
    } catch (error) {
      console.error('Error fetching menu pages:', error);
    }
  };

  const organizePages = (pages: Page[]): Page[] => {
    const pageMap = new Map<string, Page>();
    const rootPages: Page[] = [];

    pages.forEach(page => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    pages.forEach(page => {
      const pageWithChildren = pageMap.get(page.id)!;
      
      if (page.parent_id) {
        const parent = pageMap.get(page.parent_id);
        if (parent) {
          parent.children!.push(pageWithChildren);
        }
      } else {
        rootPages.push(pageWithChildren);
      }
    });

    return rootPages;
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <img 
              src={interasaudeLogo} 
              alt="InteraSaúde Logo" 
              className="h-10 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate("/")}
            />
            
            {menuPages.length > 0 && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-8 px-2 gap-1">
                      <Menu className="h-4 w-4" />
                      <span className="text-sm">Menu</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        {menuPages.map((page) => (
                          <li key={page.id}>
                            <NavigationMenuLink asChild>
                              <a
                                href={`/page/${page.slug}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              >
                                <div className="text-sm font-medium leading-none">{page.title}</div>
                                {page.children && page.children.length > 0 && (
                                  <ul className="mt-2 ml-4 space-y-1">
                                    {page.children.map((child) => (
                                      <li key={child.id}>
                                        <a
                                          href={`/page/${child.slug}`}
                                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          {child.title}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </a>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>
          
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                <Button onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('🚪 Force logout - clearing all auth data');
                    
                    // Clear all possible auth storage
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Force page reload to reset all state
                    window.location.reload();
                  }}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <Button onClick={() => setAuthDialogOpen(true)}>
                Entrar / Cadastrar
              </Button>
            )
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              Plataforma Educativa em Saúde
            </Badge>
            <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
              Sua plataforma interativa para
              <span className="text-primary"> Parasitologia, Bioquímica e Hematologia</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Obtenha respostas personalizadas baseadas em evidências científicas atualizadas, 
              com linguagem adaptada ao seu perfil profissional.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => user ? navigate('/consultation') : setAuthDialogOpen(true)}
              >
                Começar Agora
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/saiba-mais')}>
                Saiba Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Funcionalidades Principais
            </h3>
            <p className="text-lg text-muted-foreground">
              Tudo que você precisa para uma consulta médica informada
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Microscope className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Análise Especializada</CardTitle>
                <CardDescription>
                  Parasitologia, Bioquímica e Hematologia com IA Gemini 2.5 Pro
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Perfis Personalizados</CardTitle>
                <CardDescription>
                  Linguagem adaptada para Pacientes, Acadêmicos e Profissionais de Saúde
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Droplet className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Histórico Completo</CardTitle>
                <CardDescription>
                  Acompanhe sintomas, exames e evolução clínica ao longo do tempo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Evidências Científicas</CardTitle>
                <CardDescription>
                  Respostas baseadas em literatura confiável com referências atualizadas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Encaminhamentos</CardTitle>
                <CardDescription>
                  Localização de profissionais de saúde próximos com Google Maps
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Interface Intuitiva</CardTitle>
                <CardDescription>
                  Coleta de informações através de balões interativos simples
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground mb-6">
              Pronto para começar?
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Crie sua conta e tenha acesso a consultas personalizadas com base em evidências científicas.
            </p>
            <Button 
              size="lg" 
              onClick={() => user ? navigate('/consultation') : setAuthDialogOpen(true)}
            >
              {user ? 'Iniciar Consulta' : 'Criar Conta Gratuita'}
            </Button>
          </div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default Index;
