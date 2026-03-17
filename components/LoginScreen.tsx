import React, { useState } from 'react';
import { UI_ICONS } from './icons';

interface LoginScreenProps {
    onLoginSuccess: (user: { username: string; isAdmin: boolean }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (isRegistering && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess({ username: data.username || username, isAdmin: data.isAdmin });
            } else {
                setError(data.error || (isRegistering ? 'Falha no cadastro' : 'Login falhou'));
            }
        } catch (err) {
            setError('Erro de rede. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/90 backdrop-blur-sm font-manrope">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-orange/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
            </div>

            <div className="relative w-full max-w-md p-8 mx-4 bg-brand-surface/40 backdrop-blur-xl border border-brand-border/10 rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-col items-center mb-8">
                    <img src="/logo.svg" alt="Cronógrafo Sideral" className="w-[340px] h-[172px] object-contain mb-4" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 -mt-8">
                    <div>
                        <label className="block text-xs font-medium text-brand-text-muted uppercase tracking-wider mb-1.5 ml-1">
                            Usuário
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-brand-surface-highlight/50 border border-brand-border/10 rounded-xl text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-transparent transition-all"
                            placeholder="Digite seu usuário"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-brand-text-muted uppercase tracking-wider mb-1.5 ml-1">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-brand-surface-highlight/50 border border-brand-border/10 rounded-xl text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-transparent transition-all"
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>

                    {isRegistering && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-medium text-brand-text-muted uppercase tracking-wider mb-1.5 ml-1">
                                Confirmar Senha
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-brand-surface-highlight/50 border border-brand-border/10 rounded-xl text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-transparent transition-all"
                                placeholder="Confirme sua senha"
                                required
                            />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 text-white font-bold rounded-xl shadow-lg shadow-brand-purple/25 hover:shadow-brand-purple/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                        style={{ backgroundImage: 'url(/fundo-botao.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processando...
                            </span>
                        ) : (
                            isRegistering ? 'Cadastrar' : 'Entrar no Sistema'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                            setPassword('');
                            setConfirmPassword('');
                        }}
                        className="text-sm text-brand-text-muted hover:text-brand-text transition-colors underline decoration-brand-border hover:decoration-brand-text underline-offset-4"
                    >
                        {isRegistering ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-brand-text-muted uppercase tracking-widest">
                        Ambiente Seguro v2.9.6
                    </p>
                </div>
            </div>
        </div>
    );
};
