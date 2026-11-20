import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  collection, 
  query, 
  getDocs, 
  deleteDoc,
  onSnapshot,
  increment,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client offline, operating with local cache if available.");
    }
  }
}

// Helper to ensure user doc exists and logs login activity in Firestore
export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    const now = new Date().toISOString();
    const todayStr = new Date().toISOString().split('T')[0];
    const isAdminUser = user.email?.toLowerCase() === 'rafael.cm333@gmail.com';

    if (!userDoc.exists()) {
      const newUserDoc = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Astrólogo',
        photoURL: user.photoURL || '',
        role: isAdminUser ? 'admin' : 'user',
        plan: isAdminUser ? 'lifetime' : 'free',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        lastLoginDate: todayStr,
        loginCount: 1,
        totalActiveTimeSeconds: 0
      };
      await setDoc(userRef, newUserDoc);
      return newUserDoc;
    } else {
      const data = userDoc.data() || {};
      const currentCount = typeof data.loginCount === 'number' ? data.loginCount : 0;
      const existingTotalTime = typeof data.totalActiveTimeSeconds === 'number' ? data.totalActiveTimeSeconds : 0;
      const updatedUserDoc = {
        uid: user.uid,
        email: user.email || data.email || '',
        displayName: user.displayName || data.displayName || user.email?.split('@')[0] || 'Astrólogo',
        photoURL: user.photoURL || data.photoURL || '',
        role: data.role || (isAdminUser ? 'admin' : 'user'),
        plan: isAdminUser ? 'lifetime' : (data.plan || 'free'),
        createdAt: data.createdAt || now,
        updatedAt: now,
        lastLoginAt: now,
        lastLoginDate: todayStr,
        loginCount: currentCount + 1,
        totalActiveTimeSeconds: existingTotalTime
      };
      await setDoc(userRef, updatedUserDoc, { merge: true });
      // Campos que só o admin grava: lidos aqui, nunca escritos pelo usuário
      return {
        ...updatedUserDoc,
        blocked: data.blocked === true,
        planExpiresAt: typeof data.planExpiresAt === 'string' ? data.planExpiresAt : '',
        billing: data.billing === 'annual' ? 'annual' : 'monthly',
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    return null;
  }
}

// Update user plan in Firestore
export async function updateUserPlanInFirestore(userId: string, plan: 'free' | 'monthly' | 'lifetime'): Promise<void> {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      plan,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('Failed to update plan in Firestore', error);
    return;
  }
  // Mantém o contador de vagas do Vitalício sempre real (só o admin consegue gravar)
  await refreshLifetimeSoldCount();
}

// ─── Vagas do plano Vitalício ────────────────────────────────────────────────
// Documento público config/lifetime = { sold, total, updatedAt }.
// Leitura: qualquer pessoa. Escrita: só o admin (ver firestore.rules).

const LIFETIME_DOC = () => doc(db, 'config', 'lifetime');
const ADMIN_EMAIL = 'rafael.cm333@gmail.com';

/** Quantas vagas do Vitalício já foram vendidas (null se não for possível ler). */
export async function getLifetimeSoldCount(): Promise<number | null> {
  try {
    const snap = await getDoc(LIFETIME_DOC());
    if (!snap.exists()) return 0;
    const sold = snap.data()?.sold;
    return typeof sold === 'number' && sold >= 0 ? sold : 0;
  } catch (error) {
    console.warn('Não foi possível ler as vagas do Vitalício', error);
    return null;
  }
}

/**
 * Reconta os usuários com plano Vitalício (sem contar o admin) e grava em config/lifetime.
 * Só funciona para o admin; para os demais, falha em silêncio.
 */
export async function refreshLifetimeSoldCount(total = 21): Promise<number | null> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('plan', '==', 'lifetime')));
    const sold = snap.docs.filter(d => {
      const data = d.data() as { email?: string; role?: string };
      return (data.email || '').toLowerCase() !== ADMIN_EMAIL && data.role !== 'admin';
    }).length;
    await setDoc(LIFETIME_DOC(), { sold, total, updatedAt: new Date().toISOString() });
    return sold;
  } catch (error) {
    console.warn('Não foi possível atualizar as vagas do Vitalício', error);
    return null;
  }
}

// Update daily trial used seconds and total active usage time in Firestore
export async function updateUserDailyTrial(userId: string, usedSecondsToday: number, incrementTotalSeconds: number = 0) {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const payload: any = {
      trialUsedToday: usedSecondsToday,
      lastLoginDate: todayStr,
      updatedAt: new Date().toISOString()
    };
    if (incrementTotalSeconds > 0) {
      payload.totalActiveTimeSeconds = increment(incrementTotalSeconds);
    }
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    // Non-fatal, fallback to local storage
  }
}

// ─── Histórico de acessos ────────────────────────────────────────────────────
// users/{uid}/sessions/{sessionId} = { start, lastSeen, seconds }
// Cada abertura do app (com login) é uma sessão. "seconds" soma só o tempo com a aba visível.
// O próprio usuário cria e atualiza; só o admin lê (ver firestore.rules).

export async function startUserSession(userId: string): Promise<string | null> {
  if (!userId) return null;
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId), { start: now, lastSeen: now, seconds: 0 });
    return sessionId;
  } catch (error) {
    console.warn('Não foi possível registrar a sessão', error);
    return null;
  }
}

export async function heartbeatUserSession(userId: string, sessionId: string, addSeconds: number): Promise<void> {
  if (!userId || !sessionId) return;
  const add = Math.max(0, Math.min(3600, Math.round(addSeconds)));
  const now = new Date().toISOString();
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', sessionId), { lastSeen: now, seconds: increment(add) }, { merge: true });
    if (add > 0) {
      await setDoc(doc(db, 'users', userId), { totalActiveTimeSeconds: increment(add), updatedAt: now }, { merge: true });
    }
  } catch {
    // não fatal
  }
}

export interface UserSession { id: string; start: string; lastSeen: string; seconds: number }

export async function getUserSessionsForAdmin(userId: string, max = 60): Promise<UserSession[]> {
  try {
    const q = query(collection(db, 'users', userId, 'sessions'), orderBy('start', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<UserSession, 'id'>) }));
  } catch (error) {
    console.warn('Não foi possível ler as sessões', error);
    return [];
  }
}

// ─── Controles do admin ──────────────────────────────────────────────────────
// blocked: conta sem acesso ao app. planExpiresAt (AAAA-MM-DD), billing ('monthly' | 'annual'), adminNote.
// Só o admin grava esses campos (ver firestore.rules).

export async function setUserBlockedInFirestore(userId: string, blocked: boolean): Promise<boolean> {
  try {
    await setDoc(doc(db, 'users', userId), { blocked, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (error) {
    console.warn('Não foi possível alterar o bloqueio', error);
    return false;
  }
}

export async function updateUserAdminMeta(
  userId: string,
  meta: { planExpiresAt?: string; billing?: 'monthly' | 'annual'; adminNote?: string }
): Promise<boolean> {
  const payload: Record<string, any> = { updatedAt: new Date().toISOString() };
  if (meta.planExpiresAt !== undefined) payload.planExpiresAt = meta.planExpiresAt;
  if (meta.billing !== undefined) payload.billing = meta.billing;
  if (meta.adminNote !== undefined) payload.adminNote = meta.adminNote.slice(0, 1000);
  try {
    await setDoc(doc(db, 'users', userId), payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Não foi possível salvar os dados do admin', error);
    return false;
  }
}

// Get all users for admin view
export async function getAllUsersForAdmin(): Promise<any[]> {
  try {
    const usersColl = collection(db, 'users');
    const snap = await getDocs(usersColl);
    return snap.docs.map(doc => doc.data());
  } catch (error) {
    console.warn('Error fetching all users for admin', error);
    return [];
  }
}

// Subscribe to real-time updates of all users for admin
export function subscribeToAllUsersForAdmin(onUpdate: (users: any[]) => void, onError?: (err: any) => void): () => void {
  try {
    const usersColl = collection(db, 'users');
    return onSnapshot(
      usersColl,
      (snap) => {
        const users = snap.docs.map(doc => doc.data());
        onUpdate(users);
      },
      (error) => {
        console.warn('Live subscription to users failed', error);
        onError?.(error);
      }
    );
  } catch (err) {
    console.warn('Failed to attach users listener', err);
    onError?.(err);
    return () => {};
  }
}

// User Profile Update in Firestore
export async function updateUserProfileData(userId: string, data: { displayName?: string; photoURL?: string }) {
  if (!userId) return;
  const userRef = doc(db, 'users', userId);
  const now = new Date().toISOString();
  try {
    await setDoc(userRef, {
      ...data,
      updatedAt: now
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

// Save Map to Firestore
export async function saveMapToFirestore(userId: string, mapData: any) {
  if (!userId) return;
  const mapId = mapData.id || Date.now().toString();
  const mapRef = doc(db, 'users', userId, 'savedMaps', mapId);
  const now = new Date().toISOString();
  try {
    const sanitizedData: any = {
      id: mapId,
      userId,
      name: mapData.name || 'Sem título',
      createdAt: mapData.createdAt || now,
      updatedAt: now
    };
    if (mapData.description) sanitizedData.description = mapData.description;
    if (mapData.targetDate) sanitizedData.targetDate = mapData.targetDate;
    if (mapData.natalDate) sanitizedData.natalDate = mapData.natalDate;
    if (mapData.layout) sanitizedData.layout = mapData.layout;
    if (mapData.location) sanitizedData.location = mapData.location;
    if (mapData.natalLocation) sanitizedData.natalLocation = mapData.natalLocation;

    await setDoc(mapRef, sanitizedData);
    return mapId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/savedMaps/${mapId}`);
  }
}

// Load Maps from Firestore
export async function loadMapsFromFirestore(userId: string) {
  if (!userId) return [];
  try {
    const mapsColl = collection(db, 'users', userId, 'savedMaps');
    const snap = await getDocs(mapsColl);
    return snap.docs.map(doc => doc.data());
  } catch (error) {
    console.warn('Error loading maps from Firestore, fallback to local', error);
    return [];
  }
}

// Delete Map from Firestore
export async function deleteMapFromFirestore(userId: string, mapId: string) {
  if (!userId || !mapId) return;
  try {
    const mapRef = doc(db, 'users', userId, 'savedMaps', mapId);
    await deleteDoc(mapRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/savedMaps/${mapId}`);
  }
}

// Save Layout to Firestore
export async function saveLayoutToFirestore(userId: string, layoutData: any) {
  if (!userId) return;
  const layoutId = layoutData.id || Date.now().toString();
  const layoutRef = doc(db, 'users', userId, 'savedLayouts', layoutId);
  const now = new Date().toISOString();
  try {
    const sanitizedData: any = {
      id: layoutId,
      userId,
      name: layoutData.name || 'Sem título',
      createdAt: layoutData.createdAt || now,
      updatedAt: now
    };
    if (layoutData.description) sanitizedData.description = layoutData.description;
    if (layoutData.layout) sanitizedData.layout = layoutData.layout;

    await setDoc(layoutRef, sanitizedData);
    return layoutId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/savedLayouts/${layoutId}`);
  }
}

// Load Layouts from Firestore
export async function loadLayoutsFromFirestore(userId: string) {
  if (!userId) return [];
  try {
    const layoutsColl = collection(db, 'users', userId, 'savedLayouts');
    const snap = await getDocs(layoutsColl);
    return snap.docs.map(doc => doc.data());
  } catch (error) {
    console.warn('Error loading layouts from Firestore, fallback to local', error);
    return [];
  }
}

// Delete Layout from Firestore
export async function deleteLayoutFromFirestore(userId: string, layoutId: string) {
  if (!userId || !layoutId) return;
  try {
    const layoutRef = doc(db, 'users', userId, 'savedLayouts', layoutId);
    await deleteDoc(layoutRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/savedLayouts/${layoutId}`);
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
};

// ─── Teste grátis de 7 horas ─────────────────────────────────────────────────
// trials/{uid} = { startedAt, lastBeat, usedSeconds, day, daySeconds, extraSeconds }
// Quem conta é o servidor (firestore.rules): cada batida soma 60s, no máximo uma por minuto.
export interface TrialDoc {
  uid: string;
  startedAt: Date | null;
  lastBeat: Date | null;
  usedSeconds: number;
  day: string;
  daySeconds: number;
  extraSeconds: number;
}
const TRIAL_DOC = (uid: string) => doc(db, 'trials', uid);
const toDate = (v: any): Date | null => (v instanceof Timestamp ? v.toDate() : v && typeof v.toDate === 'function' ? v.toDate() : null);
const parseTrial = (uid: string, d: any): TrialDoc => ({
  uid,
  startedAt: toDate(d?.startedAt),
  lastBeat: toDate(d?.lastBeat),
  usedSeconds: Number(d?.usedSeconds) || 0,
  day: typeof d?.day === 'string' ? d.day : '',
  daySeconds: Number(d?.daySeconds) || 0,
  extraSeconds: Number(d?.extraSeconds) || 0,
});
/** Dia local no formato AAAA-MM-DD (para o "hoje" do teste). */
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Acompanha o teste da conta. null = ainda não existe. */
export function subscribeTrial(uid: string, onUpdate: (t: TrialDoc | null) => void, onError?: (e: any) => void): () => void {
  try {
    return onSnapshot(TRIAL_DOC(uid), snap => onUpdate(snap.exists() ? parseTrial(uid, snap.data()) : null), e => { console.warn('Teste: leitura falhou', e); onError?.(e); });
  } catch (e) { onError?.(e); return () => {}; }
}

/** Começa o teste (uma vez por conta). */
export async function startTrialInFirestore(uid: string): Promise<boolean> {
  try {
    await setDoc(TRIAL_DOC(uid), { startedAt: serverTimestamp(), lastBeat: serverTimestamp(), usedSeconds: 0, day: localDay(), daySeconds: 0, extraSeconds: 0 });
    return true;
  } catch (e) { console.warn('Teste: não foi possível começar', e); return false; }
}

/** Soma 1 minuto de uso. O servidor recusa se ainda não passou 1 minuto da batida anterior. */
export async function trialBeat(uid: string, previousDay: string): Promise<boolean> {
  const day = localDay();
  try {
    await updateDoc(TRIAL_DOC(uid), {
      usedSeconds: increment(60),
      lastBeat: serverTimestamp(),
      day,
      daySeconds: day === previousDay ? increment(60) : 60,
    });
    return true;
  } catch { return false; }
}

/** Admin: todos os testes, ao vivo. */
export function subscribeAllTrialsForAdmin(onUpdate: (t: TrialDoc[]) => void, onError?: (e: any) => void): () => void {
  try {
    return onSnapshot(collection(db, 'trials'), snap => onUpdate(snap.docs.map(d => parseTrial(d.id, d.data()))), e => { console.warn('Testes: leitura falhou', e); onError?.(e); });
  } catch (e) { onError?.(e); return () => {}; }
}

/** Admin: +1 hora no teste. */
export async function adminTrialAddHour(uid: string): Promise<boolean> {
  try { await updateDoc(TRIAL_DOC(uid), { extraSeconds: increment(3600) }); return true; } catch (e) { console.warn(e); return false; }
}

/** Admin: zera o teste (7 horas e 30 dias de novo, a partir de agora). */
export async function adminTrialReset(uid: string): Promise<boolean> {
  try {
    await updateDoc(TRIAL_DOC(uid), { usedSeconds: 0, daySeconds: 0, extraSeconds: 0, startedAt: serverTimestamp(), lastBeat: serverTimestamp(), day: localDay() });
    return true;
  } catch (e) { console.warn(e); return false; }
}
