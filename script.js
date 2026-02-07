/*********************************
 * 🔥 FIREBASE CONFIG
 *********************************/
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

/*********************************
 * 🧭 NAVEGAÇÃO (SPA)
 *********************************/
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
  localStorage.setItem('paginaAtual', id);
}

window.addEventListener('DOMContentLoaded', () => {
  mostrarPagina(localStorage.getItem('paginaAtual') || 'home');
});

/*********************************
 * 🔔 ALERTA GLOBAL
 *********************************/
function mostrarAlerta(titulo, mensagem, tipo = 'sucesso') {
  const alerta = document.getElementById('alertaGlobal');
  if (!alerta) return alert(mensagem);

  alerta.querySelector('.titulo').innerText = titulo;
  alerta.querySelector('.mensagem').innerText = mensagem;
  alerta.className = `alerta ${tipo}`;
  alerta.style.display = 'flex';
}

function fecharAlerta() {
  const alerta = document.getElementById('alertaGlobal');
  if (alerta) alerta.style.display = 'none';
}

/*********************************
 * 📦 MODAL
 *********************************/
function abrirModal(titulo, conteudo) {
  document.getElementById('modalTitulo').innerText = titulo;
  document.getElementById('conteudoFormulario').innerHTML = conteudo;
  document.getElementById('modalFormulario').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalFormulario').style.display = 'none';
}

/*********************************
 * 🧠 UTILITÁRIOS
 *********************************/
function gerarNumeroAluno() {
  return '2007' + Math.floor(10000 + Math.random() * 90000);
}

function calcularMedia(valores) {
  const nums = valores.filter(v => !isNaN(v));
  if (!nums.length) return '-';
  return (nums.reduce((a,b)=>a+b,0) / nums.length).toFixed(1);
}

/*********************************
 * 📝 INSCRIÇÃO
 *********************************/
document.getElementById('formInscricao')?.addEventListener('submit', async e => {
  e.preventDefault();

  const dados = {
    nome: nome.value.trim(),
    apelido: apelido.value.trim(),
    email: email.value.trim(),
    telefone: telefone.value.trim(),
    classe: classe.value,
    curso: curso.value || 'Geral',
    disciplinas: [...document.querySelectorAll('input[name="disciplinas"]:checked')].map(d=>d.value),
    numeroAluno: gerarNumeroAluno(),
    ativo: true,
    statusAcademico: '-',
    divida: 0,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!dados.nome || !dados.apelido || !dados.email || !dados.classe || !dados.disciplinas.length) {
    mostrarAlerta('Erro', 'Preencha todos os campos obrigatórios', 'erro');
    return;
  }

  try {
    await db.collection('alunos').doc(dados.numeroAluno).set({
      ...dados,
      senha: dados.numeroAluno // ⚠️ produção real → Firebase Auth
    });

    mostrarAlerta(
      'Sucesso',
      `Aluno inscrito\nNúmero: ${dados.numeroAluno}\nSenha: ${dados.numeroAluno}`
    );
    e.target.reset();
  } catch (err) {
    mostrarAlerta('Erro', err.message, 'erro');
  }
});

/*********************************
 * 🔐 LOGIN
 *********************************/
document.getElementById('formLogin')?.addEventListener('submit', async e => {
  e.preventDefault();

  const usuario = loginUsuario.value.trim();
  const senha = loginSenha.value.trim();

  // ADMIN
  if (usuario === 'zenite' && senha === 'adminzenite') {
    mostrarPainelAdmin();
    return;
  }

  try {
    const doc = await db.collection('alunos').doc(usuario).get();
    if (!doc.exists) throw new Error('Aluno não encontrado');
    if (doc.data().senha !== senha) throw new Error('Senha incorreta');

    mostrarPainelAluno(doc.data());
  } catch (err) {
    mostrarAlerta('Erro', err.message, 'erro');
  }
});

/*********************************
 * 🎓 PAINEL DO ALUNO
 *********************************/
async function mostrarPainelAluno(aluno) {
  mostrarPagina('painelAluno');

  perfilNome.innerText = aluno.nome;
  perfilNumero.innerText = aluno.numeroAluno;
  perfilClasse.innerText = aluno.classe;
  perfilTurma.innerText = aluno.turma || '-';

  const tbody = document.querySelector('#tabelaNotas tbody');
  tbody.innerHTML = '';

  const notasSnap = await db.collection('notas')
    .where('numeroAluno', '==', aluno.numeroAluno).get();

  let medias = [];

  notasSnap.forEach(doc => {
    const n = doc.data();
    const media = calcularMedia([n.teste1, n.teste2, n.trabalho, n.final]);
    medias.push(parseFloat(media));

    tbody.innerHTML += `
      <tr>
        <td>${n.disciplina}</td>
        <td>${n.trimestre}</td>
        <td>${n.teste1}</td>
        <td>${n.teste2}</td>
        <td>${n.trabalho}</td>
        <td>${n.final}</td>
        <td>${media}</td>
      </tr>`;
  });

  const mediaFinal = calcularMedia(medias);
  mediaFinalAluno.innerText = mediaFinal;
  statusAcademicoAluno.innerText = mediaFinal >= 10 ? 'Aprovado' : 'Reprovado';
}

/*********************************
 * 🛠️ PAINEL ADMIN
 *********************************/
async function mostrarPainelAdmin() {
  mostrarPagina('painelAdmin');

  const tabela = document.getElementById('tabelaAlunos');
  tabela.innerHTML = `
    <tr>
      <th>Nome</th><th>Número</th><th>Status</th><th>Dívida</th><th>Ações</th>
    </tr>`;

  const snap = await db.collection('alunos').get();

  snap.forEach(doc => {
    const a = doc.data();
    tabela.innerHTML += `
      <tr>
        <td>${a.nome}</td>
        <td>${doc.id}</td>
        <td>${a.ativo ? 'Ativo' : 'Suspenso'}</td>
        <td>${a.divida}</td>
        <td>
          <button onclick="verFormulario('${doc.id}')">Ver</button>
          <button onclick="suspender('${doc.id}', ${a.ativo})">${a.ativo?'Suspender':'Ativar'}</button>
          <button onclick="excluir('${doc.id}')">Excluir</button>
        </td>
      </tr>`;
  });
}

/*********************************
 * ⚙️ FUNÇÕES ADMIN
 *********************************/
async function suspender(id, ativo) {
  await db.collection('alunos').doc(id).update({ ativo: !ativo });
  mostrarPainelAdmin();
}

async function excluir(id) {
  if (!confirm('Excluir aluno?')) return;
  await db.collection('alunos').doc(id).delete();
  mostrarPainelAdmin();
}

async function verFormulario(id) {
  const doc = await db.collection('alunos').doc(id).get();
  if (!doc.exists) return;

  const a = doc.data();
  abrirModal('Formulário do Aluno', `
    <p><b>Nome:</b> ${a.nome} ${a.apelido}</p>
    <p><b>Email:</b> ${a.email}</p>
    <p><b>Classe:</b> ${a.classe}</p>
    <p><b>Curso:</b> ${a.curso}</p>
    <p><b>Disciplinas:</b> ${a.disciplinas.join(', ')}</p>
  `);
    }
