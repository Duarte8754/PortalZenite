// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyAk2_prEtJXNPanJFRGHxbQqXi1TVhX0e8",
  authDomain: "portal-de-aluno-zenite-e816a.firebaseapp.com",
  projectId: "portal-de-aluno-zenite-e816a",
  storageBucket: "portal-de-aluno-zenite-e816a.firebasestorage.app",
  messagingSenderId: "491945820334",
  appId: "1:491945820334:web:9032740671388bbf056d3f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= ELEMENTOS DOM =================
// INSCRIÇÃO
const formInscricao = document.getElementById('formInscricao');
const nome = document.getElementById('nome');
const email = document.getElementById('email');
const telefone = document.getElementById('telefone');
const whatsapp = document.getElementById('whatsapp');
const paiMae = document.getElementById('paiMae');
const classe = document.getElementById('classe');
const nascimento = document.getElementById('nascimento');

// LOGIN
const formLogin = document.getElementById('formLogin');
const loginUsuario = document.getElementById('loginUsuario');
const loginSenha = document.getElementById('loginSenha');

// PAINEL ALUNO
const perfilNome = document.getElementById('perfilNome');
const perfilNumero = document.getElementById('perfilNumero');
const perfilClasse = document.getElementById('perfilClasse');
const perfilTurma = document.getElementById('perfilTurma');
const perfilNascimento = document.getElementById('perfilNascimento');
const perfilContato = document.getElementById('perfilContato');
const listaNotas = document.getElementById('listaNotas');
const mediaFinalAluno = document.getElementById('mediaFinalAluno');
const statusAcademicoAluno = document.getElementById('statusAcademicoAluno');
const listaPagamentos = document.getElementById('listaPagamentos');

// PAINEL ADMIN
const tabelaAlunos = document.getElementById('tabelaAlunos');

// ================= NAVEGAÇÃO =================
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

function mostrarAba(id) {
  document.querySelectorAll('.aba').forEach(a => a.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// ================= FUNÇÕES AUXILIARES =================
function gerarNumeroAluno() {
  return '2007' + Math.floor(10000 + Math.random() * 90000);
}
function gerarSenha() {
  return Math.random().toString(36).slice(-8);
}

// ================= INSCRIÇÃO =================
formInscricao.addEventListener('submit', async (e) => {
  e.preventDefault();

  const disciplinas = [...document.querySelectorAll('input[name="disciplinas"]:checked')].map(d => d.value);
  if (!disciplinas.length) {
    Swal.fire('Erro', 'Selecione pelo menos uma disciplina', 'error');
    return;
  }

  const aluno = {
    nome: nome.value,
    email: email.value,
    telefone: telefone.value,
    whatsapp: whatsapp.value,
    paiMae: paiMae.value,
    classe: classe.value,
    nascimento: nascimento.value,
    disciplina: disciplinas,
    turma: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    numero: gerarNumeroAluno(),
    senha: gerarSenha(),
    ativo: true,
    confirmado: false,
    divida: 5000,
    statusAcademico: 'Reprovado'
  };

  await db.collection('alunos').doc(aluno.numero).set(aluno);

  Swal.fire({
    title: 'Inscrição concluída',
    html: `<b>Número:</b> ${aluno.numero}<br><b>Senha:</b> ${aluno.senha}`,
    icon: 'success'
  });

  formInscricao.reset();
  mostrarPagina('home');
});

// ================= LOGIN =================
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = loginUsuario.value;
  const senha = loginSenha.value;

  // ADMIN
  if (usuario === 'zenite' && senha === 'adminzenite') {
    Swal.fire('Bem-vindo Admin', 'Login confirmado', 'success');
    mostrarPainelAdmin();
    return;
  }

  let aluno = null;
  const snapEmail = await db.collection('alunos').where('email', '==', usuario).get();
  if (!snapEmail.empty) aluno = snapEmail.docs[0].data();
  else {
    const doc = await db.collection('alunos').doc(usuario).get();
    if (doc.exists) aluno = doc.data();
  }

  if (!aluno || aluno.senha !== senha) {
    Swal.fire('Erro', 'Credenciais inválidas', 'error');
    return;
  }

  const confirm = await Swal.fire({
    title: 'Confirmar login',
    text: `Entrar como ${aluno.nome}?`,
    icon: 'question',
    showCancelButton: true
  });

  if (!confirm.isConfirmed) return;

  mostrarPainelAluno(aluno);
});

// ================= PAINEL ALUNO =================
async function mostrarPainelAluno(aluno) {
  mostrarPagina('painelAluno');

  perfilNome.innerText = aluno.nome;
  perfilNumero.innerText = aluno.numero;
  perfilClasse.innerText = aluno.classe;
  perfilTurma.innerText = aluno.turma;
  perfilNascimento.innerText = aluno.nascimento;
  perfilContato.innerText = `${aluno.telefone} / ${aluno.whatsapp}`;

  listaNotas.innerHTML = '';
  let soma = 0, qtd = 0;

  const notasSnap = await db.collection('notas').where('numero', '==', aluno.numero).get();
  notasSnap.forEach(n => {
    listaNotas.innerHTML += `<p>${n.data().disciplina}: ${n.data().nota}</p>`;
    soma += n.data().nota;
    qtd++;
  });

  const media = qtd ? (soma / qtd).toFixed(1) : '-';
  mediaFinalAluno.innerText = media;

  let status = 'Reprovado';
  if (aluno.divida > 0) status = 'Bloqueado';
  else if (media >= 10) status = 'Aprovado';

  statusAcademicoAluno.innerText = status;
  mostrarAba('perfil');
}

// ===== BOTÕES DO ALUNO =====
async function mostrarPagamentosAluno() {
  mostrarAba('pagamentos');
  listaPagamentos.innerHTML = '';

  const numero = perfilNumero.innerText;
  const snap = await db.collection('pagamentos').where('numero', '==', numero).get();
  snap.forEach(p => {
    listaPagamentos.innerHTML += `<p>${p.data().data} - ${p.data().valor} MT</p>`;
  });
}

async function atualizarDadosAluno() {
  const numero = perfilNumero.innerText;

  const { value: dados } = await Swal.fire({
    title: 'Atualizar contacto',
    html: `
      <input id="tel" class="swal2-input" placeholder="Telefone">
      <input id="whats" class="swal2-input" placeholder="WhatsApp">
    `,
    preConfirm: () => ({
      telefone: document.getElementById('tel').value,
      whatsapp: document.getElementById('whats').value
    }),
    showCancelButton: true
  });

  if (!dados) return;

  await db.collection('alunos').doc(numero).update(dados);
  Swal.fire('Atualizado', 'Dados alterados', 'success');
}

// ================= PAINEL ADMIN =================
async function mostrarPainelAdmin() {
  mostrarPagina('painelAdmin');
  tabelaAlunos.innerHTML = `
    <tr>
      <th>Nome</th><th>Número</th><th>Status</th><th>Dívida</th><th>Ações</th>
    </tr>`;

  const snap = await db.collection('alunos').get();
  snap.forEach(doc => {
    const a = doc.data();
    tabelaAlunos.innerHTML += `
      <tr>
        <td>${a.nome}</td>
        <td>${a.numero}</td>
        <td>${a.ativo ? 'Ativo' : 'Suspenso'}</td>
        <td>${a.divida} MT</td>
        <td>
          <button onclick="confirmar('${a.numero}')">Confirmar</button>
          <button onclick="verFormulario('${a.numero}')">Ver</button>
          <button onclick="registrarPagamento('${a.numero}')">Pagamento</button>
          <button onclick="editarDivida('${a.numero}')">Dívida</button>
          <button onclick="editarPlano('${a.numero}')">Plano</button>
          <button onclick="suspender('${a.numero}', ${a.ativo})">${a.ativo ? 'Suspender' : 'Ativar'}</button>
          <button onclick="fecharAno('${a.numero}')">Fechar</button>
          <button onclick="excluir('${a.numero}')">Excluir</button>
        </td>
      </tr>`;
  });
}

// ===== FUNÇÕES ADMIN =====
async function confirmar(n) {
  await db.collection('alunos').doc(n).update({ confirmado: true });
  Swal.fire('Confirmado', 'Matrícula validada', 'success');
  mostrarPainelAdmin();
}

async function verFormulario(n) {
  const doc = await db.collection('alunos').doc(n).get();
  if (!doc.exists) return;
  const a = doc.data();

  Swal.fire({
    title: 'Dados do Aluno',
    html: `
      <p><b>Nome:</b> ${a.nome}</p>
      <p><b>Email:</b> ${a.email}</p>
      <p><b>Classe:</b> ${a.classe}</p>
      <p><b>Disciplinas:</b> ${a.disciplina.join(', ')}</p>
      <p><b>Dívida:</b> ${a.divida} MT</p>
    `,
    icon: 'info'
  });
}

async function registrarPagamento(n) {
  const { value } = await Swal.fire({ title: 'Valor pago', input: 'number', showCancelButton: true });
  if (!value) return;

  const ref = db.collection('alunos').doc(n);
  const doc = await ref.get();
  await ref.update({ divida: Math.max(doc.data().divida - value, 0) });

  await db.collection('pagamentos').add({
    numero: n,
    valor: Number(value),
    data: new Date().toLocaleDateString()
  });

  Swal.fire('Pago', 'Pagamento registado', 'success');
  mostrarPainelAdmin();
}

async function editarDivida(n) {
  const { value } = await Swal.fire({ title: 'Nova dívida', input: 'number', showCancelButton: true });
  if (value !== undefined) {
    await db.collection('alunos').doc(n).update({ divida: Number(value) });
    Swal.fire('Atualizado', 'Dívida alterada', 'success');
    mostrarPainelAdmin();
  }
}

async function editarPlano(n) {
  const { value } = await Swal.fire({
    title: 'Plano',
    input: 'select',
    inputOptions: { Basico: 'Básico', Premium: 'Premium', VIP: 'VIP' },
    showCancelButton: true
  });
  if (!value) return;
  await db.collection('alunos').doc(n).update({ plano: value });
  Swal.fire('Atualizado', 'Plano alterado', 'success');
  mostrarPainelAdmin();
}

async function suspender(n, ativo) {
  await db.collection('alunos').doc(n).update({ ativo: !ativo });
  Swal.fire('Sucesso', 'Estado alterado', 'success');
  mostrarPainelAdmin();
}

async function fecharAno(n) {
  await db.collection('alunos').doc(n).update({ encerrado: true, ativo: false });
  Swal.fire('Concluído', 'Ano letivo encerrado', 'success');
  mostrarPainelAdmin();
}

async function excluir(n) {
  await db.collection('alunos').doc(n).delete();
  Swal.fire('Excluído', 'Aluno removido', 'success');
  mostrarPainelAdmin();
}

// ================= LOGOUT =================
function sair() {
  Swal.fire('Sessão encerrada', '', 'info');
  mostrarPagina('home');
  }
