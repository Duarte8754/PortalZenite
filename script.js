/***********************
 * FIREBASE CONFIG
 ***********************/
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/***********************
 * ANIMAÇÃO TÍTULO
 ***********************/
const texto = "ZÊNITE PORTAL";
let i = 0;
const titleSpan = document.getElementById("title-text");

function escreverTitulo() {
  if (i < texto.length) {
    titleSpan.innerHTML += texto.charAt(i);
    i++;
    setTimeout(escreverTitulo, 120);
  }
}
escreverTitulo();

/***********************
 * NAVEGAÇÃO DE PÁGINAS
 ***********************/
function mostrarPagina(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function mostrarInscricao() { mostrarPagina("inscricao"); }
function mostrarLogin() { mostrarPagina("login"); }
function voltarHome() { mostrarPagina("home"); }

/***********************
 * GERAR NÚMERO DO ALUNO
 ***********************/
async function gerarNumeroAluno() {
  const snap = await db.collection("alunos").orderBy("numero", "desc").limit(1).get();
  if (snap.empty) return 20070001;
  return snap.docs[0].data().numero + 1;
}

/***********************
 * INSCRIÇÃO
 ***********************/
document.getElementById("formInscricao").addEventListener("submit", async e => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value;
  const whatsapp = document.getElementById("whatsapp").value;
  const paiMae = document.getElementById("paiMae").value;
  const classe = document.getElementById("classe").value;
  const nascimento = document.getElementById("nascimento").value;

  const disciplinas = [...document.querySelectorAll("input[name='disciplinas']:checked")]
    .map(d => d.value);

  if (disciplinas.length === 0) {
    alert("Selecione pelo menos uma disciplina");
    return;
  }

  const numero = await gerarNumeroAluno();
  const primeiroNome = nome.split(" ")[0].toLowerCase();
  const senha = `${primeiroNome}${numero}@IZ.com`;

  // cria auth
  await auth.createUserWithEmailAndPassword(email, senha);

  await db.collection("alunos").add({
    nome,
    email,
    telefone,
    whatsapp,
    paiMae,
    classe,
    nascimento,
    disciplinas,
    numero,
    senha,
    divida: 0,
    status: "Ativo",
    tipo: "aluno"
  });

  alert(
    `Inscrição concluída!\n\nNúmero: ${numero}\nSenha: ${senha}`
  );

  mostrarLogin();
});

/***********************
 * LOGIN
 ***********************/
document.getElementById("formLogin").addEventListener("submit", async e => {
  e.preventDefault();

  const usuario = document.getElementById("loginUsuario").value.trim();
  const senha = document.getElementById("loginSenha").value;

  // login por email
  if (usuario.includes("@")) {
    await auth.signInWithEmailAndPassword(usuario, senha);
    carregarPainelAluno(usuario);
  } else {
    // login por número
    const snap = await db.collection("alunos").where("numero", "==", Number(usuario)).get();
    if (snap.empty) return alert("Aluno não encontrado");

    const aluno = snap.docs[0].data();
    await auth.signInWithEmailAndPassword(aluno.email, senha);
    carregarPainelAluno(aluno.email);
  }
});

/***********************
 * PAINEL ALUNO
 ***********************/
async function carregarPainelAluno(email) {
  const snap = await db.collection("alunos").where("email", "==", email).get();
  const aluno = snap.docs[0].data();

  document.getElementById("perfilNome").innerText = aluno.nome;
  document.getElementById("perfilNumero").innerText = aluno.numero;
  document.getElementById("perfilClasse").innerText = aluno.classe;
  document.getElementById("perfilNascimento").innerText = aluno.nascimento;
  document.getElementById("perfilContato").innerText = aluno.whatsapp;
  document.getElementById("totalDivida").innerText = aluno.divida;

  carregarNotas(aluno);
  carregarExtrato(aluno);
  carregarCalendario();
  carregarHistorico(aluno);

  mostrarPagina("painelAluno");
  mostrarAba("perfil");
}

/***********************
 * ABAS
 ***********************/
function mostrarAba(nome) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById("aba" + nome.charAt(0).toUpperCase() + nome.slice(1)).style.display = "block";
}

/***********************
 * NOTAS + MÉDIA
 ***********************/
async function carregarNotas(aluno) {
  const lista = document.getElementById("listaNotas");
  lista.innerHTML = "";

  const snap = await db.collection("notas")
    .where("numero", "==", aluno.numero).get();

  let soma = 0, qtd = 0;

  snap.forEach(doc => {
    const n = doc.data();
    const div = document.createElement("div");
    div.innerText = `${n.disciplina} | T${n.trimestre} | ${n.tipo}: ${n.nota}`;
    lista.appendChild(div);

    soma += n.nota;
    qtd++;
  });

  if (qtd > 0) {
    const media = (soma / qtd).toFixed(1);
    document.getElementById("mediaFinalAluno").innerText = media;

    const status = media >= 10 ? "Aprovado" : "Perigo de reprovar";
    const span = document.getElementById("statusAcademicoAluno");
    span.innerText = status;
    span.style.color = media >= 10 ? "green" : "red";
  }
}

/***********************
 * ADMIN – DISCIPLINAS DINÂMICAS
 ***********************/
document.getElementById("notaAluno").addEventListener("change", async e => {
  const numero = Number(e.target.value);
  const select = document.getElementById("notaDisciplina");
  select.innerHTML = '<option value="">Selecione a disciplina</option>';

  const snap = await db.collection("alunos").where("numero", "==", numero).get();
  if (snap.empty) return;

  const aluno = snap.docs[0].data();
  aluno.disciplinas.forEach(d => {
    const op = document.createElement("option");
    op.value = d;
    op.innerText = d;
    select.appendChild(op);
  });
});

/***********************
 * LANÇAR NOTA
 ***********************/
document.getElementById("formNota").addEventListener("submit", async e => {
  e.preventDefault();

  await db.collection("notas").add({
    numero: Number(notaAluno.value),
    disciplina: notaDisciplina.value,
    nota: Number(notaValor.value),
    trimestre: Number(notaTrimestre.value),
    tipo: notaTipo.value
  });

  alert("Nota lançada com sucesso");
});

/***********************
 * CALENDÁRIO
 ***********************/
async function carregarCalendario() {
  const lista = document.getElementById("listaCalendario");
  lista.innerHTML = "";

  const snap = await db.collection("calendario").get();
  snap.forEach(doc => {
    const li = document.createElement("li");
    li.innerText = `${doc.data().data} - ${doc.data().evento}`;
    lista.appendChild(li);
  });
}

/***********************
 * EXTRATO
 ***********************/
async function carregarExtrato(aluno) {
  const lista = document.getElementById("listaExtrato");
  lista.innerHTML = "";

  const snap = await db.collection("pagamentos")
    .where("numero", "==", aluno.numero).get();

  snap.forEach(doc => {
    const li = document.createElement("li");
    li.innerText = `${doc.data().data} - ${doc.data().valor} (${doc.data().status})`;
    lista.appendChild(li);
  });
}

/***********************
 * HISTÓRICO
 ***********************/
async function carregarHistorico(aluno) {
  const lista = document.getElementById("listaHistorico");
  lista.innerHTML = "";

  const snap = await db.collection("historico")
    .where("numero", "==", aluno.numero).get();

  snap.forEach(doc => {
    const h = doc.data();
    const li = document.createElement("li");
    li.innerText = `${h.anoLetivo} - ${h.disciplina} - ${h.mediaFinal}`;
    lista.appendChild(li);
  });
}

/***********************
 * LOGOUT
 ***********************/
function logout() {
  auth.signOut();
  mostrarPagina("home");
      }
