import React, { useState, useEffect } from 'react';
import { UI_ICONS } from './icons';

interface User {
    username: string;
    role: string;
    createdAt: string;
}

interface AdminStats {
    activeSessions: number;
    totalUsers: number;
    users: User[];
}

interface DashboardProps {
    onClose: () => void;
    isAdmin: boolean;
    username: string;
    natalDate?: string;
    natalTime?: string;
    initialTab?: 'profile' | 'maps' | 'layouts' | 'admin';
    onEditNatal?: () => void;
    onUpdateProfile?: (data: { username: string; birthDate?: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    onClose, 
    isAdmin, 
    username,
    natalDate,
    natalTime,
    initialTab = 'profile',
    onEditNatal,
    onUpdateProfile 
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'maps' | 'layouts' | 'admin'>(initialTab);
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    // Mock data for saved items (in a real app, these would come from an API or localStorage)
    const [savedMaps] = useState([
        { id: 1, name: 'Meu Mapa Natal', date: '1990-05-15', time: '14:30' },
        { id: 2, name: 'Trânsito Importante', date: '2024-03-20', time: '10:00' },
    ]);

    const [savedLayouts] = useState([
        { id: 1, name: 'Minimalista Dark', description: 'Foco no relógio e planetas' },
        { id: 2, name: 'Técnico Completo', description: 'Todas as linhas e tabelas visíveis' },
    ]);

    useEffect(() => {
        if (activeTab === 'admin' && isAdmin) {
            fetchAdminStats();
        }
    }, [activeTab, isAdmin]);

    const fetchAdminStats = async () => {
        setLoadingAdmin(true);
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                setAdminStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch admin stats", err);
        } finally {
            setLoadingAdmin(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-dark/80 backdrop-blur-xl font-manrope p-4 animate-in fade-in duration-300">
            <div className="bg-brand-surface/90 border border-white/10 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col ring-1 ring-white/5">
                
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 flex items-center justify-center text-brand-purple border border-brand-purple/30 shadow-lg shadow-brand-purple/10">
                            <UI_ICONS.UserIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-brand-text tracking-tight">Dashboard</h2>
                            <p className="text-xs text-brand-text-muted uppercase tracking-[0.2em] font-bold opacity-60">Central de Comando</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-2xl text-brand-text-muted hover:text-brand-text transition-all duration-300 border border-transparent hover:border-white/10"
                    >
                        <UI_ICONS.CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Navigation */}
                    <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-2 bg-black/20">
                        <button 
                            onClick={() => setActiveTab('profile')}
                            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${activeTab === 'profile' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-brand-text-muted hover:bg-white/5 hover:text-brand-text'}`}
                        >
                            <UI_ICONS.UserIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">Perfil</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('maps')}
                            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${activeTab === 'maps' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-brand-text-muted hover:bg-white/5 hover:text-brand-text'}`}
                        >
                            <UI_ICONS.BookIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">Mapas Salvos</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('layouts')}
                            className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${activeTab === 'layouts' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-brand-text-muted hover:bg-white/5 hover:text-brand-text'}`}
                        >
                            <UI_ICONS.LayersIcon className="w-4 h-4" />
                            <span className="text-sm font-bold">Layouts</span>
                        </button>
                        
                        {isAdmin && (
                            <div className="mt-auto pt-6 border-t border-white/5">
                                <button 
                                    onClick={() => setActiveTab('admin')}
                                    className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-300 ${activeTab === 'admin' ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-brand-text-muted hover:bg-white/5 hover:text-brand-text'}`}
                                >
                                    <UI_ICONS.SettingsIcon className="w-4 h-4" />
                                    <span className="text-sm font-bold">Administração</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-black/10">
                        {activeTab === 'profile' && (
                            <div className="max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                                        <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-widest">Informações de Login</label>
                                        <div className="space-y-1">
                                            <p className="text-sm text-brand-text-muted">Usuário / E-mail</p>
                                            <p className="text-lg font-bold text-brand-text">{username}</p>
                                        </div>
                                        <div className="pt-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAdmin ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' : 'bg-white/10 text-white/60 border border-white/10'}`}>
                                                {isAdmin ? 'Administrador' : 'Membro'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                                        <label className="text-[10px] uppercase text-brand-text-muted font-bold tracking-widest">Dados de Nascimento</label>
                                        <div className="space-y-1">
                                            <p className="text-sm text-brand-text-muted">Data e Hora</p>
                                            <p className="text-lg font-bold text-brand-text">
                                                {natalDate ? new Date(natalDate).toLocaleDateString('pt-BR') : 'Não definida'} 
                                                {natalTime ? ` às ${natalTime}` : ''}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={onEditNatal}
                                            className="text-xs text-brand-purple font-bold hover:underline"
                                        >
                                            Editar Dados Natal
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-brand-purple/5 border border-brand-purple/10 p-8 rounded-[2rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:bg-brand-purple/20"></div>
                                    <h3 className="text-xl font-bold text-brand-text mb-2">Sua Jornada Estelar</h3>
                                    <p className="text-sm text-brand-text-muted leading-relaxed max-w-md">
                                        Bem-vindo ao seu santuário pessoal. Aqui você gerencia sua conexão com o cosmos e personaliza sua experiência no Cronógrafo Sideral.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'maps' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                {savedMaps.map(map => (
                                    <div key={map.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all duration-300 group cursor-pointer">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-brand-purple/20 rounded-xl text-brand-purple">
                                                <UI_ICONS.BookIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-brand-text-muted hover:text-brand-text"><UI_ICONS.OrbitIcon className="w-4 h-4" /></button>
                                                <button className="p-2 hover:bg-red-500/20 rounded-lg text-brand-text-muted hover:text-red-400"><UI_ICONS.CloseIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-brand-text">{map.name}</h4>
                                        <p className="text-xs text-brand-text-muted mt-1">{new Date(map.date).toLocaleDateString('pt-BR')} • {map.time}</p>
                                    </div>
                                ))}
                                <button className="border-2 border-dashed border-white/10 p-5 rounded-3xl flex flex-col items-center justify-center gap-2 text-brand-text-muted hover:border-brand-purple/50 hover:text-brand-purple transition-all duration-300">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">+</div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Novo Mapa</span>
                                </button>
                            </div>
                        )}

                        {activeTab === 'layouts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                                {savedLayouts.map(layout => (
                                    <div key={layout.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:bg-white/10 transition-all duration-300 group cursor-pointer">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 bg-brand-orange/20 rounded-xl text-brand-orange">
                                                <UI_ICONS.LayersIcon className="w-5 h-5" />
                                            </div>
                                            <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg text-brand-text-muted hover:text-brand-text">
                                                <UI_ICONS.SparklesIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="font-bold text-brand-text">{layout.name}</h4>
                                        <p className="text-xs text-brand-text-muted mt-1">{layout.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'admin' && isAdmin && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-brand-purple/10 border border-brand-purple/20 p-6 rounded-3xl">
                                        <p className="text-[10px] uppercase text-brand-purple font-bold tracking-widest mb-1">Total de Usuários</p>
                                        <p className="text-3xl font-bold text-white">{adminStats?.totalUsers || 0}</p>
                                    </div>
                                    <div className="bg-brand-orange/10 border border-brand-orange/20 p-6 rounded-3xl">
                                        <p className="text-[10px] uppercase text-brand-orange font-bold tracking-widest mb-1">Sessões Ativas</p>
                                        <p className="text-3xl font-bold text-white">{adminStats?.activeSessions || 0}</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
                                    <div className="p-4 border-b border-white/5 bg-white/5">
                                        <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">Gestão de Usuários</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-[10px] uppercase text-brand-text-muted font-bold tracking-widest border-b border-white/5">
                                                <tr>
                                                    <th className="p-4">Usuário / E-mail</th>
                                                    <th className="p-4">Função</th>
                                                    <th className="p-4">Cadastro</th>
                                                    <th className="p-4 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {loadingAdmin ? (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-brand-text-muted">Carregando dados...</td>
                                                    </tr>
                                                ) : adminStats?.users.map((user, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-4 font-bold text-brand-text">{user.username}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-white/10 text-white/60'}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs text-brand-text-muted">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                                                        <td className="p-4 text-right">
                                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-brand-text-muted hover:text-red-400 transition-colors">
                                                                <UI_ICONS.CloseIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
