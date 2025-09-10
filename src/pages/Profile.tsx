import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Save, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    address: "",
    city: "",
    zip_code: "",
    profile_type: "patient" as "patient" | "academic" | "health_professional"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        birth_date: profile.birth_date || "",
        address: profile.address || "",
        city: profile.city || "",
        zip_code: profile.zip_code || "",
        profile_type: profile.profile_type || "patient"
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchAddressByZipCode = async (zipCode: string) => {
    const cleanZipCode = zipCode.replace(/\D/g, '');
    if (cleanZipCode.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || prev.address,
          city: data.localidade || prev.city
        }));
        
        toast({
          title: "Endereço encontrado",
          description: `${data.logradouro}, ${data.localidade}`,
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleZipCodeChange = (value: string) => {
    // Format CEP as user types
    const formatted = value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
    
    handleInputChange("zip_code", formatted);
    
    // Auto-fetch address when CEP is complete
    const cleanValue = formatted.replace(/\D/g, '');
    if (cleanValue.length === 8) {
      fetchAddressByZipCode(cleanValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          birth_date: formData.birth_date,
          address: formData.address,
          city: formData.city,
          zip_code: formData.zip_code,
          profile_type: formData.profile_type,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Erro ao atualizar perfil",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil atualizado com sucesso",
          description: "Suas informações foram salvas.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </div>
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
            <h1 className="text-xl font-bold text-foreground">Editar Perfil</h1>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {user?.email}
          </Badge>
        </div>
      </header>

      {/* Profile Form */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Mantenha suas informações atualizadas para uma melhor experiência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange("birth_date", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_type">Tipo de Perfil</Label>
                  <Select value={formData.profile_type} onValueChange={(value) => handleInputChange("profile_type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Paciente</SelectItem>
                      <SelectItem value="academic">Acadêmico</SelectItem>
                      <SelectItem value="health_professional">Profissional de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleZipCodeChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  <p className="text-xs text-muted-foreground">
                    O endereço será preenchido automaticamente
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Profile;