/**
 * Janela do Calendário Arcano (Calculadora Arcana) — abre por cima do Cronógrafo,
 * pelo botão "Calendário Arcano" da sidebar.
 *
 * - A calculadora é carregada sob demanda (só baixa quando a janela abre).
 * - Abre na data do relógio do Cronógrafo.
 * - Esc ou clique fora fecham.
 */
import React, { Suspense, lazy, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ArcaneCalendarApp = lazy(() => import('./arcana/ArcaneCalendarApp'));

interface ArcaneCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Data do relógio do Cronógrafo */
    referenceDate?: Date;
}

export const ArcaneCalendarModal: React.FC<ArcaneCalendarModalProps> = ({ isOpen, onClose, referenceDate }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            // Se a carta ampliada estiver aberta, o Esc não fecha a janela inteira
            if (document.getElementById('btn-close-modal')) return;
            onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm sm:p-3"
            onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-label="Calendário Arcano"
        >
            <div
                className="relative w-full h-full sm:max-w-[1400px] sm:h-[calc(100vh-24px)] sm:rounded-2xl overflow-hidden border-0 sm:border sm:border-amber-500/30 shadow-[0_24px_80px_rgba(0,0,0,0.85)] bg-black"
                style={{ animation: 'arcane-modal-in 160ms ease-out' }}
            >
                <Suspense
                    fallback={
                        <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-sans">
                            Carregando o Calendário Arcano…
                        </div>
                    }
                >
                    <ArcaneCalendarApp initialDate={referenceDate} onClose={onClose} />
                </Suspense>
            </div>
            <style>{`@keyframes arcane-modal-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>,
        document.body
    );
};

export default ArcaneCalendarModal;
