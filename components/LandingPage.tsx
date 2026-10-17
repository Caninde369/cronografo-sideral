import React, { useState, useEffect, useRef } from 'react';
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
import { SiderealClock } from './SiderealClock';
import { useCelestialData } from '../hooks/useCelestialData';
import { StarField } from './StarField';
import { Eye, EyeOff, Sparkles, LogIn, UserPlus, Lock, Mail, User as UserIcon, CheckCircle2, AlertCircle, ShieldCheck, Compass, Play } from 'lucide-react';

interface LandingPageProps {
  onLoginSuccess: (user: { username: string; email: string; isAdmin: boolean; photoURL?: string }) => void;
  onExploreGuest?: () => void;
}

const DEFAULT_SP_LOCATION = {
  latitude: -23.5505,
  longitude: -46.6333,
  displayName: 'São Paulo, BR',
};

const ALL_PLANETS_VISIBLE: Record<string, boolean> = {
  sun: true,
  moon: true,
  mercury: true,
  venus: true,
  mars: true,
  jupiter: true,
  saturn: true,
  uranus: true,
  neptune: true,
  pluto: true,
  lilith: true,
  northNode: false,
  southNode: false,
  chiron: true,
  ceres: false,
  pallas: false,
  juno: false,
  vesta: false,
  partOfFortune: false,
};

const NOOP = () => {};

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess, onExploreGuest }) => {
  // Current time for "Hoje" (Today) in real-time
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const celestialData = useCelestialData(
    currentTime,
    DEFAULT_SP_LOCATION,
    ALL_PLANETS_VISIBLE,
    'porphyry',
    'tropical'
  );

  // Auth Form State
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resize calculation for Chronograph in 3/4 section
  const containerRef = useRef<HTMLDivElement>(null);
  const [clockSize, setClockSize] = useState(680);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const optimal = Math.min(width * 0.94, height * 0.94, 940);
      setClockSize(Math.max(280, optimal));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      try {
        await syncUserProfile(user);
      } catch (profileErr) {
        console.warn('Non-blocking user profile sync warning:', profileErr);
      }
      const isAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
      onLoginSuccess({
        username: user.displayName || user.email?.split('@')[0] || 'Astrólogo',
        email: user.email || '',
        isAdmin,
        photoURL: user.photoURL || undefined,
      });
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.info('Google Sign-In popup closed by user.');
        // Limpa mensagem de erro para não poluir a interface
        setErrorMsg('');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('O pop-up de login foi bloqueado pelo seu navegador. Por favor, habilite pop-ups para continuar.');
      } else {
        console.error('Google Sign-In error:', err);
        setErrorMsg('Erro ao autenticar com o Google. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Email/Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Preencha seu e-mail e senha.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;
      await syncUserProfile(user);
      const isAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
      onLoginSuccess({
        username: user.displayName || user.email?.split('@')[0] || 'Astrólogo',
        email: user.email || '',
        isAdmin,
        photoURL: user.photoURL || undefined,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMsg('E-mail ou senha incorretos.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Formato de e-mail inválido.');
      } else if (err?.code === 'auth/too-many-requests') {
        setErrorMsg('Muitas tentativas. Aguarde um instante.');
      } else {
        setErrorMsg('Não foi possível entrar. Verifique os dados.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Email/Password Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      await syncUserProfile(user);
      const isAdmin = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';
      onLoginSuccess({
        username: name.trim() || user.email?.split('@')[0] || 'Astrólogo',
        email: user.email || '',
        isAdmin,
        photoURL: user.photoURL || undefined,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('Este e-mail já está cadastrado. Faça login.');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Formato de e-mail inválido.');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMsg('A senha é muito fraca. Escolha uma senha mais forte.');
      } else {
        setErrorMsg('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Reset
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Informe seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg('Link de redefinição de senha enviado para seu e-mail!');
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err?.code === 'auth/user-not-found') {
        setErrorMsg('Nenhum usuário encontrado com este e-mail.');
      } else {
        setErrorMsg('Erro ao enviar e-mail de recuperação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030208] flex flex-col md:flex-row select-none">
      
      {/* ── FUNDO ESTRELAR CONTÍNUO (FULL SCREEN) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <StarField 
          starCount={1600}
          twinkleIntensity={0.85}
          twinkleSpeed={1.0}
          showMeteors={true}
          meteorFrequency="moderate"
          showNebulaGlow={true}
          nebulaOpacity={0.7}
          starBrightness={1.1}
          className="w-full h-full"
        />
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(255, 255, 255, 0.04) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* ── SEÇÃO ESQUERDA (3/4 DA TELA): CRONÓGRAFO SIDERAL VIVO ── */}
      <div 
        ref={containerRef}
        className="w-full md:w-3/4 h-1/2 md:h-full relative z-10 overflow-hidden flex items-center justify-center bg-transparent"
      >
        <div 
          className="relative flex items-center justify-center"
          style={{ 
            width: `${clockSize}px`, 
            height: `${clockSize}px`,
            maxWidth: '96%',
            maxHeight: '96%',
            pointerEvents: 'none'
          }}
        >
          <SiderealClock 
            celestialData={celestialData}
            natalData={undefined}
            filteredAspects={celestialData.aspects}
            ghostPlanets={[]}
            visiblePlanets={ALL_PLANETS_VISIBLE}
            selectedPlanets={[]}
            selectedAspects={[]}
            selectedHouses={[]}
            hoveredPlanet={null}
            hoveredAspect={null}
            hoveredHouse={null}
            onPlanetClick={NOOP}
            onAspectClick={NOOP}
            onHouseClick={NOOP}
            setHoveredHouse={NOOP}
            showAspectLines={true}
            showNatalLines={false}
            isNatalMode={false}
            showNeedle={true}
            isZodiacFixed={false}
            showAtmosphere={false}
            showStars={true}
            showConstellations={true}
            showMagneticField={false}
            showOrbits={true}
            allPlanetsSameOrbit={false}
            showSeasonsRing={true}
            showDecanRing={true}
            showTermsRing={true}
            showTimeRing={false}
            showHouseLines={true}
            showHouseMarkers={true}
            showMcIcArrows={false}
            showSignLines={true}
            signLineOpacity={0.25}
            signLineThickness={1}
            showDegreeLabels={false}
            showPlanetSpheres={true}
            houseFormat="roman"
            houseLineFormat="solid"
            zodiacColorMode="element"
            highlightFilter={null}
            pointerStyle="minimal"
            pointerThickness={2.5}
            pointerOpacity={0.85}
            pointerHead="arrow"
            pointerTail="none"
            pointerShowGradLine={true}
            pointerFull={false}
            theme="dark"
            locationName={DEFAULT_SP_LOCATION.displayName}
            onClockClick={NOOP}
            houseLineThickness={1}
            houseLineOpacity={0.35}
            planetSize={44}
            zodiacSignSize={44}
            seasonIngresses={[]}
            timeRingScale={1}
            customBackgroundImage={null}
            magneticFieldSize={1}
            magneticFieldOpacity={0}
            degreeLabelSize={18}
            degreeLabelPosition="responsive"
            degreeLabelFormat="vertical"
            mainHouseLineThickness={1.5}
            mainHouseLineOpacity={0.8}
            mainHouseLineColor="#a3a59d"
            houseLineColor="#878273"
            graduationRingWidth={18}
            zodiacRingScale={1.0}
            seasonsRingScale={0.75}
            decanRingScale={2.0}
            termsRingScale={2.0}
            ringLineColor="#746F5D"
          />
        </div>

        {/* Subtle Watermark Branding */}
        <div className="absolute bottom-4 left-6 z-20 pointer-events-none hidden sm:flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
          <span className="font-manrope text-[11px] tracking-wider text-white/50 font-semibold uppercase">
            Céu Atual em Tempo Real · Alta Precisão
          </span>
        </div>
      </div>

      {/* ── DOCA DIREITA (1/4 DA TELA): PAINEL DE LOGIN COM BORDAS CINZAS ── */}
      <div className="w-full md:w-1/4 min-w-[320px] max-w-[440px] md:min-w-[340px] lg:min-w-[380px] h-1/2 md:h-full relative z-20 p-2 sm:p-2.5 md:p-3 flex flex-col pointer-events-auto">
        
        {/* Floating Dock Panel with matching grey borders */}
        <div 
          className="relative w-full h-full flex flex-col backdrop-blur-xl rounded-[18px] overflow-hidden bg-[#06060a]/95 border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-200 ease-out"
        >
          {/* Header Bar */}
          <div 
            className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/[0.02] shrink-0 select-none"
            style={{ height: '36px' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              <span 
                className="font-manrope text-[12px] font-bold uppercase tracking-wider text-white/90"
              >
                Acesso ao Cronógrafo
              </span>
            </div>

            <div className="flex items-center gap-1 text-white/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
            </div>
          </div>

          {/* Panel Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 flex flex-col justify-between">
            
            {/* Top Logo Area (Versão Dark Mode no Topo) */}
            <div className="text-center flex flex-col items-center shrink-0 pt-1 pb-1">
              <div className="flex items-center justify-center">
                <img 
                  src="/logo-dark.svg" 
                  alt="Cronógrafo Sideral" 
                  className="h-10 sm:h-11 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(255,255,255,0.22)]" 
                  onError={(e) => { e.currentTarget.src = '/logo.svg'; }}
                />
              </div>
            </div>

            {/* Middle: Auth Area (Centralizado ao Meio) */}
            <div className="my-auto py-2 flex flex-col justify-center">
              {/* Navigation Tabs: Entrar vs Cadastrar */}
              {activeTab !== 'forgot' && (
                <div className="grid grid-cols-2 w-full p-1 bg-black/60 border border-white/10 rounded-xl mb-3.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-2 text-xs font-manrope font-semibold tracking-wider transition-all duration-150 rounded-lg flex items-center justify-center gap-1.5 ${
                      activeTab === 'login'
                        ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                        : 'text-white/50 hover:text-white/80 border border-transparent'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Entrar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                    className={`py-2 text-xs font-manrope font-semibold tracking-wider transition-all duration-150 rounded-lg flex items-center justify-center gap-1.5 ${
                      activeTab === 'register'
                        ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                        : 'text-white/50 hover:text-white/80 border border-transparent'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Cadastrar</span>
                  </button>
                </div>
              )}
              <AnimatePresence mode="wait">
                {/* ─── TAB: LOGIN ─── */}
                {activeTab === 'login' && (
                  <motion.form 
                    key="login-form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleEmailLogin}
                    className="space-y-3"
                  >
                    {/* Email Field */}
                    <div>
                      <label className="block font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
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
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/20 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70">
                          Senha
                        </label>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                          className="font-manrope text-[11px] text-white/50 hover:text-white transition-colors underline underline-offset-2"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/20 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Error message */}
                    {errorMsg && (
                      <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-manrope">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="leading-tight">{errorMsg}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] hover:opacity-95 text-black font-manrope font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-1 cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-black" />
                          <span>Acessar Cronógrafo</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* ─── TAB: REGISTER ─── */}
                {activeTab === 'register' && (
                  <motion.form 
                    key="register-form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleRegister}
                    className="space-y-2.5"
                  >
                    {/* Name */}
                    <div>
                      <label className="block font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
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
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-10 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 p-1"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a senha"
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                      </div>
                    </div>

                    {/* Error message */}
                    {errorMsg && (
                      <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-manrope">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="leading-tight">{errorMsg}</span>
                      </div>
                    )}

                    {/* Submit Register */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F5D98A] hover:opacity-95 text-black font-manrope font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm mt-1 cursor-pointer"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-black" />
                          <span>Criar Minha Conta</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                )}

                {/* ─── TAB: FORGOT PASSWORD ─── */}
                {activeTab === 'forgot' && (
                  <motion.form 
                    key="forgot-form"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    onSubmit={handleForgotPassword}
                    className="space-y-3"
                  >
                    <div className="text-center mb-2">
                      <h3 className="font-manrope text-sm text-white font-bold">
                        Recuperação de Acesso
                      </h3>
                      <p className="font-manrope text-xs text-white/60 mt-0.5">
                        Enviaremos um link de recuperação para seu e-mail.
                      </p>
                    </div>

                    <div>
                      <label className="block font-manrope text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1">
                        E-mail Cadastrado
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full bg-black/60 border border-white/15 focus:border-white/40 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-white/30 outline-none transition-all font-manrope"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center gap-2 font-manrope">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="leading-tight">{errorMsg}</span>
                      </div>
                    )}

                    {successMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 font-manrope">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="leading-tight">{successMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-manrope font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      {loading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Enviar Link de Recuperação</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setActiveTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                      className="w-full text-center font-manrope text-xs text-white/50 hover:text-white pt-1 transition-colors block"
                    >
                      ← Voltar para o login
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Social Auth Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="w-full h-[1px] bg-white/10" />
                <span className="absolute px-3 bg-[#06060a] font-manrope text-[10px] text-white/40 uppercase tracking-widest">
                  ou
                </span>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 bg-black/50 hover:bg-white/[0.08] border border-white/15 hover:border-white/30 rounded-xl py-2 px-4 transition-all duration-150 shadow-sm active:scale-[0.98] group cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="font-manrope text-xs font-semibold text-white group-hover:text-[#F5D98A] tracking-wide transition-colors">
                  Continuar com Google
                </span>
              </button>

              {/* Botão Entrar como Visitante / Exploração Gratuita */}
              {onExploreGuest && (
                <button
                  type="button"
                  onClick={onExploreGuest}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl py-2 px-3 transition-all text-xs font-manrope text-white/80 hover:text-white"
                >
                  <Play className="w-3 h-3 text-cyan-400" />
                  <span>Explorar no Plano Gratuito</span>
                </button>
              )}
            </div>

            {/* Bottom Security Footer */}
            <div className="pt-2 border-t border-white/10 text-center shrink-0">
              <p className="font-manrope text-[10px] text-white/40 tracking-wider font-medium">
                Ambiente Seguro · Conexão Criptografada
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
