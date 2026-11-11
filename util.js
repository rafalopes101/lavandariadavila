/* Funções pequenas partilhadas */
export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const centimos = v => Math.round(Number(v) * 100);
export const euros = c => (c / 100).toFixed(2).replace(".", ",") + " €";
export const valorPP = c => (c / 100).toFixed(2);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, ch =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
export const telLimpo = t => String(t || "").replace(/[\s-]/g, "");
export const telValido = t => /^\+?\d{9,15}$/.test(telLimpo(t));
export const numEncomenda = id => "#" + String(id).slice(-6).toUpperCase();

export const ESTADOS = {
  pendente:   "Pagamento pendente",
  paga:       "Paga",
  preparacao: "Em preparação",
  pronta:     "Pronta a levantar",
  levantada:  "Levantada",
  cancelada:  "Cancelada"
};
export const estadoHTML = e =>
  `<span class="estado ${esc(e)}">${esc(ESTADOS[e] || e)}</span>`;

export function dataPT(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : null);
  if (!d) return "—";
  return d.toLocaleString("pt-PT", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

/** Só aceita páginas locais simples como destino de "voltar" (evita redirecionamentos para fora). */
export function destinoSeguro(v, padrao = "conta.html") {
  return /^[a-z-]+\.html$/.test(v || "") ? v : padrao;
}
