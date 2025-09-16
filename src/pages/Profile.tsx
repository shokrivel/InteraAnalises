import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import EditProfile from "@/pages/EditProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err: any) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu perfil.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  if (loading) {
    return <p>Carregando perfil...</p>;
  }

  if (!profile) {
    return <p>Perfil não encontrado.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Meu Perfil</h2>

      {!editing ? (
        <div className="space-y-4">
          <p><strong>Nome:</strong> {profile.full_name || "Não informado"}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Telefone:</strong> {profile.phone || "Não informado"}</p>
          <p><strong>CEP:</strong> {profile.cep || "Não informado"}</p>
          <p><strong>Endereço:</strong> {profile.address || "Não informado"}</p>
          <p><strong>Cidade:</strong> {profile.city || "Não informado"}</p>
          <p><strong>Estado:</strong> {profile.state || "Não informado"}</p>
          <p><strong>Tipo de Perfil:</strong> {profile.role || "Paciente"}</p>

          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Editar Perfil
          </button>
        </div>
      ) : (
        <EditProfile profile={profile} onClose={() => setEditing(false)} />
      )}
    </div>
  );
};

export default Profile;
