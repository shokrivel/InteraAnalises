import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit, User, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChangePasswordSection from "@/components/profile/ChangePasswordSection";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "", birth_date: "", address: "", city: "", zip_code: "",
    profile_type: "patient" as "patient" | "academic" | "health_professional",
    enable_family_history: false,
  });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) setFormData({
      name: profile.name || "", birth_date: profile.birth_date || "",
      address: profile.address || "", city: profile.city || "",
      zip_code: profile.zip_code || "", profile_type: profile.profile_type || "patient",
      enable_family_history: (profile as any).enable_family_history || false,
    });
  }, [profile]);

  if (authLoading || profileLoading) return <Spinner />;
  if (!user) return <Blocked onBack={() => navigate("/")} />;

  const set = (field: string, value: string | boolean) => setFormData(p => ({ ...p, [field]: value }));

  const handleZipCode = async (v: string) => {
    const fmt = v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    set("zip_code", fmt);
    if (fmt.replace(/\D/g, '').length === 8) {
      try {
        const r = await (await fetch(`https://viacep.com.br/ws/${fmt.replace(/\D/g, '')}/json/`)).json();
        if (!r.erro) {
          set("address", r.logradouro || formData.address);
          set("city", r.localidade || formData.city);
          toast({ title: "CEP encontrado", description: `${r.logradouro}, ${r.localidade}` });
        } else toast({ title: "CEP não encontrado", variant: "destructive" });
      } catch { toast({ title: "Erro ao buscar CEP", variant: "destructive" }); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (!profile) {
        const { error } = await supabase.from('profiles').insert({ user_id: user.id, ...formData });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('profiles').update({ ...formData, updated_at: new Date().toISOString() }).eq('user_id', user.id);
        if (error) throw error;
      }
      toast({ title: "Perfil atualizado com sucesso", description: "Suas informações foram salvas." });
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast({ title: "Erro ao atualizar perfil", description: error.message || "Tente novamente", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleCancel = () => {
    if (profile) setFormData({ name: profile.name || "", birth_date: profile.birth_date || "", address: profile.address || "", city: profile.city || "", zip_code: profile.zip_code || "", profile_type: profile.profile_type || "patient", enable_family_history: (profile as any).enable_family_history || false });
    setIsEditing(false);
  };

  const profileTypeLabel = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(245,240,232,.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(200,168,75,.3)', padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate("/dashboard")} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.2rem', color: '#0f4a2e', cursor: 'pointer', letterSpacing: '-0.5px' }} onClick={() => navigate('/')}>Intera<span style={{ color: '#c8a84b' }}>Análises</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#e8f5ee', color: '#1a7a4a', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 2 }}>{user?.email}</span>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }} style={ghostBtn}><LogOut size={14} /> Sair</button>
        </div>
      </header>

      {/* HERO STRIP */}
      <div style={{ background: '#0f4a2e', padding: '40px 60px 36px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.68rem', letterSpacing: 3, textTransform: 'uppercase', color: '#c8a84b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 24, height: 1, background: '#c8a84b', display: 'inline-block' }} /> Meu Perfil</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 900, color: '#fafaf8', lineHeight: 1.1 }}>Informações <em style={{ fontStyle: 'italic', color: '#e8c96a' }}>pessoais</em></h1>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Profile Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 28px', borderBottom: '1px solid rgba(200,168,75,.15)' }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.3rem', color: '#1c1c1c', marginBottom: 4 }}>Informações Pessoais</h2>
              <p style={{ fontSize: '0.85rem', color: '#3d3d3d' }}>{isEditing ? 'Mantenha suas informações atualizadas' : 'Visualize seus dados'}</p>
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} style={ghostBtn}><Edit size={14} /> Editar</button>
            )}
          </div>

          <div style={{ padding: '28px' }}>
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <Field label="Nome Completo *">
                    <input value={formData.name} onChange={e => set("name", e.target.value)} required style={inputStyle} placeholder="Seu nome completo" />
                  </Field>
                  <Field label="Data de Nascimento *">
                    <input type="date" value={formData.birth_date} onChange={e => set("birth_date", e.target.value)} required style={inputStyle} />
                  </Field>
                  <Field label="Tipo de Perfil">
                    <Select value={formData.profile_type} onValueChange={v => set("profile_type", v)}>
                      <SelectTrigger style={{ borderRadius: 2, borderColor: 'rgba(200,168,75,.3)' }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Paciente</SelectItem>
                        <SelectItem value="academic">Acadêmico</SelectItem>
                        <SelectItem value="health_professional">Profissional de Saúde</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="CEP">
                    <input value={formData.zip_code} onChange={e => handleZipCode(e.target.value)} placeholder="00000-000" maxLength={9} style={inputStyle} />
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Endereço preenchido automaticamente</p>
                  </Field>
                  <Field label="Endereço">
                    <input value={formData.address} onChange={e => set("address", e.target.value)} style={inputStyle} placeholder="Rua, número..." />
                  </Field>
                  <Field label="Cidade">
                    <input value={formData.city} onChange={e => set("city", e.target.value)} style={inputStyle} placeholder="Sua cidade" />
                  </Field>
                </div>

                {/* Family history toggle */}
                <div style={{ marginTop: 4, marginBottom: 28, background: '#e8f5ee', border: '1px solid rgba(26,122,74,.2)', borderRadius: 4, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1c1c1c', marginBottom: 4 }}>Histórico Familiar</p>
                    <p style={{ fontSize: '0.8rem', color: '#3d3d3d' }}>Habilita o campo de histórico familiar durante consultas</p>
                  </div>
                  <Switch id="family" checked={formData.enable_family_history} onCheckedChange={v => set("enable_family_history", v)} />
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={handleCancel} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {saving ? 'Salvando…' : <><Save size={15} /> Salvar Alterações</>}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 40px' }}>
                {[
                  { label: 'Nome Completo', value: formData.name },
                  { label: 'Data de Nascimento', value: formData.birth_date ? new Date(formData.birth_date).toLocaleDateString('pt-BR') : undefined },
                  { label: 'Tipo de Perfil', value: profileTypeLabel[formData.profile_type] },
                  { label: 'Histórico Familiar', value: formData.enable_family_history ? 'Ativado' : 'Desativado' },
                  { label: 'CEP', value: formData.zip_code },
                  { label: 'Endereço', value: formData.address },
                  { label: 'Cidade', value: formData.city },
                  { label: 'E-mail', value: user?.email },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>{label}</p>
                    <p style={{ fontSize: '0.92rem', color: '#1c1c1c' }}>{value || 'Não informado'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change password */}
        {isEditing && (
          <div style={{ marginTop: 24 }}>
            <div style={cardStyle}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(200,168,75,.15)' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.15rem', color: '#1c1c1c' }}>Alterar Senha</h2>
              </div>
              <div style={{ padding: '24px 28px' }}>
                <ChangePasswordSection />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 }}>{label}</label>
    {children}
  </div>
);
const Spinner = () => (
  <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 36, height: 36, border: '3px solid #1a7a4a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
  </div>
);
const Blocked = ({ onBack }: { onBack: () => void }) => (
  <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: '#3d3d3d', marginBottom: 20 }}>Você precisa estar logado.</p><button onClick={onBack} style={btnPrimary}>Ir para Login</button></div>
  </div>
);

// ── Styles ───────────────────────────────────────────────────────────
const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(200,168,75,.4)', color: '#0f4a2e', fontWeight: 700, fontSize: '0.72rem', letterSpacing: 1, textTransform: 'uppercase', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' };
const ghostBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(200,168,75,.4)', color: '#0f4a2e', fontWeight: 600, fontSize: '0.78rem', padding: '7px 14px', borderRadius: 2, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0f4a2e', color: '#fafaf8', fontWeight: 700, fontSize: '0.82rem', letterSpacing: 1, textTransform: 'uppercase', padding: '13px 24px', borderRadius: 2, border: 'none', cursor: 'pointer' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#0f4a2e', border: '2px solid #0f4a2e', fontWeight: 700, fontSize: '0.82rem', letterSpacing: 1, textTransform: 'uppercase', padding: '11px 22px', borderRadius: 2, cursor: 'pointer' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', border: '1px solid rgba(200,168,75,.3)', borderRadius: 2, background: '#fafaf8', fontSize: '0.9rem', color: '#1c1c1c', fontFamily: "'DM Sans', sans-serif", outline: 'none' };
const cardStyle: React.CSSProperties = { background: '#fafaf8', borderRadius: 4, borderTop: '3px solid #c8a84b', border: '1px solid rgba(200,168,75,.2)' };

export default Profile;
