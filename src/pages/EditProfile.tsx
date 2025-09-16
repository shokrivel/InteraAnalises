import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const EditProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [password, setPassword] = useState("");

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await supabase.auth.updateUser({
      data: { name },
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Perfil atualizado com sucesso!" });
    }
  };

  const handleChangePassword = async () => {
    if (!password) {
      toast({ title: "Erro", description: "Digite uma nova senha.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Senha alterada com sucesso!" });
      setPassword("");
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Atualizar nome */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button
        onClick={handleUpdateProfile}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Atualizar Perfil
      </button>

      {/* Alterar senha */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nova senha</label>
        <input
          type="password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        onClick={handleChangePassword}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Alterar Senha
      </button>
    </div>
  );
};

export default EditProfile;
