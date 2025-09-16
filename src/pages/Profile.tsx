import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import EditProfile from "@/pages/EditProfile";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return <p className="text-center mt-6">Você precisa estar logado para ver o perfil.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <p><strong>Nome:</strong> {user.user_metadata?.name || "Não informado"}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        {/* Somente botão para editar perfil */}
        <EditProfile />
      </div>
    </div>
  );
};

export default Profile;
