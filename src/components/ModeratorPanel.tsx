// src/components/ModeratorPanel.tsx
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Check, X } from "lucide-react";

type ProfileRow = {
  id?: string;            // internal PK if present
  user_id: string;
  name?: string | null;
  city?: string | null;
  role?: string | null;         // e.g. 'admin' | 'moderator' | 'user'
  allowed_regions?: string[] | null; // optional
  email?: string | null;
};

const ModeratorPanel: React.FC = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [regionsInput, setRegionsInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      // Seleciona colunas comuns. Ajuste se seu schema for diferente.
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, city, role, allowed_regions, email");

      if (error) {
        console.error("Erro ao buscar perfis:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar perfis.",
          variant: "destructive",
        });
        return;
      }
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setModeratorRole = async (profile: ProfileRow, isModerator: boolean) => {
    try {
      setLoading(true);
      const newRole = isModerator ? "moderator" : "user";
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("user_id", profile.user_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Perfil ${profile.name || profile.user_id} atualizado para ${newRole}.`,
      });
      // Atualiza localmente
      setProfiles((prev) =>
        prev.map((p) => (p.user_id === profile.user_id ? { ...p, role: newRole } : p))
      );
    } catch (err: any) {
      console.error("Erro ao alterar role:", err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível atualizar role.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditRegions = (p: ProfileRow) => {
    setEditingUser(p.user_id);
    setRegionsInput(Array.isArray(p.allowed_regions) ? p.allowed_regions.join(", ") : "");
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setRegionsInput("");
  };

  const saveRegions = async () => {
    if (!editingUser) return;
    const regionsArray = regionsInput
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update({ allowed_regions: regionsArray })
        .eq("user_id", editingUser);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Regiões permitidas atualizadas.",
      });

      setProfiles((prev) =>
        prev.map((p) =>
          p.user_id === editingUser ? { ...p, allowed_regions: regionsArray } : p
        )
      );

      setEditingUser(null);
      setRegionsInput("");
    } catch (err: any) {
      console.error("Erro ao salvar regiões:", err);
      toast({
        title: "Erro",
        description: err.message || "Não foi possível salvar regiões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = profiles.filter((p) =>
    (p.name || p.email || p.user_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Painel do Moderador — Gestão Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 items-center">
            <Input
              placeholder="Buscar por nome, email ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={() => fetchProfiles()} disabled={loading}>
              Atualizar
            </Button>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && <p className="text-muted-foreground">Nenhum perfil encontrado.</p>}

            {filtered.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.name || "Usuário sem nome"}</span>
                    {p.email && <span className="text-xs text-muted-foreground">({p.email})</span>}
                    <Badge variant="secondary" className="ml-2">
                      {p.city || "Cidade não definida"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Role: <strong>{p.role || "user"}</strong>
                    {p.allowed_regions && p.allowed_regions.length > 0 && (
                      <span> • Regiões: {p.allowed_regions.join(", ")}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* botão atribuir/remover moderator */}
                  {p.role === "moderator" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setModeratorRole(p, false)}
                      title="Remover permissão de moderador"
                    >
                      <X className="w-4 h-4 mr-2" /> Remover
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setModeratorRole(p, true)}
                      title="Tornar moderador"
                    >
                      <Check className="w-4 h-4 mr-2" /> Tornar Moderador
                    </Button>
                  )}

                  {/* editar regiões */}
                  <Button variant="secondary" size="sm" onClick={() => openEditRegions(p)}>
                    <Pencil className="w-4 h-4 mr-2" /> Regiões
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Editor de regiões */}
          {editingUser && (
            <div className="mt-4 p-4 border rounded-md bg-muted/10">
              <h3 className="font-semibold mb-2">Editar Regiões Permitidas</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Digite as regiões (cidades/estados) separadas por vírgula. Ex: "São Paulo, Rio de Janeiro"
              </p>
              <Input
                placeholder="Digite as regiões separadas por vírgula..."
                value={regionsInput}
                onChange={(e) => setRegionsInput(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <Button onClick={saveRegions} disabled={loading}>
                  Salvar
                </Button>
                <Button variant="ghost" onClick={cancelEdit}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorPanel;
