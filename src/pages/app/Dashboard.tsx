import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔬</span>
          <h1 className="text-xl font-bold">InteraAnalises</h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            <Link to="/app" className="font-medium text-primary">Dashboard</Link>
            <Link to="/app/results" className="text-muted-foreground hover:text-primary">Resultados</Link>
            <Link to="/app/history" className="text-muted-foreground hover:text-primary">Histórico</Link>
            <Link to="/app/profile" className="text-muted-foreground hover:text-primary">Perfil</Link>
          </nav>
          <Button variant="outline" size="sm" onClick={signOut}>Sair</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Bem-vindo, {user?.email?.split('@')[0]}!</h2>
          <p className="text-muted-foreground mt-1">Plataforma de análise laboratorial inteligente</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">🧪 Enviar Exames</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Envie seus resultados para análise com IA</p>
              <Button asChild size="sm"><Link to="/app/results">Ver Resultados</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">📄 Histórico</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Acompanhe sua evolução ao longo do tempo</p>
              <Button asChild size="sm" variant="outline"><Link to="/app/history">Ver Histórico</Link></Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">👤 Meu Perfil</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Atualize seus dados e preferências</p>
              <Button asChild size="sm" variant="outline"><Link to="/app/profile">Editar Perfil</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
