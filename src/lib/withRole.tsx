// src/lib/withRole.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function withRole<P>(Component: React.ComponentType<P>, allowedRoles: string[]) {
  return function WithRoleWrapper(props: P) {
    const { user } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let mounted = true;
      const fetchRole = async () => {
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (!mounted) return;
        if (error) {
          console.error("withRole fetch error:", error);
          setRole(null);
          setLoading(false);
          return;
        }
        setRole(data?.role || "user");
        setLoading(false);
      };
      fetchRole();
      return () => { mounted = false; };
    }, [user]);

    if (loading) return <div>Carregando permissões...</div>;
    if (!role || !allowedRoles.includes(role)) return <div>Acesso negado.</div>;
    return <Component {...props} />;
  }
}
