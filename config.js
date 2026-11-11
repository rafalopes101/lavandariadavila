/* ==========================================================
   CONFIGURAÇÃO DO SITE — é só aqui que precisa de mexer
   (ver o ficheiro LEIA-ME.md para o passo a passo)
   ========================================================== */

// 1) PAYPAL — Client ID "Live" da sua conta PayPal Business
//    developer.paypal.com → Apps & Credentials → separador "Live" → a sua app → Client ID
//    (NÃO use o "Secret" — esse nunca deve ser posto no site)
export const PAYPAL_CLIENT_ID = "COLE_AQUI_O_CLIENT_ID_LIVE_DO_PAYPAL";

// 2) FIREBASE — contas de clientes e encomendas
//    console.firebase.google.com → o seu projeto → ⚙ Definições do projeto → "As suas apps" → </> Web
//    Copie os valores do bloco "firebaseConfig" para aqui.
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

// 3) ADMINISTRADORES — e-mails com acesso à página admin.html
//    Têm de ser IGUAIS aos que estão no ficheiro firestore.rules.
//    A conta de administrador tem de ter o e-mail confirmado.
export const ADMIN_EMAILS = ["lavandariadavila2025@gmail.com"];

// 4) DADOS DA LOJA
export const LOJA = {
  nome: "Lavandaria da Vila",
  telefone: "+351 916 186 196",
  morada: "Rua das Lapas 264, 4605-335 Vila Meã",
  horario: "todos os dias das 06h às 00h"
};

// 5) PRODUTOS
//    Para trocar a imagem, ponha a foto na pasta images com o nome indicado em "img".
//    Para adicionar um produto, copie uma linha e mude o id (único), nome, descrição, preço e imagem.
//    Categorias possíveis: lencois, jogos, edredoes, banho
export const PRODUTOS = [
  { id:"lencois-solteiro",   cat:"lencois",  nome:"Jogo de Lençóis Solteiro", desc:"Lençol de baixo, lençol de cima e fronha. 100% algodão.",       preco:24.90, img:"images/lencois-solteiro.jpg" },
  { id:"lencois-casal",      cat:"lencois",  nome:"Jogo de Lençóis Casal",    desc:"Lençol de baixo, lençol de cima e duas fronhas. 100% algodão.", preco:34.90, img:"images/lencois-casal.jpg" },
  { id:"fronhas",            cat:"lencois",  nome:"Par de Fronhas",           desc:"Duas fronhas 50x70 cm em algodão macio.",                       preco:9.90,  img:"images/fronhas.jpg" },
  { id:"jogo-cama-solteiro", cat:"jogos",    nome:"Jogo de Cama Solteiro",    desc:"Capa de edredão, lençol de baixo e fronha a condizer.",         preco:39.90, img:"images/jogo-cama-solteiro.jpg" },
  { id:"jogo-cama-casal",    cat:"jogos",    nome:"Jogo de Cama Casal",       desc:"Capa de edredão, lençol de baixo e duas fronhas a condizer.",   preco:54.90, img:"images/jogo-cama-casal.jpg" },
  { id:"resguardo",          cat:"jogos",    nome:"Resguardo de Colchão",     desc:"Impermeável e respirável, protege o colchão de manchas.",      preco:22.90, img:"images/resguardo.jpg" },
  { id:"edredao",            cat:"edredoes", nome:"Edredão de Inverno",       desc:"Enchimento quente e leve, ideal para as noites frias.",         preco:39.90, img:"images/edredao.jpg" },
  { id:"manta",              cat:"edredoes", nome:"Manta Polar",              desc:"Manta macia para o sofá ou para a cama.",                       preco:17.90, img:"images/manta.jpg" },
  { id:"almofada",           cat:"edredoes", nome:"Almofada",                 desc:"Almofada de fibra, firme e confortável.",                       preco:12.90, img:"images/almofada.jpg" },
  { id:"toalhas",            cat:"banho",    nome:"Conjunto de Toalhas",      desc:"Toalha de banho, toalha de rosto e toalha de mãos.",            preco:19.90, img:"images/toalhas.jpg" }
];

export const CATEGORIAS = { lencois:"Lençóis", jogos:"Jogos de Cama", edredoes:"Edredões e Mantas", banho:"Banho" };
