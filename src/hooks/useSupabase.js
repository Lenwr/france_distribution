import { firebaseApp, firebaseAuth } from "../services/firebaseClient.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  limit,
  writeBatch,
} from "../services/dataStore.js";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { localMode, localDatabase } from "../services/dataStore.js";

export const firestore = localMode ? localDatabase : firebaseApp ? getFirestore(firebaseApp) : null;
if (!localMode && firestore && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
}
export { firebaseApp, firebaseAuth };

const idFieldByCollection = {
  articles: "idArticle",
  commandes: "idCommande",
  ventes: "id",
  ventes_details: "id",
  commandes_historique: "id",
  profiles: "id",
};

const mapFirebaseUser = (user) => {
  if (!user) return null;

  return {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    Email: user.email,
    displayName: user.displayName,
  };
};

const waitForAuthUser = async () => {
  if (typeof firebaseAuth.authStateReady === "function") {
    await firebaseAuth.authStateReady();
    return firebaseAuth.currentUser;
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

const normalizeDoc = (collectionName, snapshot) => {
  const data = snapshot.data() || {};
  const idField = idFieldByCollection[collectionName];

  return {
    ...data,
    ...(idField ? { [idField]: data[idField] || snapshot.id } : {}),
    id: snapshot.id,
  };
};

const normalizeInsertPayload = (collectionName, payload, generatedId) => {
  const idField = idFieldByCollection[collectionName];
  const normalized = { ...payload };

  if (idField && !normalized[idField]) {
    normalized[idField] = generatedId;
  }

  if (!normalized.id) {
    normalized.id = generatedId;
  }

  return normalized;
};

class FirestoreQueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filters = [];
    this.operation = "select";
    this.payload = null;
    this.singleResult = false;
  }

  select() {
    this.operation = this.operation || "select";
    return this;
  }

  insert(payload) {
    this.operation = "insert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  update(payload) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  upsert(payload) {
    this.operation = "upsert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  eq(field, value) {
    this.filters.push({ field, value });
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      if (this.operation === "insert") return await this.executeInsert();
      if (this.operation === "update") return await this.executeUpdate();
      if (this.operation === "delete") return await this.executeDelete();
      if (this.operation === "upsert") return await this.executeUpsert();
      return await this.executeSelect();
    } catch (error) {
      return { data: null, error };
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async getMatchingDocs() {
    const idFilter = this.filters.find(({ field }) => field === "id");
    let snapshots;
    if (idFilter) {
      if (typeof idFilter.value !== "string" || !idFilter.value) {
        throw new Error("Identifiant de document invalide.");
      }
      const snapshot = await getDoc(doc(firestore, this.collectionName, idFilter.value));
      snapshots = snapshot.exists() ? [snapshot] : [];
    } else {
      const constraints = this.filters.map(({ field, value }) => where(field, "==", value));
      if (this.singleResult) constraints.push(limit(2));
      const result = await getDocs(query(collection(firestore, this.collectionName), ...constraints));
      snapshots = result.docs;
    }
    return snapshots
      .map((snapshot) => ({ snapshot, data: normalizeDoc(this.collectionName, snapshot) }))
      .filter(({ data }) => this.filters.every(({ field, value }) => data[field] === value));
  }

  async executeSelect() {
    const matches = await this.getMatchingDocs();
    const rows = matches.map(({ data }) => data);

    if (this.singleResult) {
      if (rows.length === 0) {
        return {
          data: null,
          error: { code: "PGRST116", message: "Document introuvable" },
        };
      }

      if (rows.length > 1) throw new Error("Plusieurs documents correspondent à cette recherche.");
      return { data: rows[0], error: null };
    }

    return { data: rows, error: null };
  }

  async executeInsert() {
    const batch = writeBatch(firestore);
    const rows = this.payload.map((payload) => {
      const ref = doc(collection(firestore, this.collectionName));
      const normalized = normalizeInsertPayload(this.collectionName, payload, ref.id);
      batch.set(ref, normalized);
      return normalized;
    });
    await batch.commit();
    return { data: this.singleResult ? rows[0] : rows, error: null };
  }

  async executeUpsert() {
    const batch = writeBatch(firestore);
    const rows = this.payload.map((payload) => {
      const id = payload.id || payload.uid;
      const ref = id ? doc(firestore, this.collectionName, id) : doc(collection(firestore, this.collectionName));
      const normalized = normalizeInsertPayload(this.collectionName, payload, ref.id);
      batch.set(ref, normalized, { merge: true });
      return normalized;
    });
    await batch.commit();
    return { data: this.singleResult ? rows[0] : rows, error: null };
  }

  async executeUpdate() {
    if (!this.filters.length) throw new Error("Une modification doit cibler un document.");
    const matches = await this.getMatchingDocs();
    if (!matches.length) throw new Error("Document introuvable.");
    const rows = [];

    for (const { snapshot, data } of matches) {
      await updateDoc(doc(firestore, this.collectionName, snapshot.id), this.payload);
      rows.push({ ...data, ...this.payload });
    }

    return { data: this.singleResult ? rows[0] || null : rows, error: null };
  }

  async executeDelete() {
    if (!this.filters.length) throw new Error("Une suppression doit cibler un document.");
    const matches = await this.getMatchingDocs();

    for (const { snapshot } of matches) {
      await deleteDoc(doc(firestore, this.collectionName, snapshot.id));
    }

    return { data: null, error: null };
  }
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }) {
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        return { data: { user: mapFirebaseUser(credential.user) }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },

    async signOut() {
      try {
        await signOut(firebaseAuth);
        return { error: null };
      } catch (error) {
        return { error };
      }
    },

    async getUser() {
      const user = await waitForAuthUser();

      return {
        data: { user: mapFirebaseUser(user) },
        error: null,
      };
    },

    onAuthStateChange(callback) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        callback("auth_state_changed", { user: mapFirebaseUser(user) });
      });

      return { data: { subscription: { unsubscribe } } };
    },
  },

  from(collectionName) {
    return new FirestoreQueryBuilder(collectionName);
  },

  async getDocument(collectionName, id) {
    const snapshot = await getDoc(doc(firestore, collectionName, id));
    return snapshot.exists() ? normalizeDoc(collectionName, snapshot) : null;
  },
};
