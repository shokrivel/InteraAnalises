// src/components/ModeratorPanel.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ModeratorPanel: React.FC = () => {
  return (
    <div className="min-h-[200px]">
      <Card>
        <CardHeader>
          <CardTitle>Painel do Moderador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este é um painel temporário para moderadores. Configure permissões e
            funcionalidades no Painel de Administração.
          </p>
          <div className="mt-4">
            <Button onClick={() => alert("Funcionalidades de moderador ainda não implementadas")}>
              Ações do Moderador (teste)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorPanel;
