// src/pages/AdminPanel.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type UserRow = {
  id: string;
  user_id: string;
  name?: string;
  email?: string;
  city?: string;
  state?: string;
  role?: string;
  consultations_count?: number;
};

const AdminPanel = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Buscamos profiles e juntamos com auth.users via supabase RPC join? Podemos buscar profiles (contendo user_id)
      const { data, error } = await supabase
        .from("profiles")
        .select(`user_id, name, email, city, state, role, consultations_count`)
        .order("name", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar usuários:", err);
      toast({ title: "Erro", description: "Não foi possível carregar usuários", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      // Recomendo: usar Edge Function com service_role para segurança. Aqui usamos cliente direto.
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("user_id", userId);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Cargo atualizado." });
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      console.error("Erro ao atualizar role:", err);
      toast({ title: "Erro", description: "Falha ao atualizar cargo.", variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const rows = users
      .filter(u => filterState === "all" || u.state === filterState)
      .filter(u => !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()));
    const csv = [
      ["Nome", "Email", "Cidade", "Estado", "Cargo", "Consultas"].join(","),
      ...rows.map(r => [r.name || "", r.email || "", r.city || "", r.state || "", r.role || "", r.consultations_count || 0].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // possíveis roles
  const roles = ["user", "moderator", "admin"];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Gestão de Usuários</h1>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Buscar nome ou email..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        <Select value={filterState} onChange={(e)=>setFilterState((e.target as HTMLSelectElement).value as string)}>
          <option value="all">Todos os estados</option>
          {Array.from(new Set(users.map(u => u.state).filter(Boolean))).map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Button onClick={exportCSV}>Exportar CSV</Button>
        <Button variant="outline" onClick={fetchUsers}>Atualizar</Button>
      </div>

      <div className="space-y-3">
        {loading ? <p>Carregando...</p> : users.length === 0 ? <p>Nenhum usuário.</p> : users.map(u => (
          <div key={u.user_id} className="p-3 border rounded-md flex items-center justify-between">
            <div>
              <div className="font-semibold">{u.name || "(sem nome)"}</div>
              <div className="text-sm text-muted-foreground">{u.email}</div>
              <div className="text-sm">{u.city || "-"} • {u.state || "-"}</div>
            </div>
            <div className="flex items-center gap-2">
              <select value={u.role || "user"} onChange={(e) => updateRole(u.user_id, e.target.value)} className="border rounded p-1">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <Button variant="ghost" onClick={() => { /* abrir perfil */ window.location.href = `/profile?user=${u.user_id}` }}>Ver</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPanel;
