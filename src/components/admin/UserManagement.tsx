import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Crown, Shield, UserCheck, Lock, FileText, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  profile_type: 'patient' | 'academic' | 'health_professional';
  city: string;
  created_at: string;
  user_email?: string;
  user_role?: 'admin' | 'moderator' | 'user';
  last_consultation?: {
    id: string;
    created_at: string;
    symptoms: string[];
    ai_response: string;
    status: string;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all");
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [consultationDialogOpen, setConsultationDialogOpen] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isModerator } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users...');
      
      // Fetch profiles with user roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          profile_type,
          city,
          created_at
        `)
        .order('created_at', { ascending: false });

      console.log('📊 Profiles fetched:', profiles?.length, 'profiles');
      console.log('📋 Profile data:', profiles);

      if (profilesError) {
        console.error('❌ Profile fetch error:', profilesError);
        throw profilesError;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('👥 Roles fetched:', roles?.length, 'roles');
      console.log('🎭 Roles data:', roles);

      if (rolesError) {
        console.error('❌ Roles fetch error:', rolesError);
        throw rolesError;
      }

      // Create a map of user roles
      const roleMap = new Map((roles || []).map((role: any) => [role.user_id, role.role]));
      console.log('🗺️ Role map created:', roleMap);

      // Fetch user emails via edge function
      const userIds = ((profiles as any[]) || []).map((p: any) => p.user_id);
      let emailMap = new Map<string, string>();

      if (userIds.length > 0) {
        console.log('📧 Fetching emails for', userIds.length, 'users');
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('get-users-emails', {
            body: { userIds }
          });

          console.log('📬 Email data received:', emailData);
          console.log('❌ Email error:', emailError);

          if (!emailError && emailData?.userEmails) {
            emailMap = new Map(Object.entries(emailData.userEmails));
            console.log('✅ Email map created:', emailMap);
          }
        } catch (emailFetchError) {
          console.error('❌ Error fetching emails:', emailFetchError);
          // Continue without emails rather than failing entirely
        }
      }

      // Fetch last consultation for each user
      const { data: consultations, error: consultationsError } = await supabase
        .from('consultation_history')
        .select('id, user_id, created_at, symptoms, ai_response, status')
        .order('created_at', { ascending: false });

      if (consultationsError) {
        console.error('❌ Consultations fetch error:', consultationsError);
      }

      // Create a map of last consultations per user
      const consultationMap = new Map();
      (consultations || []).forEach((consultation: any) => {
        if (!consultationMap.has(consultation.user_id)) {
          consultationMap.set(consultation.user_id, consultation);
        }
      });

      // Combine all data
      const usersWithRoles = ((profiles as any[]) || []).map((profile: any) => ({
        ...profile,
        user_role: roleMap.get(profile.user_id) || 'user',
        user_email: emailMap.get(profile.user_id) || 'Email não disponível',
        last_consultation: consultationMap.get(profile.user_id),
      }));

      console.log('✨ Final users with roles:', usersWithRoles);
      setUsers(usersWithRoles);
      console.log('✅ Users state updated, total:', usersWithRoles.length);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      // Check if user already has a role
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id, role')
        .eq('user_id', userId as any)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: newRole } as any)
          .eq('user_id', userId as any);

        if (updateError) throw updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: newRole 
          } as any);

        if (insertError) throw insertError;
      }

      // Update local state
      setUsers(users.map(user => 
        user.user_id === userId 
          ? { ...user, user_role: newRole }
          : user
      ));

      toast({
        title: "Sucesso",
        description: "Papel do usuário atualizado com sucesso",
      });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o papel do usuário",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.user_role === roleFilter;
    const matchesProfileType = profileTypeFilter === "all" || user.profile_type === profileTypeFilter;
    
    return matchesSearch && matchesRole && matchesProfileType;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'moderator': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getProfileTypeLabel = (type: string) => {
    switch (type) {
      case 'patient': return 'Paciente';
      case 'academic': return 'Acadêmico';
      case 'health_professional': return 'Profissional de Saúde';
      default: return type;
    }
  };

  const viewConsultation = (consultation: any) => {
    setSelectedConsultation(consultation);
    setConsultationDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Gestão de Usuários
          {isModerator && !isAdmin && (
            <Badge variant="secondary" className="ml-2">
              <Lock className="w-3 h-3 mr-1" />
              Acesso Limitado
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? "Visualize e gerencie os usuários do sistema" 
            : "Visualize os usuários do sistema (acesso limitado)"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="moderator">Moderador</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
            </SelectContent>
          </Select>
          <Select value={profileTypeFilter} onValueChange={setProfileTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="patient">Paciente</SelectItem>
              <SelectItem value="academic">Acadêmico</SelectItem>
              <SelectItem value="health_professional">Profissional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo de Perfil</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Última Consulta</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {searchTerm || roleFilter !== "all" || profileTypeFilter !== "all" 
                        ? "Nenhum usuário encontrado com os filtros aplicados"
                        : "Nenhum usuário encontrado"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getProfileTypeLabel(user.profile_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.city}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.user_role || 'user')} className="flex items-center gap-1 w-fit">
                          {getRoleIcon(user.user_role || 'user')}
                          {user.user_role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.last_consultation ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(user.last_consultation.created_at)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewConsultation(user.last_consultation)}
                              className="gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              Ver Consulta
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhuma consulta</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Select 
                            value={user.user_role || 'user'} 
                            onValueChange={(value) => updateUserRole(user.user_id, value as any)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="moderator">Moderador</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs">Sem permissão</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Mostrando {filteredUsers.length} de {users.length} usuários
          </p>
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            Atualizar
          </Button>
        </div>
      </CardContent>

      {/* Consultation Dialog */}
      <Dialog open={consultationDialogOpen} onOpenChange={setConsultationDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes da Consulta
            </DialogTitle>
            <DialogDescription>
              Consulta realizada em {selectedConsultation && formatDate(selectedConsultation.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsultation && (
            <div className="space-y-4">
              {/* Symptoms */}
              {selectedConsultation.symptoms && selectedConsultation.symptoms.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Sintomas Relatados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedConsultation.symptoms.map((symptom: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h4 className="font-semibold mb-2">Status:</h4>
                <Badge variant={selectedConsultation.status === 'finalizada' ? 'default' : 'secondary'}>
                  {selectedConsultation.status}
                </Badge>
              </div>

              {/* AI Response */}
              {selectedConsultation.ai_response && (
                <div>
                  <h4 className="font-semibold mb-2">Resposta da IA:</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedConsultation.ai_response}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setConsultationDialogOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserManagement;