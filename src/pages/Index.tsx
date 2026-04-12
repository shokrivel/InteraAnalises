import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero */}
      <header className="border-b bg-white/80 backdrop-blur px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔬</span>
            <span className="text-xl font-bold text-gray-900">InteraAnalises</span>
          </div>
          <Button asChild><Link to="/login">Acessar plataforma</Link></Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🔬</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Análise Laboratorial
            <span className="text-blue-600"> Inteligente</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Entenda seus exames com inteligência artificial. Resultados claros, interpretações precisas,
            acompanhamento contínuo.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/login">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: '🤖', title: 'IA Avançada', desc: 'Interpretação dos seus exames com Google Gemini' },
            { icon: '📈', title: 'Histórico Completo', desc: 'Acompanhe sua evolução ao longo do tempo' },
            { icon: '🔒', title: 'Dados Protegidos', desc: 'Seus dados são criptografados e seguros' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t bg-white px-6 py-6 text-center text-sm text-gray-500">
        <p>© 2026 InteraAnalises — InteraSaúde. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
