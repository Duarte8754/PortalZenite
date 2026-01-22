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

// PAINEL ADMIN
const tabelaAlunos = document.getElementById('tabelaAlunos');

// ================= NAVEGAÇÃO =================
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function mostrarInscricao() { mostrarPagina('inscricao'); }
function mostrarLogin() { mostrarPagina('login'); }
function voltarHome() { mostrarPagina('home'); }

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

async function avaliarAluno(numero, mediaFinal, divida) {
  let status = 'Reprovado';
  if (divida > 0) status = 'Bloqueado';
  else if (mediaFinal >= 10) status = 'Aprovado';

  await db.collection('alunos').doc(numero).update({ statusAcademico: status });
  return status;
}

// ================= INSCRIÇÃO =================
formInscricao.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const checks = document.querySelectorAll('#disciplinasCheckboxes input[name="disciplinas"]:checked');
    if (!checks.length) {
      alert('Selecione pelo menos uma disciplina');
      return;
    }

    const aluno = {
      nome: nome.value,
      email: email.value,
      telefone: telefone.value,
      whatsapp: whatsapp.value,
      paiMae: paiMae.value,
      classe: classe.value,
      disciplina: Array.from(checks).map(c => c.value),
      nascimento: nascimento.value,
      turma: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      dataInscricao: new Date().toLocaleDateString(),
      numero: gerarNumeroAluno(),
      senha: gerarSenha(),
      ativo: true,
      confirmado: false,
      divida: 0,
      planoPagamento: { total: 5000, parcelas: 5 },
      statusAcademico: 'Reprovado'
    };

    await db.collection('alunos').doc(aluno.numero).set(aluno);

    alert(`Inscrição realizada!\nNúmero: ${aluno.numero}\nSenha: ${aluno.senha}`);

    formInscricao.reset();
    voltarHome();

  } catch (err) {
    alert(err.message);
    console.error(err);
  }
});

// ================= LOGIN =================
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = loginUsuario.value;
  const senha = loginSenha.value;

  try {
    // ADMIN
    if (usuario === 'zenite' && senha === 'adminzenite') {
      mostrarPainelAdmin();
      return;
    }

    // ALUNO
    let alunoData = null;

    const snapEmail = await db.collection('alunos').where('email', '==', usuario).get();
    if (!snapEmail.empty) {
      alunoData = snapEmail.docs[0].data();
      if (alunoData.senha !== senha) throw new Error('Senha incorreta');
    } else {
      const doc = await db.collection('alunos').doc(usuario).get();
      if (!doc.exists) throw new Error('Aluno não encontrado');
      if (doc.data().senha !== senha) throw new Error('Senha incorreta');
      alunoData = doc.data();
    }

    mostrarPainelAluno(alunoData);

  } catch (err) {
    alert(err.message);
  }
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

  const notasSnap = await db.collection('notas').where('numero', '==', aluno.numero).get();

  let soma = 0, qtd = 0;
  const tabela = document.createElement('table');
  tabela.innerHTML = `<tr><th>Disciplina</th><th>Nota</th></tr>`;

  notasSnap.forEach(d => {
    tabela.innerHTML += `<tr><td>${d.data().disciplina}</td><td>${d.data().nota}</td></tr>`;
    soma += d.data().nota;
    qtd++;
  });

  listaNotas.appendChild(tabela);

  const media = qtd ? Number((soma / qtd).toFixed(1)) : null;
  mediaFinalAluno.innerText = media ?? '-';

  if (media !== null) {
    const status = await avaliarAluno(aluno.numero, media, aluno.divida);
    statusAcademicoAluno.innerText = status;
  }

  mostrarAba('perfil');
}

// ================= PAINEL ADMIN =================
async function mostrarPainelAdmin() {
  mostrarPagina('painelAdmin');

  tabelaAlunos.innerHTML = `
    <tr>
      <th>Nome</th>
      <th>Número</th>
      <th>Status</th>
      <th>Ações</th>
    </tr>`;

  const snap = await db.collection('alunos').get();
  snap.forEach(doc => {
    const a = doc.data();
    tabelaAlunos.innerHTML += `
      <tr>
  <td>${a.nome}</td>
  <td>${a.numero}</td>
  <td>${a.ativo ? 'Ativo' : 'Suspenso'}</td>
  <td>${a.statusAcademico}</td>
  <td>${a.divida}</td>
  <td>
    <button onclick="confirmar('${a.numero}')">Confirmar</button>
    <button onclick="verFormulario('${a.numero}')">Ver Formulário</button>
    <button onclick="registrarPagamento('${a.numero}')">Registrar Pagamento</button>
    <button onclick="editarPlano('${a.numero}')">Editar Plano</button>
    <button onclick="suspender('${a.numero}', ${a.ativo})">
      ${a.ativo ? 'Suspender' : 'Ativar'}
    </button>
    <button onclick="excluir('${a.numero}')">Excluir</button>
    <button onclick="editarDivida('${a.numero}')">Editar Dívida</button>
    <button onclick="fecharAno('${a.numero}')">Fechar Ano</button>
  </td>
`;
}

// ===== FUNÇÕES ADMINISTRADOR (COM ALERT PERSONALIZADO) =====

// CONFIRMAR MATRÍCULA
async function confirmar(numero){
  const res = await Swal.fire({
    title: 'Confirmar matrícula?',
    text: 'O aluno será oficialmente matriculado.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, confirmar',
    cancelButtonText: 'Cancelar'
  });
  if(!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).update({ confirmado:true });
  Swal.fire('Confirmado!', 'Matrícula confirmada com sucesso.', 'success');
  mostrarPainelAdmin();
}

// VER FORMULÁRIO
async function verFormulario(numero){
  const doc = await db.collection('alunos').doc(numero).get();
  if(!doc.exists){
    Swal.fire('Erro', 'Aluno não encontrado.', 'error');
    return;
  }
  const a = doc.data();

  Swal.fire({
    title: 'Formulário do Aluno',
    html: `
      <p><b>Nome:</b> ${a.nome}</p>
      <p><b>Número:</b> ${a.numero}</p>
      <p><b>Email:</b> ${a.email || '-'}</p>
      <p><b>Telefone:</b> ${a.telefone || '-'}</p>
      <p><b>Classe:</b> ${a.classe}</p>
      <p><b>Dívida:</b> ${a.divida || 0} MT</p>
      <p><b>Status:</b> ${a.ativo ? 'Ativo' : 'Suspenso'}</p>
    `,
    icon: 'info'
  });
}

// REGISTRAR PAGAMENTO
async function registrarPagamento(numero){
  const { value: valor } = await Swal.fire({
    title: 'Registrar pagamento',
    input: 'number',
    inputLabel: 'Valor pago (MT)',
    inputPlaceholder: 'Ex: 180',
    showCancelButton: true
  });
  if(!valor) return;

  await db.collection('pagamentos').add({
    numero,
    valor: parseFloat(valor),
    data: new Date().toLocaleDateString(),
    status: 'Pago'
  });

  Swal.fire('Sucesso!', 'Pagamento registrado com sucesso.', 'success');
  mostrarPainelAdmin();
}

// EDITAR PLANO
async function editarPlano(numero){
  const { value: plano } = await Swal.fire({
    title: 'Editar plano',
    input: 'select',
    inputOptions: {
      Basico: 'Básico',
      Premium: 'Premium',
      VIP: 'VIP'
    },
    inputPlaceholder: 'Selecione o plano',
    showCancelButton: true
  });
  if(!plano) return;

  await db.collection('alunos').doc(numero).update({ plano });
  Swal.fire('Atualizado!', 'Plano alterado com sucesso.', 'success');
  mostrarPainelAdmin();
}

// SUSPENDER / ATIVAR
async function suspender(numero, ativo){
  const acao = ativo ? 'Suspender' : 'Ativar';
  const res = await Swal.fire({
    title: `${acao} aluno?`,
    text: `Deseja ${acao.toLowerCase()} este aluno?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: acao,
    cancelButtonText: 'Cancelar'
  });
  if(!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).update({ ativo: !ativo });
  Swal.fire('Sucesso!', `Aluno ${ativo ? 'suspenso' : 'ativado'}.`, 'success');
  mostrarPainelAdmin();
}

// EXCLUIR ALUNO
async function excluir(numero){
  const res = await Swal.fire({
    title: 'Excluir aluno?',
    text: 'Essa ação não pode ser desfeita!',
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'Excluir',
    cancelButtonText: 'Cancelar'
  });
  if(!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).delete();
  Swal.fire('Excluído!', 'Aluno removido com sucesso.', 'success');
  mostrarPainelAdmin();
}

// EDITAR DÍVIDA
async function editarDivida(numero){
  const { value: divida } = await Swal.fire({
    title: 'Editar dívida',
    input: 'number',
    inputLabel: 'Valor da dívida (MT)',
    showCancelButton: true
  });
  if(divida === undefined) return;

  await db.collection('alunos').doc(numero).update({ divida: parseFloat(divida) });
  Swal.fire('Atualizado!', 'Dívida atualizada com sucesso.', 'success');
  mostrarPainelAdmin();
}

// FECHAR ANO LETIVO
async function fecharAno(numero){
  const res = await Swal.fire({
    title: 'Fechar ano letivo?',
    text: 'O histórico do aluno será encerrado.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Fechar ano',
    cancelButtonText: 'Cancelar'
  });
  if(!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).update({ encerrado:true });
  Swal.fire('Concluído!', 'Ano letivo encerrado com sucesso.', 'success');
  mostrarPainelAdmin();
}

// ================= LOGOUT =================
function sair() {
  mostrarPagina('home');
}
