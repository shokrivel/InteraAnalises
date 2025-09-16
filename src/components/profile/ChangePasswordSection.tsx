// src/components/ChangePassword.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onClose?: () => void;
};

const ChangePassword = ({ onClose }: Props) => {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Senha inválida", description: "A senha deve ter ao menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: "Confirmação incorreta", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Nota: supabase.auth.updateUser usa a sessão atual e não requer old password
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha alterada", description: "Sua senha foi atualizada com sucesso." });
      onClose?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro", description: err.message || "Não foi possível alterar a senha.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">Senha antiga (apenas para confirmação)</label>
          <Input value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} type="password" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Nova senha</label>
          <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Confirmar nova senha</label>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" />
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={handleSubmit} disabled={loading}>Salvar</Button>
          {onClose && <Button variant="outline" onClick={onClose}>Cancelar</Button>}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
