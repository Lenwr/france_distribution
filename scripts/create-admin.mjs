import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { applicationDefault, cert, initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const { values } = parseArgs({ options: {
  project: { type: 'string' }, credentials: { type: 'string' }, email: { type: 'string' },
  name: { type: 'string', default: 'Administrateur' }, help: { type: 'boolean' },
} });
if (values.help) {
  console.log('npm run setup:admin -- --project ID_PROJET --email EMAIL --credentials /chemin/hors-du-depot/service-account.json\nLe mot de passe est demandé sans être affiché. Aucun secret ne doit être ajouté au dépôt.');
  process.exit(0);
}
if (!values.project || !values.email) throw new Error('Les options --project et --email sont obligatoires. Utilisez --help.');
if (process.env.VITE_FIREBASE_PROJECT_ID && values.project !== process.env.VITE_FIREBASE_PROJECT_ID) {
  throw new Error('Le projet demandé ne correspond pas au .env. Corrigez la configuration avant de continuer.');
}
let credential = applicationDefault();
if (values.credentials) {
  const key = JSON.parse(await readFile(values.credentials, 'utf8'));
  if (key.project_id !== values.project) throw new Error('Le compte de service appartient à un autre projet.');
  credential = cert(key);
}
const app = initializeApp({ credential, projectId: values.project });
const auth = getAuth(app);
const db = getFirestore(app);
let createdUser;
try {
  const admins = await db.collection('profiles').where('role', '==', 'admin').limit(1).get();
  let existing;
  try { existing = await auth.getUserByEmail(values.email); }
  catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
  if (!admins.empty && admins.docs[0].id !== existing?.uid) throw new Error('Un administrateur existe déjà. Ce script est réservé au premier compte.');
  if (!existing) {
    if (!process.stdin.isTTY) throw new Error('Exécutez ce script dans un terminal interactif pour saisir le mot de passe.');
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    // Hide input while leaving the prompt visible. Never log or persist passwords.
    process.stdout.write('Mot de passe du premier administrateur (12 caractères minimum) : ');
    prompt._writeToOutput = () => {};
    const password = await prompt.question('');
    process.stdout.write('\nConfirmez le mot de passe : ');
    const confirmation = await prompt.question('');
    prompt.close();
    process.stdout.write('\n');
    if (password !== confirmation) throw new Error('Les mots de passe ne correspondent pas.');
    if (password.length < 12) throw new Error('Le mot de passe doit contenir au moins 12 caractères.');
    existing = await auth.createUser({ email: values.email, password, displayName: values.name });
    createdUser = existing.uid;
  }
  await db.collection('profiles').doc(existing.uid).set({ username: values.name, role: 'admin', website: '', avatar_url: '' }, { merge: true });
  console.log(`Administrateur prêt dans le projet ${values.project}. Connectez-vous avec ${values.email}.`);
} catch (error) {
  // If profile provisioning fails, remove only the account created by this run.
  if (createdUser) await auth.deleteUser(createdUser).catch(() => console.error('Le compte Auth a été créé sans profil. Relancez le script avec le même email.'));
  console.error(`Initialisation impossible : ${error.message}`);
  process.exitCode = 1;
} finally { await deleteApp(app); }
