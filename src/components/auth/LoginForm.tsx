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

  console.log("🎬 LoginForm renderizado - Email:", email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 FORMULÁRIO SUBMETIDO! Email:", email, "Password length:", password.length);
    
    setLoading(true);
    setError("");

    try {
      console.log("📡 Chamando Supabase auth...");
      
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log("📥 RESULTADO COMPLETO:", result);

      if (result.error) {
        console.error("❌ ERRO SUPABASE:", result.error);
        setError(result.error.message);
        return;
      }

      if (!result.data?.user) {
        console.error("❌ SEM USUÁRIO NO RESULTADO");
        setError("Login falhou - sem usuário");
        return;
      }

      console.log("✅ LOGIN SUCESSO!");
      console.log("👤 Usuário:", result.data.user.email);
      
      onSuccess();
      
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso",
      });

    } catch (err: any) {
      console.error("💥 ERRO EXCEPTION:", err);
      setError("Erro: " + err.message);
    } finally {
      setLoading(false);
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
            onChange={(e) => {
              console.log("📝 Email mudou:", e.target.value);
              setEmail(e.target.value);
            }}
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
            onChange={(e) => {
              console.log("🔐 Password mudou, length:", e.target.value.length);
              setPassword(e.target.value);
            }}
            placeholder="••••••••"
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
          onClick={() => console.log("🔘 BOTÃO CLICADO!")}
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;