import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Settings, FileText, Shield, Crown, Layout, Pill } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import FieldsManagement from "@/components/admin/FieldsManagement";
import UserManagement from "@/components/admin/UserManagement";
import SystemSettings from "@/components/admin/SystemSettings";
import PageManagement from "@/components/admin/PageManagement";
import FarmAppAdminSettings from "@/components/admin/FarmAppAdminSettings";

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
              <p className="text-muted-foreground mb-4">Voc\u00ea n\u00e3o tem permiss\u00e3o para acessar esta \u00e1rea.</p>
              <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tabs = isAdmin
    ? ['overview','users','pages','fields','settings','farmapp']
    : ['overview','users','pages','fields'];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
            <span className="font-black italic text-2xl text-[#0a6e52]">Intera<span className="text-[#10b981]">Analises</span></span>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"} className="flex items-center gap-2">
            {isAdmin ? <Crown className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
            {isAdmin ? 'Administrador' : 'Moderador'}
          </Badge>
        </div>
      </header>

      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
              <TabsTrigger value="overview">Vis\u00e3o Geral</TabsTrigger>
              <TabsTrigger value="users">Usu\u00e1rios</TabsTrigger>
              <TabsTrigger value="pages">P\u00e1ginas</TabsTrigger>
              <TabsTrigger value="fields">Campos</TabsTrigger>
              {isAdmin && <TabsTrigger value="settings">Configura\u00e7\u00f5es</TabsTrigger>}
              {isAdmin && (
                <TabsTrigger value="farmapp" className="flex items-center gap-1.5">
                  <Pill className="w-4 h-4" />FarmApp
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {icon:<Users className="w-6 h-6 text-primary"/>,title:'Gest\u00e3o de Usu\u00e1rios',desc:'Gerencie perfis e permiss\u00f5es',tab:'users',btn:'Gerenciar Usu\u00e1rios'},
                  {icon:<Layout className="w-6 h-6 text-primary"/>,title:'Gerenciar P\u00e1ginas',desc:'Crie e gerencie p\u00e1ginas informativas',tab:'pages',btn:'Gerenciar P\u00e1ginas'},
                  {icon:<FileText className="w-6 h-6 text-primary"/>,title:'Campos da Consulta',desc:'Configure campos por n\u00edvel de conhecimento',tab:'fields',btn:'Gerenciar Campos'},
                  ...(isAdmin ? [
                    {icon:<Settings className="w-6 h-6 text-primary"/>,title:'Configura\u00e7\u00f5es',desc:'Configura\u00e7\u00f5es gerais do sistema',tab:'settings',btn:'Abrir Configura\u00e7\u00f5es'},
                    {icon:<Pill className="w-6 h-6 text-primary"/>,title:'FarmApp',desc:'Teleconsulta, atendentes, fila de chat',tab:'farmapp',btn:'Painel FarmApp'},
                  ] : []),
                ].map(({icon,title,desc,tab,btn})=>(
                  <Card key={tab}>
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">{icon}</div>
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" onClick={()=>setActiveTab(tab)}>{btn}</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users"><UserManagement /></TabsContent>
            <TabsContent value="pages"><PageManagement /></TabsContent>
            <TabsContent value="fields"><FieldsManagement /></TabsContent>
            {isAdmin && <TabsContent value="settings"><SystemSettings /></TabsContent>}
            {isAdmin && <TabsContent value="farmapp"><FarmAppAdminSettings /></TabsContent>}
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default AdminPanel;
