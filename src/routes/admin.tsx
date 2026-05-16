import { createFileRoute, Outlet, Link, useLocation, useNavigate } from '@tanstack/react-router';
import { LayoutDashboard, ShoppingBag, PackageSearch, Settings, LogOut, Menu, X, Tags, Loader2, Megaphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import logo from '@/assets/bocafest/logo.png';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/login' });
    }
  }, [user, loading, navigate]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: '/login' });
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
    { name: 'Catálogo', href: '/admin/catalogo', icon: PackageSearch },
    { name: 'Categorías', href: '/admin/categorias', icon: Tags },
    { name: 'Pop Up', href: '/admin/popup', icon: Megaphone },
    { name: 'Ajustes', href: '/admin/ajustes', icon: Settings },
  ];

  // Show branded spinner while checking auth — prevents blank screen
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
      <div className="flex flex-col items-center gap-4">
        <img src={logo} alt="Bocafest" className="h-12 w-auto opacity-80" />
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    </div>
  );

  // Not logged in — show nothing while redirect to /admin/login triggers
  if (!user) return null;

  const userEmail = user.email || 'admin@bocafest.com';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r bg-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex h-16 items-center justify-between px-6 border-b shrink-0">
          <img src={logo} alt="Bocafest" className="h-8 w-auto" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col justify-between flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 mt-4"
          >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 lg:px-8">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-lg font-semibold md:text-xl">Panel de Administración</h1>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs text-muted-foreground mt-1">{userEmail}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
