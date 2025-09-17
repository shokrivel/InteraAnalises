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
  const [resendMessage, setResendMessage] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

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

  const handleResend = async () => {
    setResendMessage({ type: null, text: "" });

    if (!email.trim()) {
      setResendMessage({
        type: "error",
        text: "Preencha o campo de e-mail antes de reenviar a confirmação.",
      });
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    if (error) {
      setResendMessage({ type: "error", text: error.message });
    } else {
      setResendMessage({
        type: "success",
        text: `Um novo link de confirmação foi enviado para ${email}.`,
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

        <Button
          type="button"
          onClick={handleResend}
          className="w-full"
          variant="secondary"
        >
          Reenviar e-mail de confirmação
        </Button>

        {resendMessage.type && (
          <p
            className={`text-sm mt-2 ${
              resendMessage.type === "success"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {resendMessage.text}
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
