import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { BarChart3, Briefcase, FileText, LayoutDashboard, LogOut, Menu, Receipt, Users, Wallet, UserCog, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/projetos', label: 'Projetos', icon: Briefcase },
  { to: '/contratos', label: 'Contratos', icon: FileText },
  { to: '/receber', label: 'Contas a receber', icon: Receipt },
  { to: '/caixa', label: 'Caixa & Extrato', icon: Wallet },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/socios', label: 'Sócios & Rateio', icon: UserCog },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Wallet className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Financeiro</p>
          <p className="text-xs text-slate-400">Gestão dos sócios</p>
        </div>
      </div>
      <div className="flex-1 space-y-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium text-white">{user?.name}</p>
        <p className="truncate text-xs text-slate-400">{user?.email}</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white">
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-slate-900 lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 bg-slate-900">
            <button className="absolute right-3 top-5 text-slate-400" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Financeiro</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
