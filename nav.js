/* Menu do topo: abrir/fechar no telemóvel, página ativa, botão de conta, horário. */
const btn = document.querySelector(".menu-btn");
const menu = document.querySelector(".menu");
if (btn && menu) {
  btn.addEventListener("click", () => {
    const aberto = menu.classList.toggle("mostrar");
    btn.setAttribute("aria-expanded", aberto);
    btn.textContent = aberto ? "✕" : "☰";
  });
}

const pagina = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".menu a").forEach(a => {
  if (a.getAttribute("href") === pagina) a.setAttribute("aria-current", "page");
});

// Indicador "Aberto agora" (06h–00h, hora de Portugal)
document.querySelectorAll("[data-aberto]").forEach(el => {
  const h = Number(new Intl.DateTimeFormat("pt-PT", { hour:"numeric", hourCycle:"h23", timeZone:"Europe/Lisbon" }).format(new Date()));
  const aberto = h >= 6;
  el.classList.toggle("fechado", !aberto);
  el.querySelector("span").textContent = aberto ? "Aberto agora · 06h–00h" : "Fechado · abre às 06h";
});

// Botão de conta (carregado à parte para o menu funcionar mesmo sem ligação ao Firebase)
import("./firebase.js").then(({ aoMudarSessao, eAdmin }) => {
  const link = document.getElementById("navConta");
  if (!link) return;
  aoMudarSessao(u => {
    if (!u) { link.textContent = "Entrar"; link.href = "conta.html"; return; }
    if (eAdmin(u)) { link.textContent = "Admin"; link.href = "admin.html"; }
    else { link.textContent = "A minha conta"; link.href = "conta.html"; }
  });
}).catch(() => {});
