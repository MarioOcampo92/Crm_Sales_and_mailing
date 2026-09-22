import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PortalLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Validar que el email tiene suscripciones
      const { data } = await supabase.functions.invoke('validate-portal-email', {
        body: { email: email.trim().toLowerCase() }
      });

      if (!data?.valid) {
        setError(data?.error || 'Este email no tiene suscripciones asociadas.');
        setLoading(false);
        return;
      }

      // 2. Enviar Magic Link
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/portal`,
          data: { role: 'client', display_name: data.client_name }
        }
      });

      if (authError) {
        setError('Error al enviar el enlace. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch (err) {
      setError('Error de conexión. Inténtalo de nuevo.');
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Revisa tu correo!</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Hemos enviado un enlace de acceso seguro a <strong className="text-gray-700">{email}</strong>. 
            Haz clic en el enlace del correo para acceder a tu portal.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              Si no ves el correo, revisa tu carpeta de spam. El enlace expira en 1 hora.
            </p>
          </div>
          <button 
            onClick={() => { setSent(false); setEmail(''); }}
            className="mt-6 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">

        {/* Logo + título */}
        <div className="flex flex-col items-center mb-8">
          <img src="/vestra-logo-mail.png" alt="Vestra" className="w-16 h-16 rounded-2xl mb-4 shadow-md" />
          <h1 className="text-2xl font-bold text-gray-900">
            Portal de <span className="text-indigo-500">Cliente</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Accede para consultar tus facturas y suscripción
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tu email de facturación</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {loading ? 'Verificando...' : 'Enviar enlace de acceso'}
          </button>
        </form>

        <div className="mt-6 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-[11px] text-gray-400 text-center leading-relaxed">
            🔒 Acceso seguro sin contraseña. Recibirás un enlace único en tu correo electrónico de facturación.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Vestra Solutions © 2026
        </p>
      </div>
    </div>
  );
}
