import { signInAnonymously, type User } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebase";

export type Account = {
  id: string;
  vehicle: string;
  plateNumber: string | null;
  easytripAccount: string | null;
  autosweepAccount: string | null;
  imageUrl: string | null;
};

export type CreateAccountInput = {
  vehicle: string;
  plateNumber: string | null;
  easytripAccount: string | null;
  autosweepAccount: string | null;
  imageUrl: string | null;
};

let signInPromise: Promise<User> | null = null;

async function getUser(): Promise<User> {
  const { auth } = getFirebaseServices();
  if (auth.currentUser) return auth.currentUser;
  signInPromise ??= signInAnonymously(auth).then((credential) => credential.user);
  try {
    return await signInPromise;
  } catch (error) {
    signInPromise = null;
    throw error;
  }
}

export async function getAccounts(signal?: AbortSignal): Promise<Account[]> {
  if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
  const user = await getUser();
  const { db } = getFirebaseServices();
  const snapshot = await getDocs(collection(db, "users", user.uid, "vehicles"));

  if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      vehicle: String(data.vehicle || ""),
      plateNumber: data.plateNumber ? String(data.plateNumber) : null,
      easytripAccount: data.easytripAccount ? String(data.easytripAccount) : null,
      autosweepAccount: data.autosweepAccount ? String(data.autosweepAccount) : null,
      imageUrl: data.imageUrl ? String(data.imageUrl) : null,
    };
  });
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const user = await getUser();
  const { db } = getFirebaseServices();
  const document = await addDoc(collection(db, "users", user.uid, "vehicles"), input);
  return { id: document.id, ...input };
}

export async function deleteAccount(accountId: string): Promise<void> {
  const user = await getUser();
  const { db } = getFirebaseServices();
  await deleteDoc(doc(db, "users", user.uid, "vehicles", accountId));
}

export async function updateAccount(accountId: string, input: CreateAccountInput): Promise<Account> {
  const user = await getUser();
  const { db } = getFirebaseServices();
  await updateDoc(doc(db, "users", user.uid, "vehicles", accountId), input);
  return { id: accountId, ...input };
}
