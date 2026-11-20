import React, { useState } from 'react';
import { Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { getDoctorDemoAccounts } from '../lib/doctorAuth';

interface LoginViewProps {
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('hassan.elidrissi@mediflow.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoAccounts = getDoctorDemoAccounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onLogin(email, password, remember);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Email ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-hospital-blue-600 rounded-2xl text-white shadow-xl shadow-hospital-blue-600/20 mb-4">
            <Stethoscope size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">MediFlow</h1>
          <p className="text-slate-500 mt-2">Connexion medecin avec acces a votre specialite et vos patients.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900">Bienvenue</h2>
            <p className="text-sm text-slate-500">Connectez-vous pour ouvrir votre espace medecin personnel.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Professionnel</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-hospital-blue-600 transition-colors" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@mediflow.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-hospital-blue-500 focus:ring-4 focus:ring-hospital-blue-500/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mot de passe</label>
                <button type="button" className="text-xs font-bold text-hospital-blue-600 hover:underline">Acces securise</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-hospital-blue-600 transition-colors" size={18} />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-sm outline-none focus:bg-white focus:border-hospital-blue-500 focus:ring-4 focus:ring-hospital-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-1">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-hospital-blue-600 focus:ring-hospital-blue-500"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Se souvenir de moi</label>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full bg-hospital-blue-600 hover:bg-hospital-blue-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold shadow-lg shadow-hospital-blue-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Se Connecter
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Comptes de demonstration</p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('');
                  }}
                  className="w-full text-left rounded-xl border border-slate-100 bg-white px-3 py-2 hover:border-hospital-blue-200 hover:bg-hospital-blue-50 transition-all"
                >
                  <p className="text-sm font-bold text-slate-900">{account.doctorName}</p>
                  <p className="text-xs text-slate-500">{account.email}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Les mots de passe de demonstration ne sont plus exposes dans l interface.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
