import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  auth, 
  googleProvider, 
  syncUserProfile 
} from '../lib/firebase';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, X, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { username: string; email: string; isAdmin: boolean }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await syncUserProfile(user);
      const isAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
      onSuccess({
        username: user.displayName || user.email?.split('@')[0] || 'Astrólogo',
        email: user.email || '',
        isAdmin
      });
      onClose();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // Usuário apenas fechou ou cancelou o pop-up do Google voluntariamente; não é um erro fatal
        console.info('Google Sign-In popup closed by user.');
        setErrorMsg('');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('O pop-up de login foi bloqueado pelo seu navegador. Por favor, habilite pop-ups para continuar.');
      } else {
        console.error('Google Auth Error:', err);
        setErrorMsg('Não foi possível autenticar com o Google no momento. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        await syncUserProfile(user);
        const isAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
        onSuccess({
          username: user.displayName || user.email?.split('@')[0] || 'Astrólogo',
          email: user.email || '',
          isAdmin
        });
        onClose();
      } else if (tab === 'register') {
        if (password !== confirmPassword) {
          setErrorMsg('As senhas digitadas não coincidem.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('A senha precisa ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;
        if (name.trim()) {
          await updateProfile(user, { displayName: name.trim() });
        }
        await syncUserProfile(user);
        const isAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
        onSuccess({
          username: name.trim() || user.email?.split('@')[0] || 'Astrólogo',
          email: user.email || '',
          isAdmin
        });
        onClose();
      } else if (tab === 'forgot') {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMsg('E-mail de recuperação enviado com sucesso. Verifique sua caixa de entrada.');
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado. Faça login.');
      } else {
        setErrorMsg(err.message || 'Erro na autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[13000] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md rounded-[22px] bg-[#06060a]/95 border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.1)] text-white p-6 sm:p-7"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90 text-[10px] font-manrope font-bold uppercase tracking-widest mb-2.5">
            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
            <span>Cronógrafo Sideral</span>
          </div>
          <h3 className="font-manrope text-xl font-bold text-white tracking-tight">
            {tab === 'login' ? 'Entrar na sua conta' : tab === 'register' ? 'Criar nova conta' : 'Recuperar acesso'}
          </h3>
          <p className="font-manrope text-xs text-white/60 mt-1">
            {tab === 'login' ? 'Acesse seus mapas e layouts personalizados' : tab === 'register' ? 'Cadastre-se para sincronizar seus dados' : 'Digite seu e-mail para receber as instruções'}
          </p>
        </div>

        {/* Social Login (Google) */}
        {tab !== 'forgot' && (
          <div className="mb-5">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-black/50 hover:bg-white/[0.08] border border-white/15 hover:border-white/30 text-white font-manrope text-xs font-semibold tracking-wider transition-all duration-150 active:scale-[0.98] shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continuar com Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="w-full h-px bg-white/10" />
              <span className="absolute px-3 bg-[#06060a] font-manrope text-[10px] text-white/40 uppercase tracking-widest">
                ou com e-mail
              </span>
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/30 text-red-200 text-xs font-manrope flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-200 text-xs font-manrope flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5 font-manrope">
          {tab === 'register' && (
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-white/70 mb-1">
                Nome de Exibição
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-wider text-white/70 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {tab !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-white/70">
                  Senha
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-[11px] text-white/50 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Esqueceu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-white/70 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] hover:opacity-95 text-black font-manrope font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 mt-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              tab === 'login' ? 'Entrar' : tab === 'register' ? 'Criar Conta' : 'Enviar E-mail de Recuperação'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-5 text-center text-xs font-manrope">
          {tab === 'login' ? (
            <p className="text-white/60">
              Não tem uma conta?{' '}
              <button
                onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-white font-bold hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </p>
          ) : tab === 'register' ? (
            <p className="text-white/60">
              Já possui conta?{' '}
              <button
                onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-white font-bold hover:underline"
              >
                Faça login
              </button>
            </p>
          ) : (
            <button
              onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-white/60 hover:text-white"
            >
              ← Voltar para o login
            </button>
          )}
        </div>

      </motion.div>
    </div>,
    document.body
  );
};
