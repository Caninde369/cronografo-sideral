import { useState, useEffect, useRef } from 'react';
import { auth, updateUserDailyTrial } from '../lib/firebase';

// Contador de tempo diário removido conforme solicitação:
// O plano gratuito permite exploração contínua com recursos selecionados limitados (ano 2026, 1 exportação com marca d'água, etc.)
export const DAILY_TRIAL_DURATION_MS = 0;

export function useTrialTimer(_isAuthenticated: boolean, _userEmail?: string, _isAdmin?: boolean) {
  return {
    trialActive: false,
    isGuestExploring: false,
    timeLeft: null,
    isExpired: false,
    isUnlimited: true,
    dailyLimitMs: 0,
    usedMsToday: 0,
    formattedTimeLeft: '',
    resetTrial: () => {},
    startTrial: () => {}
  };
}
