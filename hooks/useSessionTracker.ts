import { useEffect } from 'react';
import { startUserSession, heartbeatUserSession } from '../lib/firebase';

/**
 * Registra o acesso (uma sessão por abertura do app) e o tempo de uso com a aba visível.
 * Grava a cada minuto e quando a aba fica oculta. userId nulo = não registra.
 */
export function useSessionTracker(userId: string | null) {
  useEffect(() => {
    if (!userId) return;
    let sessionId: string | null = null;
    let cancelled = false;
    let visibleSince: number | null = document.hidden ? null : Date.now();
    let pendingMs = 0;

    const collect = () => {
      if (visibleSince !== null) {
        const now = Date.now();
        pendingMs += now - visibleSince;
        visibleSince = document.hidden ? null : now;
      }
    };

    const flush = () => {
      collect();
      const secs = Math.floor(pendingMs / 1000);
      if (!sessionId || secs < 1) return;
      pendingMs -= secs * 1000;
      heartbeatUserSession(userId, sessionId, secs);
    };

    startUserSession(userId).then(id => {
      if (cancelled) return;
      sessionId = id;
    });

    const timer = window.setInterval(flush, 60000);
    const onVis = () => {
      if (document.hidden) flush();
      else visibleSince = Date.now();
    };
    const onHide = () => flush();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);

    return () => {
      flush();
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
    };
  }, [userId]);
}
