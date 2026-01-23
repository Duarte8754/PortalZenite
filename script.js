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

// ================= LOGOUT =================
function sair() {
  mostrarPagina('home');
}
