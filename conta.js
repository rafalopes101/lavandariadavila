/* Conta do cliente: entrar, criar conta, recuperar palavra-passe, dados e encomendas. */
import { $, $$, esc, euros, telLimpo, telValido, dataPT, estadoHTML, numEncomenda, destinoSeguro } from "./util.js";
import {
  configurado, auth, db, aoMudarSessao, eAdmin, erroPT,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  sendEmailVerification, updateProfile, signOut,
  doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp
} from "./firebase.js";

const voltar = new URLSearchParams(location.search).get("voltar");
let aRegistar = false;
const msg = (el, texto, tipo = "erro") => { el.textContent = texto; el.className = "msg " + (texto ? tipo : ""); };

if (!configurado) {
  $("#semConfig").hidden = false;
} else {
  aoMudarSessao(u => { if (aRegistar) return; u ? mostrarConta(u) : mostrarEntrar(); });
}

/* ---------- Abas ---------- */
$$(".abas button").forEach(b => b.addEventListener("click", () => {
  $$(".abas button").forEach(x => x.classList.toggle("ativo", x === b));
  $("#formEntrar").hidden = b.dataset.aba !== "entrar";
  $("#formRegistar").hidden = b.dataset.aba !== "registar";
}));

function mostrarEntrar() {
  $("#vistaConta").hidden = true;
  $("#vistaEntrar").hidden = false;
}

/* ---------- Entrar ---------- */
$("#formEntrar").addEventListener("submit", async e => {
  e.preventDefault();
  const m = $("#msgEntrar"), btn = e.target.querySelector("button[type=submit]");
  msg(m, "");
  btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, $("#eEmail").value.trim(), $("#ePass").value);
    if (voltar) location.href = destinoSeguro(voltar);
  } catch (err) { msg(m, erroPT(err)); }
  btn.disabled = false;
});

$("#esqueci").addEventListener("click", async e => {
  e.preventDefault();
  const m = $("#msgEntrar"), email = $("#eEmail").value.trim();
  if (!email) { msg(m, "Escreva o seu e-mail acima e carregue novamente em “Esqueci-me da palavra-passe”."); return; }
  try {
    await sendPasswordResetEmail(auth, email);
    msg(m, "Se existir uma conta com este e-mail, vai receber uma ligação para criar nova palavra-passe.", "ok");
  } catch (err) { msg(m, erroPT(err)); }
});

/* ---------- Criar conta ---------- */
$("#formRegistar").addEventListener("submit", async e => {
  e.preventDefault();
  const m = $("#msgRegistar"), btn = e.target.querySelector("button[type=submit]");
  const nome = $("#rNome").value.trim(), tel = telLimpo($("#rTel").value);
  const email = $("#rEmail").value.trim(), pass = $("#rPass").value;
  if (nome.length < 2) return msg(m, "Indique o seu nome.");
  if (!telValido(tel)) return msg(m, "Indique um número de telemóvel válido.");
  if (pass.length < 6) return msg(m, "A palavra-passe deve ter pelo menos 6 caracteres.");
  if (!$("#rTermos").checked) return msg(m, "Tem de aceitar os termos e a política de privacidade.");
  msg(m, "");
  btn.disabled = true;
  aRegistar = true;
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(user, { displayName: nome });
    await setDoc(doc(db, "utilizadores", user.uid), {
      nome, telefone: tel, email: user.email, criadoEm: serverTimestamp()
    });
    sendEmailVerification(user).catch(() => {});
    if (voltar) location.href = destinoSeguro(voltar);
    else mostrarConta(user);
  } catch (err) {
    msg(m, erroPT(err));
    if (auth.currentUser) mostrarConta(auth.currentUser);
  }
  aRegistar = false;
  btn.disabled = false;
});

/* ---------- Área de cliente ---------- */
async function mostrarConta(u) {
  $("#vistaEntrar").hidden = true;
  $("#vistaConta").hidden = false;
  $("#ola").textContent = "Olá, " + (u.displayName || "").split(" ")[0];
  $("#pEmail").value = u.email || "";
  $("#pNome").value = u.displayName || "";
  try { await u.reload(); } catch {}
  $("#avisoVerificar").hidden = u.emailVerified;
  $("#linkAdmin").hidden = !eAdmin(u);

  try {
    const s = await getDoc(doc(db, "utilizadores", u.uid));
    if (s.exists()) {
      const d = s.data();
      $("#pNome").value = d.nome || $("#pNome").value;
      $("#pTel").value = d.telefone || "";
    } else {
      // conta criada sem ficha (ex.: falha de rede no registo) — cria-a agora
      await setDoc(doc(db, "utilizadores", u.uid), {
        nome: u.displayName || "", telefone: "", email: u.email, criadoEm: serverTimestamp()
      });
    }
  } catch {}
  carregarEncomendas(u);
}

async function carregarEncomendas(u) {
  const el = $("#minhasEncomendas");
  try {
    const snap = await getDocs(query(collection(db, "encomendas"), where("uid", "==", u.uid)));
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
    if (!lista.length) {
      el.innerHTML = `<p class="muted">Ainda não fez encomendas. <a class="ligacao" href="loja.html">Ir à loja →</a></p>`;
      return;
    }
    el.innerHTML = lista.map(e => `
      <div class="encomenda">
        <div class="cab">
          <div><strong>${numEncomenda(e.id)}</strong> <span class="muted peq">· ${dataPT(e.criadoEm)}</span></div>
          ${estadoHTML(e.estado)}
        </div>
        <ul>${(e.itens || []).map(i => `<li>${i.qtd}× ${esc(i.nome)}</li>`).join("")}</ul>
        <div style="margin-top:.35rem;font-weight:600">${euros(e.totalCentimos || 0)}</div>
      </div>`).join("");
  } catch (err) {
    el.innerHTML = `<p class="msg erro">${esc(erroPT(err))}</p>`;
  }
}

$("#formPerfil").addEventListener("submit", async e => {
  e.preventDefault();
  const m = $("#msgPerfil"), u = auth.currentUser;
  const nome = $("#pNome").value.trim(), tel = telLimpo($("#pTel").value);
  if (nome.length < 2) return msg(m, "Indique o seu nome.");
  if (tel && !telValido(tel)) return msg(m, "Número de telemóvel inválido.");
  try {
    await updateDoc(doc(db, "utilizadores", u.uid), { nome, telefone: tel });
    await updateProfile(u, { displayName: nome });
    $("#ola").textContent = "Olá, " + nome.split(" ")[0];
    msg(m, "Dados guardados.", "ok");
  } catch (err) { msg(m, erroPT(err)); }
});

$("#reenviar").addEventListener("click", async e => {
  e.preventDefault();
  try { await sendEmailVerification(auth.currentUser); e.target.textContent = "E-mail enviado ✓"; }
  catch (err) { e.target.textContent = erroPT(err); }
});

$("#sair").addEventListener("click", () => signOut(auth));
