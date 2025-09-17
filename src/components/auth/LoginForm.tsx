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
  const [unconfirmed, setUnconfirmed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnconfirmed(false);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setError(error.message);

        if (error.message.includes("Email not confirmed")) {
          setUnconfirmed(true); // ativa botão de reenviar
        }
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

  const handleResend = async () => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    if (error) {
      toast({
        title: "Erro ao reenviar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "E-mail reenviado!",
        description: `Um novo link de confirmação foi enviado para ${email}.`,
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

        {unconfirmed && (
          <div className="mt-3 text-center space-y-2">
            <p className="text-sm text-red-500">
              Sua conta ainda não foi confirmada.
            </p>
            <Button
              type="button"
              onClick={handleResend}
              className="w-full"
              variant="secondary"
            >
              Reenviar e-mail de confirmação
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
