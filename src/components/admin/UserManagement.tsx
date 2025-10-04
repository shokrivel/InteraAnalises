import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Crown, Shield, UserCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  profile_type: 'patient' | 'academic' | 'health_professional';
  city: string;
  created_at: string;
  user_email?: string;
  user_role?: 'admin' | 'moderator' | 'user';
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const { isAdmin, isModerator } = useRole();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
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

      if (profilesError) {
        throw profilesError;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Create a map of user roles
      const roleMap = new Map(roles?.map(role => [role.user_id, role.role]) || []);

      // Fetch user emails via edge function
      const userIds = profiles?.map(p => p.user_id) || [];
      let emailMap = new Map<string, string>();

      if (userIds.length > 0) {
        try {
          const { data: emailData, error: emailError } = await supabase.functions.invoke('get-users-emails', {
            body: { userIds }
          });

          if (!emailError && emailData?.userEmails) {
            emailMap = new Map(Object.entries(emailData.userEmails));
          }
        } catch (emailFetchError) {
          console.error('Error fetching emails:', emailFetchError);
          // Continue without emails rather than failing entirely
        }
      }

      // Combine all data
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_role: roleMap.get(profile.user_id) || 'user',
        user_email: emailMap.get(profile.user_id) || 'Email não disponível',
      })) || [];

      setUsers(usersWithRoles);
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
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRole) {
        // Update existing role
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // Insert new role
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: newRole 
          });

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
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
    </Card>
  );
};

export default UserManagement;