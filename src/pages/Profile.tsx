// src/pages/Profile.tsx
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EditProfile from "@/pages/EditProfile"; // edição de perfil
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  if (!user) {
    return <p>Carregando informações do perfil...</p>;
  }

  return (
    <div className="p-6">
      {!editing ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Perfil</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Nome:</strong> {user.user_metadata?.full_name || "Não informado"}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Editar Perfil
          </button>
        </div>
      ) : (
        <EditProfile onClose={() => setEditing(false)} />
      )}
    </div>
  );
};

export default Profile;
