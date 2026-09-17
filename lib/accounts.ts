import { signInAnonymously, type User } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
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

function accountFromDocument(document: { id: string; data: () => Record<string, unknown> }): Account {
  const data = document.data();
  return {
    id: document.id,
    vehicle: String(data.vehicle || ""),
    plateNumber: data.plateNumber ? String(data.plateNumber) : null,
    easytripAccount: data.easytripAccount ? String(data.easytripAccount) : null,
    autosweepAccount: data.autosweepAccount ? String(data.autosweepAccount) : null,
    imageUrl: data.imageUrl ? String(data.imageUrl) : null,
  };
}

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
  let snapshot = await getDocs(collection(db, "vehicles"));

  // Move records created by the earlier private-per-browser version into the
  // global collection. Deterministic document IDs prevent duplicate migration.
  const legacySnapshot = await getDocs(collection(db, "users", user.uid, "vehicles"));
  if (!legacySnapshot.empty) {
    const sharedIds = new Set(snapshot.docs.map((documentSnapshot) => documentSnapshot.id));
    const documentsToMigrate = legacySnapshot.docs.filter(
      (documentSnapshot) => !sharedIds.has(documentSnapshot.id),
    );

    if (documentsToMigrate.length > 0) {
      await Promise.all(documentsToMigrate.map((documentSnapshot) => {
        const account = accountFromDocument(documentSnapshot);
        return setDoc(doc(db, "vehicles", documentSnapshot.id), {
          vehicle: account.vehicle,
          plateNumber: account.plateNumber,
          easytripAccount: account.easytripAccount,
          autosweepAccount: account.autosweepAccount,
          imageUrl: account.imageUrl,
        });
      }));
      snapshot = await getDocs(collection(db, "vehicles"));
    }
  }

  if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
  return snapshot.docs.map(accountFromDocument);
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  await getUser();
  const { db } = getFirebaseServices();
  const document = await addDoc(collection(db, "vehicles"), input);
  return { id: document.id, ...input };
}

export async function deleteAccount(accountId: string): Promise<void> {
  await getUser();
  const { db } = getFirebaseServices();
  await deleteDoc(doc(db, "vehicles", accountId));
}

export async function updateAccount(accountId: string, input: CreateAccountInput): Promise<Account> {
  await getUser();
  const { db } = getFirebaseServices();
  await updateDoc(doc(db, "vehicles", accountId), input);
  return { id: accountId, ...input };
}
