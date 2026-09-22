import { LogOut, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PortalLayout({ children }) {
  const { session, signOut } = useAuth();
  const userEmail = session?.user?.email;
  const userName = session?.user?.user_metadata?.display_name || userEmail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vestra-logo-mail.png" alt="Vestra" className="w-9 h-9 rounded-xl shadow-sm" />
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Vestra <span className="text-indigo-500 font-medium">Portal</span>
              </h1>
              <p className="text-[11px] text-gray-400 -mt-0.5">Área de cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{userName}</p>
              {userName !== userEmail && (
                <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{userEmail}</p>
              )}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-gray-400">
            ¿Necesitas ayuda? Contacta con nosotros en{' '}
            <a href="mailto:soporte@vestrasolutions.org" className="text-indigo-500 hover:underline">
              soporte@vestrasolutions.org
            </a>
          </p>
          <p className="text-[11px] text-gray-300 mt-2">Vestra Solutions © 2026</p>
        </div>
      </footer>
    </div>
  );
}
