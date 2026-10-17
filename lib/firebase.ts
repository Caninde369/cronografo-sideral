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
  increment
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
      return updatedUserDoc;
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
