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

// ================= NAVEGAÇÃO =================
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');
}

function mostrarAba(id) {
  document.querySelectorAll('.aba').forEach(a => a.style.display = 'none');
  const aba = document.getElementById(id);
  if (aba) aba.style.display = 'block';
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

// ================= PAINEL ADMIN =================
async function mostrarPainelAdmin() {
  mostrarPagina('painelAdmin');

  tabelaAlunos.innerHTML = `
    <tr>
      <th>Nome</th>
      <th>Número</th>
      <th>Conta</th>
      <th>Status</th>
      <th>Dívida</th>
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
        <td>${a.divida} MT</td>
        <td>
          <button onclick="confirmar('${a.numero}')">Confirmar</button>
          <button onclick="verFormulario('${a.numero}')">Ver</button>
          <button onclick="registrarPagamento('${a.numero}')">Pagamento</button>
          <button onclick="suspender('${a.numero}', ${a.ativo})">
            ${a.ativo ? 'Suspender' : 'Ativar'}
          </button>
          <button onclick="excluir('${a.numero}')">Excluir</button>
        </td>
      </tr>`;
  });
}

// ================= PAGAMENTO (CORRIGIDO) =================
async function registrarPagamento(numero) {
  const { value: valor } = await Swal.fire({
    title: 'Registrar pagamento',
    input: 'number',
    inputLabel: 'Valor pago (MT)',
    showCancelButton: true
  });

  if (!valor || valor <= 0) return;

  const ref = db.collection('alunos').doc(numero);
  const doc = await ref.get();
  if (!doc.exists) return;

  const dividaAtual = doc.data().divida || 0;
  const novaDivida = Math.max(dividaAtual - valor, 0);

  await ref.update({ divida: novaDivida });

  await db.collection('pagamentos').add({
    numero,
    valor: Number(valor),
    data: new Date().toLocaleDateString()
  });

  Swal.fire('Sucesso', 'Pagamento registrado!', 'success');
  mostrarPainelAdmin();
  }

async function confirmar(numero) {
  const res = await Swal.fire({
    title: 'Confirmar matrícula?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Confirmar'
  });
  if (!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).update({ confirmado: true });
  Swal.fire('Confirmado', 'Matrícula confirmada', 'success');
  mostrarPainelAdmin();
  }

async function verFormulario(numero) {
  const doc = await db.collection('alunos').doc(numero).get();
  if (!doc.exists) {
    Swal.fire('Erro', 'Aluno não encontrado', 'error');
    return;
  }

  const a = doc.data();
  Swal.fire({
    title: 'Dados do Aluno',
    html: `
      <p><b>Nome:</b> ${a.nome}</p>
      <p><b>Número:</b> ${a.numero}</p>
      <p><b>Email:</b> ${a.email}</p>
      <p><b>Telefone:</b> ${a.telefone}</p>
      <p><b>WhatsApp:</b> ${a.whatsapp}</p>
      <p><b>Classe:</b> ${a.classe}</p>
      <p><b>Turma:</b> ${a.turma}</p>
      <p><b>Disciplinas:</b> ${a.disciplina.join(', ')}</p>
      <p><b>Dívida:</b> ${a.divida} MT</p>
      <p><b>Status:</b> ${a.ativo ? 'Ativo' : 'Suspenso'}</p>
    `,
    icon: 'info'
  });
   }

async function registrarPagamento(numero) {
  const { value: valor } = await Swal.fire({
    title: 'Registrar pagamento',
    input: 'number',
    inputLabel: 'Valor pago (MT)',
    showCancelButton: true
  });

  if (!valor || valor <= 0) return;

  const ref = db.collection('alunos').doc(numero);
  const doc = await ref.get();
  if (!doc.exists) return;

  const dividaAtual = doc.data().divida || 0;
  const novaDivida = Math.max(dividaAtual - valor, 0);

  await ref.update({ divida: novaDivida });

  await db.collection('pagamentos').add({
    numero,
    valor: Number(valor),
    data: new Date().toLocaleDateString(),
    status: 'Pago'
  });

  Swal.fire('Pago', 'Pagamento registrado', 'success');
  mostrarPainelAdmin();
  }

async function editarPlano(numero) {
  const { value: plano } = await Swal.fire({
    title: 'Editar plano',
    input: 'select',
    inputOptions: {
      Basico: 'Básico',
      Premium: 'Premium',
      VIP: 'VIP'
    },
    showCancelButton: true
  });

  if (!plano) return;

  await db.collection('alunos').doc(numero).update({ plano });
  Swal.fire('Atualizado', 'Plano alterado', 'success');
  mostrarPainelAdmin();
  }

async function suspender(numero, ativo) {
  const acao = ativo ? 'Suspender' : 'Ativar';

  const res = await Swal.fire({
    title: `${acao} aluno?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: acao
  });
  if (!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).update({ ativo: !ativo });
  Swal.fire('Sucesso', `Aluno ${acao.toLowerCase()}ado`, 'success');
  mostrarPainelAdmin();
  }

async function editarDivida(numero) {
  const { value: divida } = await Swal.fire({
    title: 'Editar dívida',
    input: 'number',
    inputLabel: 'Nova dívida (MT)',
    showCancelButton: true
  });

  if (divida === undefined) return;

  await db.collection('alunos').doc(numero).update({ divida: Number(divida) });
  Swal.fire('Atualizado', 'Dívida alterada', 'success');
  mostrarPainelAdmin();
  }

async function fecharAno(numero) {
  const res = await Swal.fire({
    title: 'Fechar ano letivo?',
    text: 'O aluno será arquivado',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Fechar'
  });

  if (!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).update({
    encerrado: true,
    ativo: false
  });

  Swal.fire('Concluído', 'Ano letivo encerrado', 'success');
  mostrarPainelAdmin();
  }

async function excluir(numero) {
  const res = await Swal.fire({
    title: 'Excluir aluno?',
    text: 'Essa ação é irreversível!',
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'Excluir'
  });

  if (!res.isConfirmed) return;

  await db.collection('alunos').doc(numero).delete();
  Swal.fire('Excluído', 'Aluno removido', 'success');
  mostrarPainelAdmin();
  }

// ================= LOGOUT =================
function sair() {
  mostrarPagina('home');
}
