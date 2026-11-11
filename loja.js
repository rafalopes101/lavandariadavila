/* Loja: produtos, carrinho, pagamento PayPal (real) e registo da encomenda. */
import { PAYPAL_CLIENT_ID, PRODUTOS, CATEGORIAS, LOJA } from "./config.js";
import { $, $$, centimos, euros, valorPP, esc, telLimpo, telValido, numEncomenda } from "./util.js";

// O Firebase é carregado à parte: se falhar, os produtos aparecem na mesma.
let fb = null;

const porId = id => PRODUTOS.find(p => p.id === id);
const paypalConfigurado = PAYPAL_CLIENT_ID && !PAYPAL_CLIENT_ID.startsWith("COLE");
let utilizador = null;

/* ---------- Carrinho (guardado no navegador) ---------- */
let carrinho = {};
try { carrinho = JSON.parse(localStorage.getItem("lv_carrinho")) || {}; } catch { carrinho = {}; }
Object.keys(carrinho).forEach(id => { if (!porId(id)) delete carrinho[id]; });

const guardar = () => { try { localStorage.setItem("lv_carrinho", JSON.stringify(carrinho)); } catch {} };
const linhas = () => Object.entries(carrinho)
  .filter(([id, q]) => q > 0 && porId(id))
  .map(([id, q]) => ({ p: porId(id), q }));
const totalC = () => linhas().reduce((t, l) => t + centimos(l.p.preco) * l.q, 0);

/* ---------- Produtos ---------- */
$("#produtos").innerHTML = PRODUTOS.map(p => `
  <article class="produto" data-cat="${esc(p.cat)}">
    <div class="img">◇<img src="${esc(p.img)}" alt="${esc(p.nome)}" loading="lazy" onerror="this.remove()"></div>
    <div class="corpo">
      <span class="cat">${esc(CATEGORIAS[p.cat] || "")}</span>
      <h3>${esc(p.nome)}</h3>
      <p class="desc">${esc(p.desc)}</p>
      <div class="base">
        <span class="preco">${euros(centimos(p.preco))}</span>
        <button class="btn btn-peq" data-add="${esc(p.id)}">Adicionar</button>
      </div>
    </div>
  </article>`).join("");

$("#produtos").addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  const id = b.dataset.add;
  carrinho[id] = Math.min((carrinho[id] || 0) + 1, 20);
  guardar(); desenharCarrinho();
  b.textContent = "✓ Adicionado"; b.classList.add("feito");
  setTimeout(() => { b.textContent = "Adicionar"; b.classList.remove("feito"); }, 1200);
});

$$(".filtros button").forEach(btn => btn.addEventListener("click", () => {
  $$(".filtros button").forEach(b => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  const f = btn.dataset.filtro;
  $$(".produto").forEach(p => { p.hidden = !(f === "todos" || p.dataset.cat === f); });
}));

/* ---------- Painel do carrinho ---------- */
function desenharCarrinho() {
  const ls = linhas();
  $("#nCarrinho").textContent = ls.reduce((t, l) => t + l.q, 0);
  if (!ls.length) {
    $("#linhas").innerHTML = `<p class="vazio">O carrinho está vazio.<br>Adicione artigos para continuar.</p>`;
    $("#rodapeCarrinho").hidden = true;
    return;
  }
  $("#rodapeCarrinho").hidden = false;
  $("#linhas").innerHTML = ls.map(({ p, q }) => `
    <div class="linha">
      <div class="mini">◇<img src="${esc(p.img)}" alt="" onerror="this.remove()"></div>
      <div>
        <div class="nome">${esc(p.nome)}</div>
        <div class="qtd">
          <button data-menos="${esc(p.id)}" aria-label="Menos">−</button>
          <span>${q}</span>
          <button data-mais="${esc(p.id)}" aria-label="Mais">+</button>
        </div>
      </div>
      <div class="dir">
        <div class="sub">${euros(centimos(p.preco) * q)}</div>
        <button class="remover" data-rem="${esc(p.id)}">Remover</button>
      </div>
    </div>`).join("");
  $("#total").textContent = euros(totalC());
}

$("#linhas").addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.mais) carrinho[d.mais] = Math.min(carrinho[d.mais] + 1, 20);
  else if (d.menos) { carrinho[d.menos]--; if (carrinho[d.menos] <= 0) delete carrinho[d.menos]; }
  else if (d.rem) delete carrinho[d.rem];
  else return;
  guardar(); desenharCarrinho();
});

function abrir() {
  $("#vistaCarrinho").hidden = false;
  $("#vistaSucesso").hidden = true;
  $("#gaveta").classList.add("aberta");
  $("#veu").classList.add("aberto");
  $("#gaveta").setAttribute("aria-hidden", "false");
  document.body.classList.add("sem-scroll");
}
function fechar() {
  $("#gaveta").classList.remove("aberta");
  $("#veu").classList.remove("aberto");
  $("#gaveta").setAttribute("aria-hidden", "true");
  document.body.classList.remove("sem-scroll");
}
$("#abrirCarrinho").addEventListener("click", abrir);
$("#fecharCarrinho").addEventListener("click", fechar);
$("#veu").addEventListener("click", fechar);
document.addEventListener("keydown", e => { if (e.key === "Escape") fechar(); });
$("#vistaSucesso").addEventListener("click", e => { if (e.target.closest("[data-fechar]")) fechar(); });

/* ---------- Sessão e dados do cliente ---------- */
const nomeEl = $("#cliNome"), telEl = $("#cliTel"), aceitoEl = $("#aceito");

function estadoCheckout() {
  if (!fb?.configurado || !paypalConfigurado) {
    $("#semConfig").hidden = false;
    $("#semConfig").textContent = `A loja online está temporariamente indisponível. Para encomendar, contacte-nos pelo ${LOJA.telefone}.`;
    $("#pedirLogin").hidden = true;
    $("#checkout").hidden = true;
    return;
  }
  $("#pedirLogin").hidden = !!utilizador;
  $("#checkout").hidden = !utilizador;
}

import("./firebase.js").then(m => {
  fb = m;
  estadoCheckout();
  fb.aoMudarSessao(aoEntrar);
}).catch(() => estadoCheckout());

async function aoEntrar(u) {
  utilizador = u;
  estadoCheckout();
  if (!u) return;
  nomeEl.value = u.displayName || "";
  try {
    const s = await fb.getDoc(fb.doc(fb.db, "utilizadores", u.uid));
    if (s.exists()) {
      const d = s.data();
      if (!nomeEl.value) nomeEl.value = d.nome || "";
      telEl.value = d.telefone || "";
    }
  } catch {}
}

function validar() {
  const nomeOk = nomeEl.value.trim().length >= 2;
  const telOk = telValido(telEl.value);
  nomeEl.classList.toggle("invalido", !nomeOk);
  telEl.classList.toggle("invalido", !telOk);
  if (!nomeOk || !telOk) { $("#msg").textContent = "Indique o seu nome e um número de telemóvel válido."; return false; }
  if (!aceitoEl.checked) { $("#msg").textContent = "Tem de aceitar os termos de venda para continuar."; return false; }
  $("#msg").textContent = "";
  return true;
}
[nomeEl, telEl, aceitoEl].forEach(el => el.addEventListener("input", () => {
  el.classList.remove("invalido"); $("#msg").textContent = "";
}));

/* ---------- PayPal (pagamentos reais) ---------- */
function carregarPayPal() {
  if (!paypalConfigurado) return;
  const s = document.createElement("script");
  s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(PAYPAL_CLIENT_ID) +
          "&currency=EUR&locale=pt_PT&intent=capture&components=buttons&disable-funding=paylater";
  s.onload = desenharPayPal;
  s.onerror = () => {
    $("#paypal-botoes").innerHTML = `<p class="msg erro">Não foi possível carregar o pagamento. Verifique a ligação ou desative bloqueadores de anúncios e recarregue a página.</p>`;
  };
  document.head.appendChild(s);
}

function desenharPayPal() {
  paypal.Buttons({
    style: { layout:"vertical", shape:"pill", label:"pay", height:48 },

    onClick: (data, actions) => {
      if (!utilizador || !linhas().length) return actions.reject();
      return validar() ? actions.resolve() : actions.reject();
    },

    createOrder: (data, actions) => {
      const ls = linhas();
      const total = totalC();
      return actions.order.create({
        intent: "CAPTURE",
        purchase_units: [{
          description: "Encomenda Lavandaria da Vila - levantamento na loja",
          custom_id: utilizador.uid.slice(0, 127),
          amount: {
            currency_code: "EUR",
            value: valorPP(total),
            breakdown: { item_total: { currency_code: "EUR", value: valorPP(total) } }
          },
          items: ls.map(({ p, q }) => ({
            name: p.nome.slice(0, 127),
            sku: p.id.slice(0, 127),
            quantity: String(q),
            category: "PHYSICAL_GOODS",
            unit_amount: { currency_code: "EUR", value: valorPP(centimos(p.preco)) }
          }))
        }],
        application_context: { brand_name: "Lavandaria da Vila", shipping_preference: "NO_SHIPPING" }
      });
    },

    onApprove: async (data, actions) => {
      let det;
      try {
        det = await actions.order.capture();
      } catch (err) {
        // cartão recusado: deixa o cliente escolher outro meio de pagamento
        if (String(err).includes("INSTRUMENT_DECLINED")) return actions.restart();
        throw err;
      }
      const cap = det?.purchase_units?.[0]?.payments?.captures?.[0] || {};
      const ls = linhas();
      const encomenda = {
        uid: utilizador.uid,
        email: utilizador.email || "",
        nome: nomeEl.value.trim().slice(0, 60),
        telefone: telLimpo(telEl.value),
        itens: ls.map(({ p, q }) => ({ id: p.id, nome: p.nome, preco: p.preco, qtd: q })),
        totalCentimos: totalC(),
        estado: cap.status === "COMPLETED" ? "paga" : "pendente",
        pagamento: {
          paypalOrderId: det.id || "",
          captureId: cap.id || "",
          estado: cap.status || det.status || "",
          valor: cap.amount?.value || "",
          moeda: cap.amount?.currency_code || "",
          pagador: det?.payer?.email_address || ""
        },
        criadoEm: fb.serverTimestamp()
      };

      let ref = null;
      for (let i = 0; i < 3 && !ref; i++) {
        try { ref = await fb.addDoc(fb.collection(fb.db, "encomendas"), encomenda); }
        catch (e) { console.error(e); await new Promise(r => setTimeout(r, 1000)); }
      }

      carrinho = {}; guardar(); desenharCarrinho();
      mostrarSucesso(encomenda, ref, det.id);
    },

    onCancel: () => { $("#msg").textContent = "Pagamento cancelado. O seu carrinho continua guardado."; },

    onError: err => {
      console.error(err);
      $("#msg").textContent = `Ocorreu um erro no pagamento. Tente novamente ou contacte-nos pelo ${LOJA.telefone}.`;
    }
  }).render("#paypal-botoes");
}

function mostrarSucesso(enc, ref, paypalId) {
  const primeiro = enc.nome.split(" ")[0];
  $("#vistaCarrinho").hidden = true;
  $("#vistaSucesso").hidden = false;
  $("#vistaSucesso").innerHTML = `
    <div class="sucesso">
      <div class="ok">✓</div>
      <h3>Obrigado, ${esc(primeiro)}!</h3>
      <p>${enc.estado === "paga"
        ? `O pagamento de <strong>${euros(enc.totalCentimos)}</strong> foi recebido.`
        : `O pagamento de <strong>${euros(enc.totalCentimos)}</strong> está a ser confirmado pelo PayPal.`}</p>
      ${ref ? `<p>Encomenda <strong>${numEncomenda(ref.id)}</strong></p>` : ""}
      <p class="peq">Referência PayPal: ${esc(paypalId)}</p>
      ${ref ? "" : `<div class="aviso" style="text-align:left">O pagamento foi feito, mas não conseguimos registar a encomenda automaticamente. Guarde a referência acima e ligue-nos para o ${esc(LOJA.telefone)}.</div>`}
      <p>Ligamos para si quando a encomenda estiver pronta para levantar.</p>
      <div style="display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;margin-top:1rem">
        <a class="btn btn-sec" href="conta.html">Ver as minhas encomendas</a>
        <button class="btn" data-fechar>Continuar</button>
      </div>
    </div>`;
}

/* ---------- Arranque ---------- */
desenharCarrinho();
estadoCheckout();
carregarPayPal();
