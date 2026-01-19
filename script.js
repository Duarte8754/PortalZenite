// ===== FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyAk2_prEtJXNPanJFRGHxbQqXi1TVhX0e8",
  authDomain: "portal-de-aluno-zenite-e816a.firebaseapp.com",
  projectId: "portal-de-aluno-zenite-e816a",
  storageBucket: "portal-de-aluno-zenite-e816a.firebasestorage.app",
  messagingSenderId: "491945820334",
  appId: "1:491945820334:web:9032740671388bbf056d3f"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== NAVEGAÇÃO =====
function mostrarPagina(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function mostrarInscricao(){ mostrarPagina('inscricao'); }
function mostrarLogin(){ mostrarPagina('login'); }
function voltarHome(){ mostrarPagina('home'); }
function mostrarAba(abaId){
  document.querySelectorAll('.aba').forEach(a=>a.style.display='none');
  document.getElementById(abaId).style.display='block';
}

// ===== FUNÇÕES AUXILIARES =====
function gerarNumeroAluno(){
  return '2007' + Math.floor(10000 + Math.random() * 90000);
}
function gerarSenha(){
  return Math.random().toString(36).slice(-8);
}
async function avaliarAluno(numero, mediaFinal, divida){
  let status = 'Reprovado';
  if(divida > 0) status = 'Bloqueado';
  else if(mediaFinal >= 10) status = 'Aprovado';
  await db.collection('alunos').doc(numero).update({ statusAcademico: status });
  return status;
}

// ===== INSCRIÇÃO =====
document.getElementById('formInscricao').addEventListener('submit', async e=>{
  e.preventDefault();
  try{
    const checks = document.querySelectorAll('#disciplinasCheckboxes input[name="disciplinas"]:checked');
    if(!checks.length){ alert('Selecione pelo menos uma disciplina'); return; }

    const aluno = {
      nome: nome.value,
      email: email.value,
      telefone: telefone.value,
      whatsapp: whatsapp.value,
      paiMae: paiMae.value,
      classe: classe.value,
      disciplina: Array.from(checks).map(c=>c.value),
      nascimento: nascimento.value,
      turma: ['A','B','C'][Math.floor(Math.random()*3)],
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

    if(typeof Swal !== 'undefined'){
      Swal.fire({
        icon:'success',
        title:'Inscrição realizada',
        html:`Número: <b>${aluno.numero}</b><br>Senha: <b>${aluno.senha}</b>`
      });
    } else {
      alert(`Número: ${aluno.numero}\nSenha: ${aluno.senha}`);
    }

    formInscricao.reset();
    voltarHome();

  }catch(err){
    alert(err.message);
    console.error(err);
  }
});

// ===== LOGIN =====
document.getElementById('formLogin').addEventListener('submit', async e=>{
  e.preventDefault();
  const usuario = loginUsuario.value;
  const senha = loginSenha.value;

  try{
    // ADMIN
    if(usuario === 'zenite' && senha === 'adminzenite'){
      mostrarPainelAdmin();
      return;
    }

    // ALUNO
    let alunoData = null;
    const snapEmail = await db.collection('alunos').where('email','==',usuario).get();

    if(!snapEmail.empty){
      const data = snapEmail.docs[0].data();
      if(data.senha !== senha) throw new Error('Senha incorreta');
      alunoData = data;
    } else {
      const doc = await db.collection('alunos').doc(usuario).get();
      if(!doc.exists) throw new Error('Aluno não encontrado');
      if(doc.data().senha !== senha) throw new Error('Senha incorreta');
      alunoData = doc.data();
    }

    mostrarPainelAluno(alunoData);

  }catch(err){
    alert(err.message);
  }
});

// ===== PAINEL ALUNO =====
async function mostrarPainelAluno(aluno){
  mostrarPagina('painelAluno');

  perfilNome.innerText = aluno.nome;
  perfilNumero.innerText = aluno.numero;
  perfilClasse.innerText = aluno.classe;
  perfilTurma.innerText = aluno.turma;
  perfilNascimento.innerText = aluno.nascimento;
  perfilContato.innerText = `${aluno.telefone} / ${aluno.whatsapp}`;

  listaNotas.innerHTML = '';

  const notasSnap = await db.collection('notas').where('numero','==',aluno.numero).get();
  const tabela = document.createElement('table');
  tabela.innerHTML = `<tr><th>Disciplina</th><th>Nota</th></tr>`;

  let soma = 0, qtd = 0;
  notasSnap.forEach(d=>{
    tabela.innerHTML += `<tr><td>${d.data().disciplina}</td><td>${d.data().nota}</td></tr>`;
    soma += d.data().nota;
    qtd++;
  });

  const media = qtd ? (soma/qtd).toFixed(1) : '-';
  mediaFinalAluno.innerText = media;

  if(media !== '-'){
    const status = await avaliarAluno(aluno.numero, media, aluno.divida);
    statusAcademicoAluno.innerText = status;
  }

  listaNotas.appendChild(tabela);
  mostrarAba('perfil');
}

// ===== PAINEL ADMIN =====
async function mostrarPainelAdmin(){
  mostrarPagina('painelAdmin');

  tabelaAlunos.innerHTML =
    `<tr><th>Nome</th><th>Número</th><th>Status</th><th>Ações</th></tr>`;

  const snap = await db.collection('alunos').get();
  snap.forEach(doc=>{
    const a = doc.data();
    tabelaAlunos.innerHTML += `
      <tr>
        <td>${a.nome}</td>
        <td>${a.numero}</td>
        <td>${a.ativo?'Ativo':'Suspenso'}</td>
        <td>
          <button onclick="confirmar('${a.numero}')">Confirmar</button>
          <button onclick="registrarPagamento('${a.numero}')">Pagamento</button>
          <button onclick="suspender('${a.numero}',${a.ativo})">
            ${a.ativo?'Suspender':'Ativar'}
          </button>
          <button onclick="excluir('${a.numero}')">Excluir</button>
        </td>
      </tr>`;
  });
}

// ===== FUNÇÕES ADMIN =====
async function confirmar(n){ await db.collection('alunos').doc(n).update({confirmado:true}); alert('Confirmado'); mostrarPainelAdmin(); }
async function suspender(n,a){ await db.collection('alunos').doc(n).update({ativo:!a}); mostrarPainelAdmin(); }
async function excluir(n){ if(confirm('Excluir aluno?')){ await db.collection('alunos').doc(n).delete(); mostrarPainelAdmin(); } }
async function registrarPagamento(n){
  const v = prompt('Valor pago');
  if(!v) return;
  await db.collection('pagamentos').add({numero:n, valor:+v, data:new Date().toLocaleDateString()});
  alert('Pagamento registrado');
}

// ===== LOGOUT =====
function sair(){
  mostrarPagina('home');
    }
