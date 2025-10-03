import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      onSuccess();
      navigate("/consultation");

      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso",
      });
    } catch (err: any) {
      setError("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Aviso",
        description: "Digite o e-mail antes de reenviar a confirmação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "E-mail reenviado com sucesso!",
        description: "Verifique sua caixa de entrada para confirmar seu cadastro. O link irá redirecioná-lo para a página inicial.",
      });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Aviso",
        description: "Digite o e-mail antes de solicitar a redefinição de senha.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      {/* Ações adicionais sempre visíveis */}
      <div className="flex flex-col space-y-2">
        <Button
          variant="outline"
          onClick={handleResendConfirmation}
          disabled={loading}
        >
          Reenviar e-mail de confirmação
        </Button>
        <Button
          variant="link"
          className="text-sm text-blue-600"
          onClick={handleForgotPassword}
          disabled={loading}
        >
          Esqueci minha senha
        </Button>
      </div>
    </div>
  );
};

export default LoginForm;
