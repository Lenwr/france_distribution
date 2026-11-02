import * as cloud from 'firebase/firestore';

export { localMode } from './appMode.js';
export const localDatabase = { local: true };
const storageKey = 'france-distribution:data:v1';
const read = () => {
  const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Les données locales sont illisibles.');
  return value;
};
const snapshot = (ref, data) => ({ id: ref.id, ref, exists: () => data !== undefined, data: () => structuredClone(data) });
export const collection = (db, name) => db?.local ? { local: true, name } : cloud.collection(db, name);
export const doc = (db, name, id) => db?.local
  ? { local: true, name: db.name || name, id: db.name ? (name || crypto.randomUUID()) : id }
  : cloud.doc(db, ...[name, id].filter(v => v !== undefined));
export const where = (...args) => ({ kind: 'where', args });
export const limit = (count) => ({ kind: 'limit', count });
export const query = (ref, ...filters) => ref.local ? { ...ref, filters } : cloud.query(ref, ...filters.map(f => f.kind === 'where' ? cloud.where(...f.args) : cloud.limit(f.count)));
export const getDoc = (ref) => ref.local ? Promise.resolve(snapshot(ref, read()[ref.name]?.[ref.id])) : cloud.getDoc(ref);
export const getDocFromServer = (ref) => ref.local ? getDoc(ref) : cloud.getDocFromServer(ref);
export const getDocs = async (ref) => {
  if (!ref.local) return cloud.getDocs(ref);
  let rows = Object.entries(read()[ref.name] || {});
  for (const f of ref.filters || []) {
    if (f.kind === 'where') rows = rows.filter(([, row]) => row[f.args[0]] === f.args[2]);
    else rows = rows.slice(0, f.count);
  }
  const docs = rows.map(([id, data]) => snapshot({ local: true, name: ref.name, id }, data));
  return { docs, size: docs.length, empty: !docs.length };
};
export const runTransaction = async (db, work) => {
  if (!db?.local) return cloud.runTransaction(db, work);
  if (!navigator.locks) throw new Error('Utilisez un navigateur récent sur localhost ou HTTPS pour enregistrer les données.');
  return navigator.locks.request(storageKey, async () => {
    const state = read();
    const transaction = {
      get: async (ref) => snapshot(ref, state[ref.name]?.[ref.id]),
      set: (ref, data, options) => {
        state[ref.name] ||= {};
        state[ref.name][ref.id] = options?.merge ? { ...state[ref.name][ref.id], ...data } : structuredClone(data);
      },
      update: (ref, data) => {
        if (!state[ref.name]?.[ref.id]) throw new Error('Document introuvable.');
        transaction.set(ref, data, { merge: true });
      },
      delete: (ref) => { if (state[ref.name]) delete state[ref.name][ref.id]; },
    };
    const result = await work(transaction);
    localStorage.setItem(storageKey, JSON.stringify(state));
    return result;
  });
};
export const updateDoc = (ref, data) => ref.local ? runTransaction(localDatabase, tx => tx.update(ref, data)) : cloud.updateDoc(ref, data);
export const deleteDoc = (ref) => ref.local ? runTransaction(localDatabase, tx => tx.delete(ref)) : cloud.deleteDoc(ref);
export const writeBatch = (db) => {
  if (!db?.local) return cloud.writeBatch(db);
  const writes = [];
  return { set: (...args) => writes.push(args), commit: () => runTransaction(db, tx => { for (const args of writes) tx.set(...args); }) };
};
