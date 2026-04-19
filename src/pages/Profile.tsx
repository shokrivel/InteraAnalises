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

  if (authLoading || profileLoading) return <Spin />;
  if (!user) return <Gated onBack={() => navigate('/')} />;

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleZip = async (v: string) => {
    const fmt = v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    set('zip_code', fmt);
    if (fmt.replace(/\D/g, '').length === 8) {
      try {
        const r = await (await fetch(`https://viacep.com.br/ws/${fmt.replace(/\D/g, '')}/json/`)).json();
        if (!r.erro) { set('address', r.logradouro || form.address); set('city', r.localidade || form.city); toast({ title: 'CEP encontrado', description: `${r.logradouro}, ${r.localidade}` }); }
        else toast({ title: 'CEP não encontrado', variant: 'destructive' });
      } catch { toast({ title: 'Erro ao buscar CEP', variant: 'destructive' }); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!profile) { const { error } = await supabase.from('profiles').insert({ user_id: user.id, ...form }); if (error) throw error; }
      else { const { error } = await supabase.from('profiles').update({ ...form, updated_at: new Date().toISOString() }).eq('user_id', user.id); if (error) throw error; }
      toast({ title: 'Perfil atualizado com sucesso!' });
      setEditing(false); refetch();
    } catch (err: any) { toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const cancel = () => {
    if (profile) setForm({ name: profile.name || '', birth_date: profile.birth_date || '', address: profile.address || '', city: profile.city || '', zip_code: profile.zip_code || '', profile_type: profile.profile_type || 'patient', enable_family_history: (profile as any).enable_family_history || false });
    setEditing(false);
  };

  const ptLabel = { patient: 'Paciente', academic: 'Acadêmico', health_professional: 'Profissional de Saúde' };

  const rows = [
    { label: 'Nome completo', value: form.name },
    { label: 'Data de nascimento', value: form.birth_date ? new Date(form.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : undefined },
    { label: 'Tipo de perfil', value: ptLabel[form.profile_type] },
    { label: 'Histórico familiar', value: form.enable_family_history ? 'Ativado' : 'Desativado' },
    { label: 'CEP', value: form.zip_code },
    { label: 'Endereço', value: form.address },
    { label: 'Cidade', value: form.city },
    { label: 'E-mail', value: user.email },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => navigate('/dashboard')} style={backBtn}><ArrowLeft size={15} /> Voltar</button>
          <InteraAnalisesLogo size="sm" onClick={() => navigate('/')} />
        </div>
        <button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }} style={navOutBtn}>
          <LogOut size={13} /> Sair
        </button>
      </nav>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 24px 80px' }}>
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 24, color: '#111827', marginBottom: 4, letterSpacing: '-0.3px' }}>Meu Perfil</h1>
            <p style={{ fontSize: 14, color: '#6b7280' }}>{editing ? 'Edite suas informações abaixo.' : 'Visualize suas informações pessoais.'}</p>
          </div>
          {!editing && <button onClick={() => setEditing(true)} style={editBtn}><Edit2 size={14} /> Editar</button>}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0d7a5f 0%, #0a9974 100%)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {(form.name || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 17, color: '#fff' }}>{form.name || 'Sem nome'}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{user.email}</p>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <Field label="Nome completo *">
                  <input value={form.name} onChange={e => set('name', e.target.value)} required style={inp} placeholder="Seu nome" />
                </Field>
                <Field label="Data de nascimento *">
                  <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} required style={inp} />
                </Field>
                <Field label="Tipo de perfil">
                  <Select value={form.profile_type} onValueChange={v => set('profile_type', v)}>
                    <SelectTrigger style={{ ...inp, height: 42 }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Paciente</SelectItem>
                      <SelectItem value="academic">Acadêmico</SelectItem>
                      <SelectItem value="health_professional">Profissional de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="CEP">
                  <input value={form.zip_code} onChange={e => handleZip(e.target.value)} placeholder="00000-000" maxLength={9} style={inp} />
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Endereço preenchido automaticamente</p>
                </Field>
                <Field label="Endereço">
                  <input value={form.address} onChange={e => set('address', e.target.value)} style={inp} placeholder="Rua, número…" />
                </Field>
                <Field label="Cidade">
                  <input value={form.city} onChange={e => set('city', e.target.value)} style={inp} placeholder="Sua cidade" />
                </Field>
              </div>
              {/* Toggle */}
              <div style={{ marginBottom: 24, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', marginBottom: 2 }}>Histórico Familiar</p>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>Habilita campo de histórico familiar nas consultas</p>
                </div>
                <Switch checked={form.enable_family_history} onCheckedChange={v => set('enable_family_history', v)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={cancel} style={btnCancel}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...btnSave, opacity: saving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? 'Salvando…' : <><Save size={14} /> Salvar alterações</>}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 32px' }}>
                {rows.map(({ label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 14, color: value ? '#111827' : '#d1d5db', fontWeight: value ? 500 : 400 }}>{value || 'Não informado'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {editing && (
          <div style={{ marginTop: 20, background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h2 style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>Alterar senha</h2>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <ChangePasswordSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);
const Spin = () => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid #0d7a5f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>);
const Gated = ({ onBack }: { onBack: () => void }) => (<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center', padding: 40 }}><p style={{ color: '#6b7280', marginBottom: 20 }}>Você precisa estar logado.</p><button onClick={onBack} style={{ background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 14, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Ir para login</button></div></div>);

const backBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#374151', fontWeight: 500, fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' };
const navOutBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #e5e7eb', color: '#6b7280', fontWeight: 500, fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' };
const editBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 13, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' };
const btnCancel: React.CSSProperties = { background: '#f3f4f6', color: '#374151', fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', minWidth: 110 };
const btnSave: React.CSSProperties = { background: '#0d7a5f', color: '#fff', fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', flex: 1 };

export default Profile;
