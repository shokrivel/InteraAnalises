// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import EditProfile from "@/pages/EditProfile"; // assume file path
import ChangePassword from "@/components/ChangePassword";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, loading } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      // redirect handled elsewhere
    }
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="font-medium">{user?.id}</div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setShowEdit(true)}>Editar Perfil</Button>
                <Button variant="outline" onClick={() => setShowChangePassword(true)}>Alterar Senha</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl">
              <EditProfile onClose={() => setShowEdit(false)} />
            </div>
          </div>
        )}

        {/* Change password modal */}
        {showChangePassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg">
              <ChangePassword onClose={() => setShowChangePassword(false)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
