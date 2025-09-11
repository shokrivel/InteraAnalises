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

    console.log("🔄 INICIANDO LOGIN para:", email);

    try {
      console.log("📡 Chamando Supabase...");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("📥 RESPOSTA:", { 
        temData: !!data, 
        temUser: !!data?.user, 
        temError: !!error,
        erro: error?.message 
      });

      if (error) {
        console.error("❌ ERRO:", error.message);
        setError(error.message);
        return;
      }

      if (!data?.user) {
        console.error("❌ SEM USUÁRIO");
        setError("Falha na autenticação");
        return;
      }

      console.log("✅ LOGIN SUCESSO! Email:", data.user.email);
      
      // Limpar erro e fechar modal
      setError("");
      onSuccess();
      
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      });

      console.log("🎯 Modal fechado, usuário logado");

    } catch (err: any) {
      console.error("💥 ERRO FATAL:", err);
      setError("Erro fatal: " + (err.message || "Tente novamente"));
    } finally {
      setLoading(false);
      console.log("🏁 Login process finished");
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