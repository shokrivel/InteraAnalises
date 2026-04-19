import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Edit2, LogOut, User, CheckCircle2 } from 'lucide-react';
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

  if (authLoading || profileLoading) return <Spinner />;
  if (!user) return <Blocked onBack={() => navigate('/')} />;

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const handleZip = async (v: string) => {
    const fmt = v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    set('zip_code', fmt);
    if (fmt.replace(/\D/g, '').length === 8) {
      try {
        const r = await (await window.fetch(`https://viacep.com.br/ws/${fmt.replace(/\D/g, '')}/json/`)).json();
        if (!r.erro) { set('address', r.logradouro || form.address); set('city', r.localidade || form.city); toast({ title: 'CEP encontrado', description: `${r.logradouro}, ${r.localidade}` }); }
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
      toast({ title: 'Perfil atualizado!' }); setEditing(false); refetch();
    } catch (err: any) { toast({ title: 'Erro', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const cancel = () => {
    if (profile) setForm({ name: profile.name || '', birth_date: profile.birth_date || '', address: profile.address || '', city: profile.city || '', zip_code: profile.zip_code || '', profile_type: profile.profile_type || 'patient', enable_family_history: (profile as any).enable_family_history || false });
    setEditing(false);
  };

  const ptLabel = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };

  const viewRows: { label: string; value: string }[] = [
    { label: 'Nome', value: form.name || '—' },
    { label: 'Nascimento', value: form.birth_date ? new Date(form.birth_date).toLocaleDateString('pt-BR') : '—' },
    { label: 'Tipo de perfil', value: ptLabel[form.profile_type] },
    { label: 'Histórico familiar', value: form.enable_family_history ? 'Ativado' : 'Desativado' },
    { label: 'CEP', value: form.zip_code || '—' },
    { label: 'Endereço', value: form.address || '—' },
    { label: 'Cidade', value: form.city || '—' },
    { label: 'E-mail', value: user?.email || '—' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '4px 12px', borderRadius: 20 }}>{user?.email}</span>
          <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }} style={chipBtn}><LogOut size={12} /> Sair</button>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 4 }}>Meu perfil</h1>
            <p style={{ fontSize: 13, color: '#6b7280' }}>Mantenha seus dados atualizados para respostas mais precisas.</p>
          </div>
          {!editing && <button onClick={() => setEditing(true)} style={chipBtn}><Edit2 size={13} /> Editar</button>}
        </div>

        {/* Profile avatar + type */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px 22px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={22} color="#0d7a5f" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, color: '#111827', marginBottom: 4 }}>{form.name || user?.email}</p>
            <span style={{ background: '#e6f5f0', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{ptLabel[form.profile_type]}</span>
          </div>
        </div>

        {/* Form / View */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Informações pessoais</p>
            {editing && <button onClick={cancel} style={{ ...chipBtn, color: '#9ca3af' }}>Cancelar</button>}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <F label="Nome completo *">
                  <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputSt} placeholder="Seu nome" />
                </F>
                <F label="Data de nascimento *">
                  <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required style={inputSt} />
                </F>
                <F label="Tipo de perfil">
                  <Select value={form.profile_type} onValueChange={v => set('profile_type', v)}>
                    <SelectTrigger style={{ borderRadius: 8, fontSize: 13, borderColor: '#e5e7eb', height: 40 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Paciente</SelectItem>
                      <SelectItem value="academic">Acadêmico</SelectItem>
                      <SelectItem value="health_professional">Profissional de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="CEP">
                  <input value={form.zip_code} onChange={e => handleZip(e.target.value)} placeholder="00000-000" maxLength={9} style={inputSt} />
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Endereço preenchido automaticamente</p>
                </F>
                <F label="Endereço">
                  <input value={form.address} onChange={e => set('address', e.target.value)} style={inputSt} placeholder="Rua, número..." />
                </F>
                <F label="Cidade">
                  <input value={form.city} onChange={e => set('city', e.target.value)} style={inputSt} placeholder="Sua cidade" />
                </F>
              </div>

              {/* Toggle histórico familiar */}
              <div style={{ marginTop: 8, marginBottom: 24, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 2 }}>Histórico familiar</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Habilita campo de histórico familiar nas consultas</p>
                </div>
                <Switch checked={form.enable_family_history} onCheckedChange={v => set('enable_family_history', v)} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={cancel} style={{ ...btnOutline, flex: 1 }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 2, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando…' : <><Save size={14} /> Salvar alterações</>}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: '4px 0' }}>
              {viewRows.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 22px', borderBottom: '1px solid #f9fafb' }}>
                  <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13.5, color: '#111827', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Senha */}
        {editing && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', marginTop: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #f3f4f6' }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Alterar senha</p>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <ChangePasswordSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, letterSpacing: '0.3px' }}>{label}</label>
    {children}
  </div>
);
const Spinner = () => (
  <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
const Blocked = ({ onBack }: { onBack: () => void }) => (
  <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: '#6b7280', marginBottom: 16 }}>Você precisa estar logado.</p><button onClick={onBack} style={btnPrimary}>Ir para login</button></div>
  </div>
);

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' };
const chipBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', color: '#6b7280', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 20, border: '1px solid #e5e7eb', cursor: 'pointer' };
const btnPrimary: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 13.5, padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' };
const btnOutline: React.CSSProperties = { background: 'transparent', color: '#374151', fontSize: 13.5, fontWeight: 500, padding: '10px 20px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const inputSt: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };

export default Profile;
