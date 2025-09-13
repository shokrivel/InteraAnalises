import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ChangePasswordSection = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber,
      errors: [
        ...(!minLength ? ["Mínimo 8 caracteres"] : []),
        ...(!hasUppercase ? ["Uma letra maiúscula"] : []),
        ...(!hasLowercase ? ["Uma letra minúscula"] : []),
        ...(!hasNumber ? ["Um número"] : [])
      ]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validação das senhas
    if (formData.newPassword !== formData.confirmPassword) {
      setError("As senhas novas não coincidem");
      setLoading(false);
      return;
    }

    const validation = validatePassword(formData.newPassword);
    if (!validation.isValid) {
      setError(`A senha deve conter: ${validation.errors.join(", ")}`);
      setLoading(false);
      return;
    }

    try {
      // Primeiro, verificar a senha atual tentando fazer login
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.email) {
        setError("Erro ao verificar usuário atual");
        setLoading(false);
        return;
      }

      // Tentar autenticar com a senha atual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.user.email,
        password: formData.currentPassword
      });

      if (signInError) {
        setError("Senha atual incorreta");
        setLoading(false);
        return;
      }

      // Se chegou até aqui, a senha atual está correta, pode atualizar
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (updateError) {
        setError("Erro ao atualizar senha: " + updateError.message);
      } else {
        toast({
          title: "Senha alterada com sucesso!",
          description: "Sua senha foi atualizada",
        });
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (err) {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Alterar Senha
        </CardTitle>
        <CardDescription>
          Para sua segurança, informe sua senha atual antes de definir uma nova
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Digite sua senha atual"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Digite sua nova senha"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {formData.newPassword && !passwordValidation.isValid && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">A senha deve conter:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li className={formData.newPassword.length >= 8 ? "text-green-600" : ""}>
                    Mínimo 8 caracteres
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? "text-green-600" : ""}>
                    Uma letra maiúscula
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? "text-green-600" : ""}>
                    Uma letra minúscula
                  </li>
                  <li className={/\d/.test(formData.newPassword) ? "text-green-600" : ""}>
                    Um número
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirme sua nova senha"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-destructive">As senhas não coincidem</p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={loading || !passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
            className="w-full"
          >
            {loading ? "Alterando senha..." : "Alterar Senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordSection;