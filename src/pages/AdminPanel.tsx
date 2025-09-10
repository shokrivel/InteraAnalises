import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, ArrowLeft, Users, MessageSquare, Shield, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  profile_type: string;
  city: string;
  created_at: string;
}

interface ConsultationHistory {
  id: string;
  user_id: string;
  symptoms: string[];
  ai_response: string;
  created_at: string;
  symptom_duration: number;
}

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  user_roles: {
    role: string;
  }[];
  profiles: Profile[];
}

const AdminPanel = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [consultations, setConsultations] = useState<ConsultationHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área",
        variant: "destructive",
      });
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchConsultations();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Buscar usuários com roles e perfis
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          created_at
        `);

      if (usersError) throw usersError;

      // Buscar perfis dos usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Combinar dados dos usuários
      const processedUsers = usersData.map(userRole => {
        const profile = profilesData.find(p => p.user_id === userRole.user_id);
        return {
          id: userRole.user_id,
          email: profile?.name || 'Nome não disponível',
          created_at: userRole.created_at,
          user_roles: [{ role: userRole.role }],
          profiles: profile ? [profile] : []
        };
      });

      setUsers(processedUsers);
    } catch (error) {
      toast({
        title: "Erro ao buscar usuários",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const fetchConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      toast({
        title: "Erro ao buscar consultas",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado com sucesso",
        description: "Até logo!",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Administrador
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Statistics Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{consultations.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.user_roles[0]?.role === 'admin').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="consultations">Consultas</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usuários Registrados</CardTitle>
                  <CardDescription>
                    Lista de todos os usuários da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome/Email</TableHead>
                        <TableHead>Tipo de Perfil</TableHead>
                        <TableHead>Cidade</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.profiles[0]?.name || user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {user.profiles[0]?.profile_type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.profiles[0]?.city || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.user_roles[0]?.role === 'admin' ? 'destructive' : 'secondary'}
                            >
                              {user.user_roles[0]?.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consultations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Consultas</CardTitle>
                  <CardDescription>
                    Últimas 50 consultas realizadas na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Consulta</TableHead>
                        <TableHead>Sintomas</TableHead>
                        <TableHead>Duração dos Sintomas</TableHead>
                        <TableHead>Data da Consulta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultations.map((consultation) => (
                        <TableRow key={consultation.id}>
                          <TableCell className="font-medium">
                            {consultation.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {consultation.symptoms?.join(', ') || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {consultation.symptom_duration ? `${consultation.symptom_duration} dias` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(consultation.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;