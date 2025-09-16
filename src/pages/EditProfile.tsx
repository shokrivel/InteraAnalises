// src/pages/EditProfile.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Props = {
  onClose: () => void;
};

const EditProfile = ({ onClose }: Props) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase.from("profiles").select("name, city, address").eq("user_id", user.id).single();
      if (data) {
        setName(data.name || "");
        setCity(data.city || "");
        setAddress(data.address || "");
      }
    };
    loadProfile();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates = {
        user_id: user.id,
        name,
        city,
        address,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      toast({ title: "Perfil atualizado", description: "Dados atualizados com sucesso." });
      onClose();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro", description: err.message || "Não foi possível atualizar." , variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Editar Perfil</h3>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-muted-foreground">Nome</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Endereço (rua, nº)</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">Cidade</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={save} disabled={loading}>Salvar</Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
