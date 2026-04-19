import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { InteraAnalisesLogo } from '@/components/InteraAnalisesLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChangePasswordSection from '@/components/profile/ChangePasswordSection';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', birth_date: '', address: '', city: '', zip_code: '', profile_type: 'patient' as 'patient' | 'academic' | 'health_professional', enable_family_history: false });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile) setForm({ name: profile.name || '', birth_date: profile.birth_date || '', address: profile.address || '', city: profile.city || '', zip_code: profile.zip_code || '', profile_type: profile.profile_type || 'patient', enable_family_history: (profile as any).enable_family_history || false });
  }, [profile]);

  if (authLoading || profileLoading) return <Loader />;
  if (!user) return <Blocked onLogin={() => navigate('/')} />;

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleZip = async (v: string) => {
    const fmt = v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    set('zip_code', fmt);
    if (fmt.replace(/\D/g, '').length === 8) {
      try {
        const r = await (await fetch(`https://viacep.com.br/ws/${fmt.replace(/\D/g, '')}/json/`)).json();
        if (!r.erro) { set('address', r.logradouro || form.address); set('city', r.localidade || form.city); toast({ title: 'Endereço encontrado' }); }
        else toast({ title: 'CEP não encontrado', variant: 'destructive' });
      } catch { toast({ title: 'Erro ao buscar CEP', variant: 'destructive' }); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      if (!profile) { const { error } = await supabase.from('profiles').insert({ user_id: user.id, ...form }); if (error) throw error; }
      else { const { error } = await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('user_id', user.id); if (error) throw error; }
      toast({ title: 'Perfil salvo com sucesso!' });
      setEditing(false);
      refetch();
    } catch (err: any) { toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const cancelEdit = () => {
    if (profile) setForm({ name: profile.name || '', birth_date: profile.birth_date || '', address: profile.address || '', city: profile.city || '', zip_code: profile.zip_code || '', profile_type: profile.profile_type || 'patient', enable_family_history: (profile as any).enable_family_history || false });
    setEditing(false);
  };

  const ptLabel = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={16} /></button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>{user?.email}</span>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }} style={ghostBtn}><LogOut size={13} /> Sair</button>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>
        <h1 style={{ fontWeight: 700, fontSize: 22, color: '#111827', marginBottom: 6, letterSpacing: '-0.3px' }}>Meu Perfil</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Mantenha suas informações atualizadas para uma experiência personalizada.</p>

        {/* Profile Card */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <h2 style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 2 }}>Informações Pessoais</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>{editing ? 'Edite seus dados abaixo' : 'Seus dados cadastrais'}</p>
            </div>
            {!editing && <button onClick={() => setEditing(true)} style={editBtn}><Edit2 size={13} /> Editar</button>}
          </div>

          <div style={{ padding: '24px' }}>
            {editing ? (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                  <FieldWrap label="Nome completo *"><input value={form.name} onChange={e => set('name', e.target.value)} required style={input} placeholder="Seu nome completo" /></FieldWrap>
                  <FieldWrap label="Data de nascimento *"><input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required style={input} /></FieldWrap>
                  <FieldWrap label="Tipo de perfil">
                    <Select value={form.profile_type} onValueChange={v => set('profile_type', v)}>
                      <SelectTrigger style={{ borderRadius: 8, border: '1.5px solid #e5e7eb', fontFamily: "'Inter',sans-serif" }}><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="patient">Paciente</SelectItem><SelectItem value="academic">Acadêmico</SelectItem><SelectItem value="health_professional">Profissional de Saúde</SelectItem></SelectContent>
                    </Select>
                  </FieldWrap>
                  <FieldWrap label="CEP">
                    <input value={form.zip_code} onChange={e => handleZip(e.target.value)} placeholder="00000-000" maxLength={9} style={input} />
                    <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 3, display: 'block' }}>Endereço preenchido automaticamente</span>
                  </FieldWrap>
                  <FieldWrap label="Endereço"><input value={form.address} onChange={e => set('address', e.target.value)} style={input} placeholder="Rua, número…" /></FieldWrap>
                  <FieldWrap label="Cidade"><input value={form.city} onChange={e => set('city', e.target.value)} style={input} placeholder="Sua cidade" /></FieldWrap>
                </div>

                {/* Toggle */}
                <div style={{ marginBottom: 24, background: '#f0fdf4', border: '1px solid #d1fae5', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 14, color: '#111827', marginBottom: 2 }}>Histórico Familiar</p>
                    <p style={{ fontSize: 12, color: '#6b7280' }}>Ativa campo de histórico familiar nas consultas</p>
                  </div>
                  <Switch checked={form.enable_family_history} onCheckedChange={v => set('enable_family_history', v)} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={cancelEdit} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    {saving ? 'Salvando…' : <><Save size={14} /> Salvar alterações</>}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 32px' }}>
                {[
                  { label: 'Nome', value: form.name },
                  { label: 'Data de nascimento', value: form.birth_date ? new Date(form.birth_date).toLocaleDateString('pt-BR') : undefined },
                  { label: 'Tipo de perfil', value: ptLabel[form.profile_type] },
                  { label: 'Histórico familiar', value: form.enable_family_history ? '✓ Ativado' : '✗ Desativado' },
                  { label: 'CEP', value: form.zip_code },
                  { label: 'Endereço', value: form.address },
                  { label: 'Cidade', value: form.city },
                  { label: 'E-mail', value: user?.email },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 14, color: value ? '#111827' : '#d1d5db' }}>{value || 'Não informado'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        {editing && (
          <div style={{ ...card, marginTop: 16 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ fontWeight: 600, fontSize: 16, color: '#111827', marginBottom: 2 }}>Alterar Senha</h2>
              <p style={{ fontSize: 13, color: '#9ca3af' }}>Escolha uma senha segura</p>
            </div>
            <div style={{ padding: '24px' }}><ChangePasswordSection /></div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components
const FieldWrap = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);
const Loader = () => <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 28, height: 28, border: '2.5px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
const Blocked = ({ onLogin }: { onLogin: () => void }) => <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}><p style={{ color: '#6b7280', marginBottom: 16 }}>Você precisa estar logado.</p><button onClick={onLogin} style={btnPrimary}>Ir para login</button></div>;

// Styles
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const backBtn: React.CSSProperties = { background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#374151' };
const ghostBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const editBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 18px', fontWeight: 500, fontSize: 14, cursor: 'pointer' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 14, fontFamily: "'Inter',sans-serif", color: '#111827', outline: 'none', background: '#fff', boxSizing: 'border-box' };

export default Profile;
