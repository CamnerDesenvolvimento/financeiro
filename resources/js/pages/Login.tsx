import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/api';
import { Button, Field } from '@/components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <form
        className="card w-full max-w-sm space-y-4 p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setErro('');
          try {
            await login(email, password);
            nav('/');
          } catch (err) {
            setErro(errorMessage(err));
          } finally {
            setLoading(false);
          }
        }}
      >
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold">Financeiro</h1>
            <p className="text-xs text-slate-500">Acesso dos sócios</p>
          </div>
        </div>
        <Field label="E-mail">
          <input type="email" className="input" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <input type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {erro && <p className="text-sm text-rose-600">{erro}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Entrar
        </Button>
      </form>
    </div>
  );
}
