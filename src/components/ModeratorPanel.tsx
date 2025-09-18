// src/components/ModeratorPanel.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

/**
 * Componente simples de painel do moderador.
 * Substitua/expanda conforme as suas necessidades reais.
 */

const ModeratorPanel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Painel do Moderador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Área com permissões limitadas para moderadores. Aqui você pode:
          </p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>Visualizar usuários da sua região</li>
            <li>Gerenciar flags e reports</li>
            <li>Consultar atividades recentes</li>
          </ul>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin?tab=users")}>
              Ir para Gestão de Usuários
            </Button>
            <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorPanel;
