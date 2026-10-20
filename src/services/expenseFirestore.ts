import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FinanceItem } from '../types/finance';
import { INITIAL_FINANCE_ITEMS } from '../data/seedData';

export interface UserProfileData {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  budgetLimit: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscribes to real-time updates for a specific user's private expenses collection.
 */
export function subscribeToUserExpenses(
  userId: string,
  onData: (items: FinanceItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const collectionPath = `users/${userId}/expenses`;
  const expensesRef = collection(db, 'users', userId, 'expenses');

  return onSnapshot(
    expensesRef,
    (snapshot) => {
      const items: FinanceItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          userId: data.userId || userId,
          name: data.name || '',
          type: data.type || 'subscription',
          amount: typeof data.amount === 'number' ? data.amount : 0,
          billingCycle: data.billingCycle || 'monthly',
          category: data.category || 'Personal',
          paymentMethod: data.paymentMethod || 'UPI',
          renewalDate: data.renewalDate || new Date().toISOString().split('T')[0],
          isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
          autoRenew: typeof data.autoRenew === 'boolean' ? data.autoRenew : false,
          notes: data.notes || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, collectionPath);
      if (onError) onError(error);
    }
  );
}

/**
 * Creates or updates an expense item in the user's private subcollection.
 */
export async function saveExpenseItem(userId: string, item: FinanceItem): Promise<void> {
  const docPath = `users/${userId}/expenses/${item.id}`;
  try {
    const itemRef = doc(db, 'users', userId, 'expenses', item.id);
    const now = new Date().toISOString();
    
    // Sanitize payload strictly adhering to schema constraints
    const cleanItem = {
      id: item.id,
      userId,
      name: item.name.slice(0, 100),
      type: item.type,
      amount: Math.max(0, item.amount),
      billingCycle: item.billingCycle,
      category: item.category,
      paymentMethod: item.paymentMethod,
      renewalDate: item.renewalDate.slice(0, 32),
      isActive: Boolean(item.isActive),
      autoRenew: Boolean(item.autoRenew),
      notes: (item.notes || '').slice(0, 500),
      tags: (item.tags || []).slice(0, 10).map((t) => t.slice(0, 30)),
      createdAt: item.createdAt || now,
      updatedAt: now,
    };

    await setDoc(itemRef, cleanItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Deletes an expense item from the user's private subcollection.
 */
export async function deleteExpenseItem(userId: string, itemId: string): Promise<void> {
  const docPath = `users/${userId}/expenses/${itemId}`;
  try {
    const itemRef = doc(db, 'users', userId, 'expenses', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Subscribes to real-time updates for a user's profile and budget preferences.
 */
export function subscribeToUserProfile(
  userId: string,
  onData: (profile: UserProfileData | null) => void,
  onError?: (err: unknown) => void
): () => void {
  const docPath = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);

  return onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfileData;
        onData(data);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
      if (onError) onError(error);
    }
  );
}

/**
 * Saves or updates user profile and budget preferences.
 */
export async function saveUserProfile(
  userId: string,
  profile: { email: string; displayName?: string; photoURL?: string; budgetLimit: number }
): Promise<void> {
  const docPath = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    const now = new Date().toISOString();

    const payload: UserProfileData = {
      userId,
      email: profile.email.slice(0, 256),
      displayName: (profile.displayName || '').slice(0, 100),
      photoURL: (profile.photoURL || '').slice(0, 1000),
      budgetLimit: Math.max(1, profile.budgetLimit),
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Seeds initial sample data for a brand-new user so their dashboard is immediately useful,
 * or resets user data when requested.
 */
export async function seedUserInitialData(userId: string): Promise<void> {
  const collectionPath = `users/${userId}/expenses`;
  try {
    for (const item of INITIAL_FINANCE_ITEMS) {
      const itemRef = doc(db, 'users', userId, 'expenses', item.id);
      const cleanItem = {
        ...item,
        userId,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(itemRef, cleanItem);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}
