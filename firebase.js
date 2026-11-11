/* Ligação ao Firebase (contas + base de dados). Não precisa de alterar. */
import { firebaseConfig, ADMIN_EMAILS } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const configurado =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE");

let auth = null, db = null;
if (configurado) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  auth.languageCode = "pt";
  db = getFirestore(app);
}
export { auth, db };

const admins = ADMIN_EMAILS.map(e => e.trim().toLowerCase());
export const eAdmin = u =>
  !!u && u.emailVerified && admins.includes((u.email || "").toLowerCase());

/** Chama cb(utilizador|null) sempre que o estado de sessão muda. */
export function aoMudarSessao(cb) {
  if (!configurado) { cb(null); return () => {}; }
  return onAuthStateChanged(auth, cb);
}

/** Traduz os erros mais comuns do Firebase para português. */
export function erroPT(e) {
  const c = (e && e.code) || "";
  const m = {
    "auth/email-already-in-use": "Já existe uma conta com este e-mail. Experimente entrar.",
    "auth/invalid-email": "O e-mail não é válido.",
    "auth/invalid-credential": "E-mail ou palavra-passe incorretos.",
    "auth/wrong-password": "E-mail ou palavra-passe incorretos.",
    "auth/user-not-found": "E-mail ou palavra-passe incorretos.",
    "auth/missing-password": "Indique a palavra-passe.",
    "auth/weak-password": "A palavra-passe deve ter pelo menos 6 caracteres.",
    "auth/too-many-requests": "Demasiadas tentativas. Aguarde uns minutos e tente de novo.",
    "auth/network-request-failed": "Sem ligação à internet. Verifique a ligação e tente de novo.",
    "permission-denied": "Sem permissão para esta operação.",
    "unavailable": "Serviço temporariamente indisponível. Tente de novo."
  };
  return m[c] || "Ocorreu um erro. Tente novamente.";
}
