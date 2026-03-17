import React, { useEffect, useState } from 'react';
import { UI_ICONS } from './icons';

interface User {
    username: string;
    role: string;
    createdAt: string;
}

interface Session {
    username: string;
    createdAt: string;
}

interface AdminStats {
    activeSessions: number;
    totalUsers: number;
    users: User[];
    sessions: Session[];
}

export const AdminDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (!res.ok) throw new Error('Failed to fetch stats');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError('Acesso negado ou erro ao carregar dados.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                <div className="bg-brand-surface border border-red-500/30 p-6 rounded-xl text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={onClose} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-white">Fechar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/90 backdrop-blur-md font-manrope p-4">
            <div className="bg-brand-surface/95 border border-brand-border/10 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-brand-border/10 flex justify-between items-center bg-brand-surface-highlight/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-purple/20 rounded-lg text-brand-purple">
                            <UI_ICONS.LayersIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-brand-text">Painel Administrativo</h2>
                            <p className="text-xs text-brand-text-muted uppercase tracking-wider">Monitoramento do Sistema</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brand-surface-highlight rounded-full text-brand-text-muted hover:text-brand-text transition-colors">
                        <UI_ICONS.CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-brand-surface-highlight/50 border border-brand-border/5 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-sm text-brand-text-muted uppercase tracking-wider font-bold">Usuários Totais</p>
                                <p className="text-4xl font-bold text-brand-text mt-1">{stats?.totalUsers}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <UI_ICONS.BookIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-brand-surface-highlight/50 border border-brand-border/5 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-sm text-brand-text-muted uppercase tracking-wider font-bold">Sessões Ativas</p>
                                <p className="text-4xl font-bold text-green-400 mt-1">{stats?.activeSessions}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                <UI_ICONS.OrbitIcon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    <div>
                        <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-purple rounded-full"></span>
                            Usuários Registrados
                        </h3>
                        <div className="bg-brand-surface-highlight/50 border border-brand-border/5 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-brand-surface-highlight/50 text-brand-text-muted uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4">Usuário</th>
                                        <th className="p-4">Função</th>
                                        <th className="p-4">Data de Criação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border/5">
                                    {stats?.users.map((user, i) => (
                                        <tr key={i} className="hover:bg-brand-surface-highlight transition-colors">
                                            <td className="p-4 font-medium text-brand-text">{user.username}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-brand-surface-highlight text-brand-text'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-brand-text-muted">{new Date(user.createdAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sessions Table */}
                    <div>
                        <h3 className="text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-brand-orange rounded-full"></span>
                            Sessões Ativas
                        </h3>
                        <div className="bg-brand-surface-highlight/50 border border-brand-border/5 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-brand-surface-highlight/50 text-brand-text-muted uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4">Usuário</th>
                                        <th className="p-4">Início da Sessão</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-border/5">
                                    {stats?.sessions.map((session, i) => (
                                        <tr key={i} className="hover:bg-brand-surface-highlight transition-colors">
                                            <td className="p-4 font-medium text-brand-text">{session.username}</td>
                                            <td className="p-4 text-brand-text-muted">{new Date(session.createdAt).toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase">
                                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                                    Online
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
