import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SignupFormProps {
  onSuccess: () => void;
}

const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    city: "",
    address: "",
    zipCode: "",
    profileType: "patient" as "patient" | "academic" | "health_professional"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchAddressByZipCode = async (zipCode: string) => {
    // Remove caracteres não numéricos
    const cleanZipCode = zipCode.replace(/\D/g, '');
    
    if (cleanZipCode.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            city: data.localidade,
            address: `${data.logradouro}, ${data.bairro}`
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      console.log('🔵 Iniciando cadastro para:', formData.email);
      
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: "https://interasaude.com.br",
          data: {
            name: formData.name,
            birth_date: formData.birthDate,
            city: formData.city,
            address: formData.address,
            zip_code: formData.zipCode,
            profile_type: formData.profileType
          }
        }
      });

      console.log('📧 Resposta do signUp:', { 
        error: signUpError, 
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        confirmationSent: data?.user?.confirmation_sent_at
      });

      if (signUpError) {
        console.error('❌ Erro no signUp:', signUpError);
        setError(signUpError.message);
      } else if (data.user) {
        console.log('✅ Usuário criado com sucesso:', data.user.id);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            name: formData.name,
            birth_date: formData.birthDate,
            city: formData.city,
            address: formData.address,
            zip_code: formData.zipCode,
            profile_type: formData.profileType
          });

        if (profileError) {
          console.error('❌ Erro ao criar perfil:', profileError);
        } else {
          console.log('✅ Perfil criado com sucesso');
        }

        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu e-mail para confirmar seu cadastro. O link de confirmação irá redirecioná-lo para a página inicial.",
        });
        onSuccess();
      }
    } catch (err) {
      console.error('❌ Erro inesperado no cadastro:', err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Seu nome completo"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email-signup">E-mail *</Label>
        <Input
          id="email-signup"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          placeholder="seu@email.com"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password-signup">Senha *</Label>
          <Input
            id="password-signup"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar Senha *</Label>
          <Input
            id="confirm-password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="birth-date">Data de Nascimento *</Label>
        <Input
          id="birth-date"
          type="date"
          value={formData.birthDate}
          onChange={(e) => handleInputChange("birthDate", e.target.value)}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zip-code">CEP *</Label>
          <Input
            id="zip-code"
            value={formData.zipCode}
            onChange={(e) => {
              const value = e.target.value;
              handleInputChange("zipCode", value);
              fetchAddressByZipCode(value);
            }}
            placeholder="00000-000"
            maxLength={9}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="Sua cidade"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Endereço *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange("address", e.target.value)}
          placeholder="Rua, número, bairro"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="profile-type">Perfil *</Label>
        <Select value={formData.profileType} onValueChange={(value) => handleInputChange("profileType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione seu perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="patient">Paciente</SelectItem>
            <SelectItem value="academic">Acadêmico</SelectItem>
            <SelectItem value="health_professional">Profissional da Saúde</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando conta..." : "Criar Conta"}
      </Button>
    </form>
  );
};

export default SignupForm;