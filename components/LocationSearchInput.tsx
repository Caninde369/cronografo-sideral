import React, { useState, useRef, useEffect } from 'react';
import { useLocationSearch, LocationResult } from '../hooks/useLocationSearch';

interface LocationSearchInputProps {
    value: string;
    onChange: (location: LocationResult) => void;
    placeholder?: string;
    theme?: 'dark' | 'light';
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
    value,
    onChange,
    placeholder = 'Buscar cidade...',
    theme = 'dark',
}) => {
    const [query, setQuery] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { results, isLoading, error } = useLocationSearch(query);

    // Atualizar input se value externo mudar
    useEffect(() => {
        if (value && value !== query) setQuery(value);
    }, [value]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Abrir dropdown quando há resultados
    useEffect(() => {
        if (results.length > 0) {
            setIsOpen(true);
            setActiveIndex(-1);
        } else {
            setIsOpen(false);
        }
    }, [results]);

    const handleSelect = (result: LocationResult) => {
        // Extrair nome curto: cidade + país (primeiros dois segmentos)
        const parts = result.displayName.split(', ');
        const shortName = parts.length >= 2
            ? `${parts[0]}, ${parts[parts.length - 1]}`
            : result.displayName;
        setQuery(shortName);
        setIsOpen(false);
        onChange({ ...result, displayName: shortName });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(results[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const isDark = theme === 'dark';

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setIsOpen(false);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                    className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${
                        isDark
                            ? 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[#F5F2EB] placeholder-[#6B7280] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30'
                            : 'bg-[rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.12)] text-[#1a2e44] placeholder-[#9CA3AF] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/20'
                    }`}
                />
                {/* Ícone de loading ou busca */}
                <div style={{
                    position: 'absolute', right: '10px', top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none'
                }}>
                    {isLoading ? (
                        <div style={{
                            width: '14px', height: '14px',
                            border: '1.5px solid rgba(139,92,246,0.3)',
                            borderTopColor: '#8B5CF6',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <circle cx="7" cy="7" r="5" stroke="#6B7280" strokeWidth="1.5"/>
                            <path d="M11 11L14 14" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    )}
                </div>
            </div>

            {/* Dropdown de resultados */}
            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0, right: 0,
                    zIndex: 9999,
                    borderRadius: '10px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    border: isDark
                        ? '0.5px solid rgba(245,242,235,0.10)'
                        : '0.5px solid rgba(53,81,112,0.15)',
                    background: isDark ? '#080810' : '#f8f6f1',
                }}>
                    {results.map((result, i) => {
                        const parts = result.displayName.split(', ');
                        const city = parts[0];
                        const country = parts[parts.length - 1];
                        const region = parts.length > 2 ? parts.slice(1, -1).join(', ') : '';

                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(result)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    background: activeIndex === i
                                        ? (isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)')
                                        : 'transparent',
                                    border: 'none',
                                    borderBottom: i < results.length - 1
                                        ? (isDark ? '0.5px solid rgba(255,255,255,0.05)' : '0.5px solid rgba(0,0,0,0.06)')
                                        : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={() => setActiveIndex(i)}
                            >
                                <span style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: isDark ? '#F5F2EB' : '#1a2e44',
                                    lineHeight: 1.3,
                                }}>
                                    {city}
                                    <span style={{
                                        fontWeight: 400,
                                        color: isDark ? '#8B5CF6' : '#6B5CF6',
                                        marginLeft: '6px',
                                        fontSize: '12px',
                                    }}>
                                        {country}
                                    </span>
                                </span>
                                {region && (
                                    <span style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: '11px',
                                        fontWeight: 400,
                                        color: isDark ? '#6B7280' : '#9CA3AF',
                                        marginTop: '2px',
                                        lineHeight: 1.3,
                                    }}>
                                        {region}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Erro */}
            {error && (
                <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '11px',
                    color: '#EF4444',
                    marginTop: '4px',
                }}>
                    {error}
                </p>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
