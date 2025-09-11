import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Heart, Users, Settings, FileText, Shield, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import FieldsManagement from "@/components/admin/FieldsManagement";
import UserManagement from "@/components/admin/UserManagement";
import SystemSettings from "@/components/admin/SystemSettings";

const AdminPanel = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator, hasAdminAccess } = useRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-4">
                Você não tem permissão para acessar esta área.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Painel {isAdmin ? 'Administrativo' : 'de Moderação'}
            </h1>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"} className="flex items-center gap-2">
            {isAdmin ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {isAdmin ? 'Administrador' : 'Moderador'}
          </Badge>
        </div>
      </header>

      {/* Admin Content */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="fields">Campos</TabsTrigger>
              {isAdmin && <TabsTrigger value="settings">Configurações</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Gestão de Usuários</CardTitle>
                    <CardDescription>
                      Gerencie perfis e permissões dos usuários do sistema
                    </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <Button 
                       variant="outline" 
                       onClick={() => setActiveTab('users')}
                     >
                       Gerenciar Usuários
                     </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Campos da Consulta</CardTitle>
                    <CardDescription>
                      Configure os campos que aparecem na consulta por nível de conhecimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('fields')}
                    >
                      Gerenciar Campos
                    </Button>
                  </CardContent>
                </Card>

                {isAdmin && (
                  <Card>
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <Settings className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle>Configurações</CardTitle>
                      <CardDescription>
                        Configurações gerais do sistema
                      </CardDescription>
                     </CardHeader>
                     <CardContent>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('settings')}
                        >
                          Abrir Configurações
                        </Button>
                     </CardContent>
                   </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="fields">
              <FieldsManagement />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="settings">
                <SystemSettings />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;