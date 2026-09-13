import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Columns3, Users, FileUp, LogOut, X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/',       label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/kanban', label: 'Pipeline',   icon: Columns3 },
  { to: '/leads',  label: 'Directorio', icon: Users },
  { to: '/mailing',label: 'Mailing',    icon: Mail },
  { to: '/import', label: 'Importar',   icon: FileUp },
];

export default function Layout({ children }) {
  const { signOut, session } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">

      {/* ── DESKTOP sidebar (lg+) ── */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
          <img src="/logo.png" alt="Vestra" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
          <div className="leading-tight">
            <span className="text-base font-black tracking-tight text-gray-900">Vestra</span>
            <span className="text-base font-medium text-gray-400 ml-1">CRM</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {session?.user?.email && (
            <p className="text-xs text-gray-400 px-3 truncate">{session.user.email}</p>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── RIGHT SIDE ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* MOBILE: mini top bar (solo logo + logout) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Vestra" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-gray-900 text-sm">
              Vestra <span className="text-gray-400 font-medium">CRM</span>
            </span>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* Page content — on mobile leave room for bottom nav */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* ── MOBILE bottom navigation ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-stretch h-16">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                    </div>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          {/* iPhone safe area spacer */}
          <div className="h-safe-bottom bg-white" style={{ height: 'env(safe-area-inset-bottom)' }} />
        </nav>

      </div>
    </div>
  );
}
