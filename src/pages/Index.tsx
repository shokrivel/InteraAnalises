import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Microscope, Droplet, Users, Shield, BookOpen } from "lucide-react";
import AuthDialog from "@/components/auth/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index: checking auth state', { user: !!user, loading });
    if (!loading && user) {
      console.log('Index: redirecting to profile');
      navigate('/profile', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo-interasaude-new.png" 
              alt="InteraSaúde Logo" 
              className="h-10"
            />
          </div>
          
          {!loading && (
            user ? (
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  Meu Perfil
                </Button>
                <Button 
                  variant="ghost" 
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
              <Button size="lg" onClick={() => setAuthDialogOpen(true)}>
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
            <Button size="lg" onClick={() => setAuthDialogOpen(true)}>
              Criar Conta Gratuita
            </Button>
          </div>
        </div>
      </section>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default Index;
