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
  apiKey: "AIzaSyBEkcTN9vtoDj3iI62bFqUYvS8KjCTRp4U",
  authDomain: "lavandariadavila-3eac6.firebaseapp.com",
  projectId: "lavandariadavila-3eac6",
  storageBucket: "lavandariadavila-3eac6.firebasestorage.app",
  messagingSenderId: "879069902069",
  appId: "1:879069902069:web:502c7a6e797364fb42c1bc",
  measurementId: "G-71VP6JYNE8"
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
//    Categorias possíveis: as chaves de CATEGORIAS, mais abaixo.
//    Os filtros por categoria aparecem sozinhos quando houver 4 ou mais artigos de várias categorias.
export const PRODUTOS = [
  { id:"edredao-branco", cat:"edredoes", nome:"Edredão Branco",    desc:"Edredão acolchoado, quente e leve, para as noites frias de inverno.", preco:39.99, img:"images/edredao.webp" },
  { id:"pantufas-malha", cat:"pantufas", nome:"Pantufas de Malha", desc:"Pantufas em malha azul com forro interior macio e quente.",            preco:6.99,  img:"images/pantufas.webp" }
];

export const CATEGORIAS = { lencois:"Lençóis", jogos:"Jogos de Cama", edredoes:"Edredões e Mantas", banho:"Banho", pantufas:"Pantufas" };
