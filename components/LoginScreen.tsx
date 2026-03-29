import React, { useState, useMemo } from 'react';

const SUPERNOVA = 'linear-gradient(135deg, #6366F1 0%, #22D3EE 25%, #818cf8 45%, #f472b6 65%, #fb923c 80%, #EF4444 100%)';

interface LoginScreenProps {
  onLoginSuccess: (user: { username: string; isAdmin: boolean }) => void;
  onBack?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [username,        setUsername]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering,   setIsRegistering]   = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  const stars = useMemo(() => {
    const rng = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: 80 }, (_, i) => ({
      cx: rng(i) * 100, cy: rng(i * 2) * 100,
      r: rng(i * 3) * 0.9 + 0.3,
      opacity: rng(i * 4) * 0.5 + 0.15,
      dur: rng(i * 5) * 3.5 + 2.0,
      delay: rng(i * 6) * 5.0,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    if (isRegistering && password !== confirmPassword) {
      setError('As senhas não coincidem.'); setLoading(false); return;
    }
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) { onLoginSuccess({ username: data.username || username, isAdmin: data.isAdmin }); }
      else { setError(data.error || (isRegistering ? 'Falha no cadastro' : 'Login falhou')); }
    } catch { setError('Erro de rede. Tente novamente.'); }
    finally { setLoading(false); }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    padding: '13px 16px', fontSize: '14px', color: '#fff',
    outline: 'none', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s',
  };

  const labelBase: React.CSSProperties = {
    display: 'block', fontFamily: "'DM Sans', sans-serif",
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '6px',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: '#03030a' }}>

      {onBack && (
        <button onClick={onBack}
                className="absolute top-6 left-6 z-50 flex items-center gap-2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>
      )}

      {/* Background estelar + névoa supernova */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <style>{`@keyframes twinkle{0%,100%{opacity:var(--lo)}50%{opacity:var(--hi)}}`}</style>
            <radialGradient id="sn1" cx="20%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.10"/>
              <stop offset="100%" stopColor="#03030a" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="sn2" cx="80%" cy="50%" r="35%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#03030a" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="sn3" cx="50%" cy="30%" r="30%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#03030a" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="#03030a"/>
          <rect width="100%" height="100%" fill="url(#sn1)"/>
          <rect width="100%" height="100%" fill="url(#sn2)"/>
          <rect width="100%" height="100%" fill="url(#sn3)"/>
          {stars.map((s, i) => (
            <circle key={i} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white"
                    style={{ '--lo': s.opacity * 0.3, '--hi': s.opacity, animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite` } as React.CSSProperties}/>
          ))}
        </svg>
      </div>

      {/* Card com borda supernova */}
      <div style={{
        position: 'relative', zIndex: 2,
        width: '100%', maxWidth: '420px', margin: '0 16px',
        borderRadius: '20px', padding: '1.5px', background: SUPERNOVA,
      }}>
        <div style={{
          background: '#080810', borderRadius: '19px',
          padding: '2.5rem 2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Névoa interna */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse at 0% 50%, rgba(99,102,241,0.06) 0%, transparent 60%),
              radial-gradient(ellipse at 100% 50%, rgba(239,68,68,0.05) 0%, transparent 60%)
            `,
          }} />

          <img src="/logo.svg" alt="Cronógrafo Sideral"
               style={{ width: 'clamp(200px, 60%, 280px)', height: 'auto', objectFit: 'contain', marginBottom: '0.5rem', opacity: 0.92, position: 'relative' }}
               onError={e => { e.currentTarget.style.display = 'none'; }} />

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '9px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: '2rem', position: 'relative' }}>
            Beta
          </p>

          <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2rem', position: 'relative' }} />

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
            <div>
              <label style={labelBase}>Usuário</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                     placeholder="Digite seu usuário" required style={inputBase}
                     onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.55)')}
                     onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            <div>
              <label style={labelBase}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                     placeholder="Digite sua senha" required style={inputBase}
                     onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.55)')}
                     onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
            </div>
            {isRegistering && (
              <div>
                <label style={labelBase}>Confirmar Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                       placeholder="Confirme sua senha" required style={inputBase}
                       onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.55)')}
                       onBlur={e  => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
              </div>
            )}

            {error && (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: 'rgba(248,113,113,0.9)', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <div style={{ width: '100%', borderRadius: '11px', padding: '1.5px', background: SUPERNOVA, marginTop: '4px' }}>
              <button type="submit" disabled={loading} style={{
                width: '100%', background: '#080810', color: '#F5F2EB', border: 'none',
                borderRadius: '10px', padding: '15px',
                fontFamily: "'DM Sans', sans-serif", fontSize: '12px',
                fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxSizing: 'border-box', transition: 'background 0.2s',
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(10,10,28,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#080810'; }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                      <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setPassword(''); setConfirmPassword(''); }}
            style={{ marginTop: '1.25rem', fontFamily: "'DM Sans', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px', transition: 'color 0.2s', position: 'relative' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
            {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>

          <p style={{ marginTop: '1.5rem', fontFamily: "'DM Sans', sans-serif", fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', position: 'relative' }}>
            Ambiente Seguro v2.9.6
          </p>
        </div>
      </div>
    </div>
  );
};