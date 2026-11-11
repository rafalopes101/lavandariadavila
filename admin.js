/* Painel de administração: encomendas (em tempo real) e contas criadas. */
import { PRODUTOS } from "./config.js";
import { $, $$, esc, euros, centimos, dataPT, estadoHTML, numEncomenda, ESTADOS } from "./util.js";
import {
  configurado, db, aoMudarSessao, eAdmin, erroPT,
  collection, query, orderBy, limit, onSnapshot, doc, updateDoc, serverTimestamp
} from "./firebase.js";

let encomendas = [], contas = [], filtro = "ativas";
let pararEnc = null, pararContas = null;
const acesso = $("#estadoAcesso");

if (!configurado) {
  acesso.innerHTML = `<div class="aviso erro">O Firebase ainda não está configurado (js/config.js).</div>`;
} else {
  aoMudarSessao(async u => {
    pararEnc?.(); pararContas?.();
    $("#painel").hidden = true;
    acesso.hidden = false;
    if (!u) {
      acesso.innerHTML = `<h1 style="font-size:1.6rem;margin-bottom:.5rem">Área reservada</h1>
        <p class="muted" style="margin-bottom:1.25rem">Entre com a conta de administrador.</p>
        <a class="btn" href="conta.html?voltar=admin.html">Entrar</a>`;
      return;
    }
    // atualiza o estado "e-mail confirmado" (necessário para as regras de segurança)
    try { await u.reload(); await u.getIdToken(true); } catch {}
    if (!eAdmin(u)) {
      acesso.innerHTML = `<h1 style="font-size:1.6rem;margin-bottom:.5rem">Sem acesso</h1>
        <p class="muted">${u.emailVerified
          ? "Esta conta não tem permissões de administrador."
          : "Confirme primeiro o e-mail desta conta (veja a sua caixa de correio) e depois recarregue a página."}</p>`;
      return;
    }
    acesso.hidden = true;
    $("#painel").hidden = false;
    ouvir();
  });
}

function ouvir() {
  pararEnc = onSnapshot(
    query(collection(db, "encomendas"), orderBy("criadoEm", "desc"), limit(500)),
    s => { encomendas = s.docs.map(d => ({ id: d.id, ...d.data() })); desenharEncomendas(); estatisticas(); desenharContas(); },
    e => { $("#listaEncomendas").innerHTML = `<div class="aviso erro">${esc(erroPT(e))}</div>`; }
  );
  pararContas = onSnapshot(
    collection(db, "utilizadores"),
    s => { contas = s.docs.map(d => ({ id: d.id, ...d.data() })); desenharContas(); estatisticas(); },
    e => { $("#listaContas").innerHTML = `<tr><td colspan="5">${esc(erroPT(e))}</td></tr>`; }
  );
}

/* ---------- Abas ---------- */
$$("#painel .abas button").forEach(b => b.addEventListener("click", () => {
  $$("#painel .abas button").forEach(x => x.classList.toggle("ativo", x === b));
  $("#abaEncomendas").hidden = b.dataset.aba !== "encomendas";
  $("#abaContas").hidden = b.dataset.aba !== "contas";
}));

/* ---------- Estatísticas ---------- */
function estatisticas() {
  const agora = new Date();
  const doMes = encomendas.filter(e => {
    const d = e.criadoEm?.toDate?.();
    return d && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear() && e.estado !== "cancelada";
  });
  $("#sPreparar").textContent = encomendas.filter(e => e.estado === "paga" || e.estado === "preparacao").length;
  $("#sProntas").textContent = encomendas.filter(e => e.estado === "pronta").length;
  $("#sMes").textContent = euros(doMes.reduce((t, e) => t + (e.totalCentimos || 0), 0));
  $("#sContas").textContent = contas.length;
}

/* ---------- Verificação de valores ----------
   Compara o valor efetivamente pago no PayPal com o preço dos artigos no catálogo.
   Se não bater certo, a encomenda fica assinalada a vermelho. */
function problemas(e) {
  const p = [];
  const pago = Math.round(parseFloat(e.pagamento?.valor || "0") * 100);
  const esperado = (e.itens || []).reduce((t, i) => {
    const prod = PRODUTOS.find(x => x.id === i.id);
    return t + (prod ? centimos(prod.preco) : centimos(i.preco)) * (i.qtd || 0);
  }, 0);
  if (e.pagamento?.moeda && e.pagamento.moeda !== "EUR") p.push("Moeda diferente de EUR");
  if (pago !== esperado) p.push(`Valor pago (${euros(pago)}) diferente do preço do catálogo (${euros(esperado)})`);
  if (e.estado === "pendente") p.push("Pagamento ainda pendente no PayPal");
  return p;
}

/* ---------- Encomendas ---------- */
$$("#filtroEstado button").forEach(b => b.addEventListener("click", () => {
  $$("#filtroEstado button").forEach(x => x.classList.toggle("ativo", x === b));
  filtro = b.dataset.f;
  desenharEncomendas();
}));
$("#pesquisaEnc").addEventListener("input", desenharEncomendas);

function desenharEncomendas() {
  const q = $("#pesquisaEnc").value.trim().toLowerCase();
  const lista = encomendas.filter(e => {
    if (filtro === "ativas" && !["pendente", "paga", "preparacao", "pronta"].includes(e.estado)) return false;
    if (!["ativas", "todas"].includes(filtro) && e.estado !== filtro) return false;
    if (!q) return true;
    return [e.nome, e.telefone, e.email, numEncomenda(e.id)].join(" ").toLowerCase().includes(q);
  });
  if (!lista.length) { $("#listaEncomendas").innerHTML = `<p class="muted" style="padding:2rem 0;text-align:center">Sem encomendas.</p>`; return; }

  $("#listaEncomendas").innerHTML = lista.map(e => {
    const prob = problemas(e);
    return `
    <div class="enc-admin ${prob.length ? "alerta" : ""}">
      <div>
        <div><span class="num">${numEncomenda(e.id)}</span> <span class="muted peq">· ${dataPT(e.criadoEm)}</span></div>
        <div class="cli" style="margin-top:.3rem">${esc(e.nome)} · <a href="tel:${esc(e.telefone)}">${esc(e.telefone)}</a> <span class="muted peq">· ${esc(e.email)}</span></div>
        <ul>${(e.itens || []).map(i => `<li>${Number(i.qtd)}× ${esc(i.nome)} <span class="muted">· ${euros(centimos(i.preco) * i.qtd)}</span></li>`).join("")}</ul>
        ${prob.map(t => `<div class="alerta-txt">⚠ ${esc(t)}</div>`).join("")}
        <div class="ref">PayPal: ${esc(e.pagamento?.captureId || e.pagamento?.paypalOrderId || "—")}${e.pagamento?.pagador ? " · " + esc(e.pagamento.pagador) : ""}</div>
      </div>
      <div class="lado">
        <div class="preco">${euros(e.totalCentimos || 0)}</div>
        ${estadoHTML(e.estado)}
        <select data-id="${esc(e.id)}" aria-label="Alterar estado">
          ${Object.entries(ESTADOS).map(([k, v]) => `<option value="${k}" ${k === e.estado ? "selected" : ""}>${v}</option>`).join("")}
        </select>
      </div>
    </div>`;
  }).join("");
}

$("#listaEncomendas").addEventListener("change", async e => {
  const sel = e.target.closest("select[data-id]");
  if (!sel) return;
  const novo = sel.value;
  if (novo === "cancelada" && !confirmar("Marcar como cancelada? Lembre-se de fazer o reembolso no PayPal.")) {
    desenharEncomendas(); return;
  }
  sel.disabled = true;
  try {
    await updateDoc(doc(db, "encomendas", sel.dataset.id), { estado: novo, atualizadoEm: serverTimestamp() });
  } catch (err) {
    sel.disabled = false;
    sel.insertAdjacentHTML("afterend", `<div class="alerta-txt">${esc(erroPT(err))}</div>`);
  }
});

// confirmação simples sem janelas de alerta bloqueantes do navegador
function confirmar(texto) { return window.confirm(texto); }

/* ---------- Contas ---------- */
$("#pesquisaContas").addEventListener("input", desenharContas);

function desenharContas() {
  const q = $("#pesquisaContas").value.trim().toLowerCase();
  const porUid = {};
  encomendas.forEach(e => {
    if (e.estado === "cancelada") return;
    const c = (porUid[e.uid] ||= { n: 0, t: 0 });
    c.n++; c.t += e.totalCentimos || 0;
  });
  const lista = contas
    .filter(c => !q || [c.nome, c.email, c.telefone].join(" ").toLowerCase().includes(q))
    .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0));
  if (!lista.length) { $("#listaContas").innerHTML = `<tr><td colspan="5" class="muted">Sem contas.</td></tr>`; return; }
  $("#listaContas").innerHTML = lista.map(c => `
    <tr>
      <td><strong>${esc(c.nome || "—")}</strong></td>
      <td>${esc(c.email || "")}<br><a class="ligacao" href="tel:${esc(c.telefone)}">${esc(c.telefone || "")}</a></td>
      <td>${dataPT(c.criadoEm)}</td>
      <td>${porUid[c.id]?.n || 0}</td>
      <td>${euros(porUid[c.id]?.t || 0)}</td>
    </tr>`).join("");
}
