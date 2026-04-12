import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-lg text-gray-600">Página não encontrada</p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
