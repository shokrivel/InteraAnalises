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
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("Tentando fazer login com:", email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Resposta do login:", { data, error });

      if (error) {
        console.error("Erro de login:", error);
        setError(error.message);
      } else {
        console.log("Login bem-sucedido, dados:", data);
        toast({
          title: "Login realizado com sucesso!",
          description: "Conectando seu perfil...",
        });

        // Garante sessão ativa e conecta o perfil antes de navegar
        try {
          const sessionRes = await supabase.auth.getSession();
          console.log('Sessão após login:', { hasSession: !!sessionRes.data.session });

          const userId = data.user?.id;
          if (userId) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle();
            console.log('Perfil carregado após login:', { profile, profileError });
          }
        } catch (pErr) {
          console.warn('Aviso ao conectar perfil após login:', pErr);
        }

        onSuccess();
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Por favor, insira seu e-mail antes de solicitar a redefinição de senha.");
      return;
    }

    setResetLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
      });

      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      }
    } catch (err) {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
      
      <div className="text-center">
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={resetLoading}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {resetLoading ? "Enviando..." : "Esqueci minha senha"}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;