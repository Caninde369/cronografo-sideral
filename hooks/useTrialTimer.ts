import { useState, useEffect, useRef } from 'react';

const TRIAL_DURATION_MS = 10 * 60 * 1000;

export function useTrialTimer(isAuthenticated: boolean) {
    const getInitialState = () => {
        if (typeof window === 'undefined') return { active: false, expired: false, left: null as number | null };
        const startTimeStr = localStorage.getItem('cronografo_trial_start');
        if (!startTimeStr) return { active: false, expired: false, left: null as number | null };
        const elapsed = Date.now() - parseInt(startTimeStr, 10);
        const remaining = Math.max(0, TRIAL_DURATION_MS - elapsed);
        return { active: true, expired: remaining === 0, left: remaining };
    };

    const initial = getInitialState();
    const [trialActive, setTrialActive] = useState(initial.active);
    const [timeLeft, setTimeLeft]       = useState<number | null>(initial.left);
    const [isExpired, setIsExpired]     = useState(initial.expired);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            setTrialActive(false);
            setIsExpired(false);
            setTimeLeft(null);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        if (!trialActive) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        const startTimeStr = localStorage.getItem('cronografo_trial_start');
        if (!startTimeStr) return;
        const startTime = parseInt(startTimeStr, 10);

        const tick = () => {
            const remaining = Math.max(0, TRIAL_DURATION_MS - (Date.now() - startTime));
            setTimeLeft(remaining);
            setIsExpired(remaining === 0);
            if (remaining === 0 && intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };

        tick();
        intervalRef.current = window.setInterval(tick, 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isAuthenticated, trialActive]);

    const startTrial = () => {
        if (!localStorage.getItem('cronografo_trial_start')) {
            localStorage.setItem('cronografo_trial_start', Date.now().toString());
        }
        setTrialActive(true);
        setIsExpired(false);
    };

    const resetTrial = () => {
        localStorage.removeItem('cronografo_trial_start');
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTrialActive(false);
        setIsExpired(false);
        setTimeLeft(null);
    };

    return { trialActive, timeLeft, isExpired, startTrial, resetTrial };
}
