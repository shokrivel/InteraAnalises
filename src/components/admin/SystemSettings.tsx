import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Database, Bell, Shield, Save, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SaibaMaisManagement from "./SaibaMaisManagement";

const SystemSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // General Settings
  const [systemName, setSystemName] = useState("InteraSaúde");
  const [systemDescription, setSystemDescription] = useState("Plataforma interativa para Parasitologia, Bioquímica e Hematologia");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  
  // AI Settings
  const [maxTokens, setMaxTokens] = useState("4000");
  const [temperature, setTemperature] = useState("0.7");
  const [systemPrompt, setSystemPrompt] = useState(`Você é um assistente especializado em saúde, com foco em Parasitologia, Bioquímica e Hematologia. Suas respostas devem sempre se basear em literatura científica confiável (PubMed, LILACS, Science Direct e periódicos indexados). Respeite os limites de tempo das fontes: até 5 anos para Bioquímica/Hematologia e até 10 anos para Parasitologia. Nunca forneça diagnósticos definitivos — sempre recomende consulta médica presencial. As respostas devem ser adaptadas ao perfil do usuário: Paciente: linguagem simples, acessível e didática. Utilizar nomes populares e colocar o nome técnico entre parênteses, por exemplo: exame de sangue (Hemograma). Respostas resumidas (até ~1500 tokens), tom acolhedor e natural, com temperatura simulada de 0,6–0,7. Referências não são obrigatórias. Acadêmico: linguagem técnica intermediária, estilo de resumo científico. Respostas mais detalhadas (até ~2500 tokens), tom objetivo e técnico, com temperatura simulada de 0,5–0,6. Referências devem ser citadas de forma resumida no formato (Autor, Ano, Periódico). Profissional da Saúde: linguagem científica avançada, com detalhamento técnico e terminologia específica. Respostas completas (até ~3500 tokens), tom focado e preciso, com temperatura simulada de 0,4–0,5. Referências obrigatórias em padrão ABNT, utilizando somente fontes atuais (até 5 anos para bioquímica/hematologia e até 10 anos para parasitologia). Após sugerir hipóteses diagnósticas, sempre indique profissionais da saúde próximos (médicos, farmacêuticos, biomédicos, laboratórios), utilizando a localização cadastrada pelo usuário. Essa etapa deve integrar-se com a Google Maps API. Se o perfil não for informado, solicite que o usuário selecione o perfil antes de gerar a resposta.`);
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newUserNotifications, setNewUserNotifications] = useState(true);
  const [errorNotifications, setErrorNotifications] = useState(true);
  
  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState("7200"); // 2 hours in seconds
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("5");
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);

  const handleSave = async (category: string) => {
    setLoading(true);
    
    try {
      // Simulate API call - in a real app, this would save to your settings table
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configurações salvas",
        description: `As configurações de ${category} foram atualizadas com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemReset = async () => {
    if (!confirm("Tem certeza que deseja resetar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.")) {
      return;
    }

    setLoading(true);
    
    try {
      // Reset to default values
      setSystemName("InteraSaúde");
      setSystemDescription("Plataforma interativa para Parasitologia, Bioquímica e Hematologia");
      setMaintenanceMode(false);
      setRegistrationEnabled(true);
      setMaxTokens("4000");
      setTemperature("0.7");
      setEmailNotifications(true);
      setNewUserNotifications(true);
      setErrorNotifications(true);
      setSessionTimeout("7200");
      setMaxLoginAttempts("5");
      setRequireEmailVerification(true);
      
      toast({
        title: "Configurações resetadas",
        description: "Todas as configurações foram restauradas para os valores padrão.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível resetar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações do Sistema
        </CardTitle>
        <CardDescription>
          Gerencie as configurações gerais do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="ai">IA</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemName">Nome do Sistema</Label>
                <Input
                  id="systemName"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systemDescription">Descrição do Sistema</Label>
                <Textarea
                  id="systemDescription"
                  value={systemDescription}
                  onChange={(e) => setSystemDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Impede o acesso de usuários ao sistema
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Registro de Novos Usuários</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que novos usuários se cadastrem
                  </p>
                </div>
                <Switch
                  checked={registrationEnabled}
                  onCheckedChange={setRegistrationEnabled}
                />
              </div>
            </div>

            <Button onClick={() => handleSave("geral")} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações Gerais
            </Button>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Máximo de Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Número máximo de tokens para respostas da IA
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Controla a criatividade das respostas (0.0 - 2.0)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={6}
                />
                <p className="text-sm text-muted-foreground">
                  Instruções base para a IA em todas as consultas
                </p>
              </div>
            </div>

            <Button onClick={() => handleSave("IA")} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações de IA
            </Button>
          </TabsContent>

          {/* Content Management */}
          <TabsContent value="content" className="space-y-6">
            <SaibaMaisManagement />
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificações administrativas por email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Notificações de Novos Usuários</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar quando novos usuários se cadastrarem
                  </p>
                </div>
                <Switch
                  checked={newUserNotifications}
                  onCheckedChange={setNewUserNotifications}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Notificações de Erro</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar sobre erros críticos do sistema
                  </p>
                </div>
                <Switch
                  checked={errorNotifications}
                  onCheckedChange={setErrorNotifications}
                />
              </div>
            </div>

            <Button onClick={() => handleSave("notificações")} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações de Notificações
            </Button>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Timeout de Sessão (segundos)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Tempo limite para sessões inativas (padrão: 2 horas = 7200s)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Máximo de Tentativas de Login</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={maxLoginAttempts}
                  onChange={(e) => setMaxLoginAttempts(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Número de tentativas antes de bloquear temporariamente
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label>Verificação de Email Obrigatória</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir verificação de email para novos usuários
                  </p>
                </div>
                <Switch
                  checked={requireEmailVerification}
                  onCheckedChange={setRequireEmailVerification}
                />
              </div>
            </div>

            <Button onClick={() => handleSave("segurança")} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Configurações de Segurança
            </Button>
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <div className="border-t pt-6 mt-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-destructive">Zona de Perigo</h3>
              <p className="text-sm text-muted-foreground">
                Ações irreversíveis que podem afetar o funcionamento do sistema.
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              onClick={handleSystemReset}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Resetar Todas as Configurações
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;