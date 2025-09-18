// src/pages/ModeratorPanel.tsx
import React from "react";
import { withRole } from "@/lib/withRole";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ModeratorPanelComponent = () => {
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => {
    // exemplo: buscar consultas pendentes de revisão ou flags
    const fetch = async () => {
      const { data } = await supabase.from("flags").select("*").order("created_at", { ascending: false }).limit(50);
      setReports(data || []);
    };
    fetch();
  }, []);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Painel do Moderador</h1>
      <Card>
        <CardHeader><CardTitle>Itens pendentes (exemplo)</CardTitle></CardHeader>
        <CardContent>
          {reports.length === 0 ? <p>Nenhum item pendente.</p> : (
            <ul>
              {reports.map(r => <li key={r.id}>{r.note || JSON.stringify(r)}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default withRole(ModeratorPanelComponent, ["moderator", "admin"]);
