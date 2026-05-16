/**
 * Login page at /login — completely outside the /admin layout guard.
 * Admin panel redirects here when there is no active session.
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import logo from '@/assets/bocafest/logo.png';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, go to admin
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: '/admin' });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: authError } = await signIn(email.trim(), password);
    if (authError) {
      setError('Credenciales incorrectas. Verifica tu contraseña.');
    } else {
      navigate({ to: '/admin' });
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf7f2] px-4">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/80 shadow-2xl shadow-primary/10 backdrop-blur-sm">

          {/* Header */}
          <div className="flex flex-col items-center gap-3 border-b border-primary/10 px-8 py-8">
            <img src={logo} alt="Bocafest" className="h-14 w-auto" />
            <div className="text-center">
              <h1 className="font-display text-2xl font-semibold text-primary">Panel de Administración</h1>
              <p className="mt-1 text-sm text-muted-foreground">Inicia sesión para gestionar tu tienda</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 pr-11 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Iniciando sesión...</>
                : <><LogIn className="h-4 w-4" /> Iniciar Sesión</>
              }
            </button>
          </form>

          <div className="border-t border-primary/10 px-8 py-4 text-center">
            <p className="text-xs text-muted-foreground">Bocafest Food Box · Panel Administrativo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
