// FIREBASE
firebase.initializeApp({
  apiKey: "AIzaSyAk2_prEtJXNPanJFRGHxbQqXi1TVhX0e8",
  authDomain: "portal-de-aluno-zenite-e816a.firebaseapp.com",
  projectId: "portal-de-aluno-zenite-e816a"
});
const db = firebase.firestore();

// EFEITO DIGITAÇÃO
const text = "Portal Zênite";
let i = 0;
function typing(){
  if(i < text.length){
    document.getElementById("typing").innerHTML += text[i++];
    setTimeout(typing,120);
  }
}
typing();

// NAVEGAÇÃO
function mostrarPagina(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function mostrarAba(id){
  document.querySelectorAll('.aba').forEach(a=>a.style.display='none');
  document.getElementById(id).style.display='block';
}
function logout(){
  Swal.fire({title:'Sessão encerrada', width:300});
  mostrarPagina('home');
}

// GERADORES
function gerarNumero(){
  return '2007' + Math.floor(10000 + Math.random()*90000);
}
function gerarSenha(nome, numero){
  return nome.split(' ')[0].toLowerCase()+numero+'@IZ.com';
}

// INSCRIÇÃO
formInscricao.onsubmit = async e=>{
  e.preventDefault();

  const disciplinas=[...document.querySelectorAll('input[type=checkbox]:checked')].map(c=>c.value);
  if(!disciplinas.length){
    Swal.fire({title:'Selecione disciplinas', width:300});
    return;
  }

  const numero = gerarNumero();
  const senha = gerarSenha(nome.value, numero);

  await db.collection('alunos').doc(numero).set({
    nome:nome.value,
    email:email.value,
    telefone:telefone.value,
    whatsapp:whatsapp.value,
    paiMae:paiMae.value,
    classe:classe.value,
    nascimento:nascimento.value,
    disciplina:disciplinas,
    numero, senha,
    divida:0,
    ativo:true
  });

  Swal.fire({title:'Inscrição feita', html:`Senha: ${senha}`, width:300});
  mostrarPagina('home');
};

// LOGIN
formLogin.onsubmit = async e=>{
  e.preventDefault();

  if(loginUsuario.value==='zenite' && loginSenha.value==='adminzenite'){
    carregarAdmin();
    mostrarPagina('painelAdmin');
    return;
  }

  const doc = await db.collection('alunos').doc(loginUsuario.value).get();
  if(!doc.exists || doc.data().senha!==loginSenha.value){
    Swal.fire({title:'Credenciais inválidas', width:300});
    return;
  }

  const aluno = doc.data();
  const c = await Swal.fire({
    title:`Entrar como ${aluno.nome}?`,
    showCancelButton:true,
    width:300
  });
  if(!c.isConfirmed) return;

  carregarAluno(aluno);
};

// PAINEL ALUNO
function carregarAluno(a){
  mostrarPagina('painelAluno');
  document.getElementById('perfil').innerHTML = `
    <p>${a.nome}</p>
    <p>${a.numero}</p>
    <p>${a.classe}</p>
  `;
  document.getElementById('divida').innerHTML = `Dívida: ${a.divida}`;
  mostrarAba('perfil');
}

// ADMIN
async function carregarAdmin(){
  const t = document.getElementById('tabelaAlunos');
  t.innerHTML='<tr><th>Nome</th><th>Número</th><th>Ação</th></tr>';

  const snap = await db.collection('alunos').get();
  snap.forEach(d=>{
    const a=d.data();
    t.innerHTML+=`
      <tr>
        <td>${a.nome}</td>
        <td>${a.numero}</td>
        <td><button onclick="prepararNota('${a.numero}')">Nota</button></td>
      </tr>`;
  });
}

async function prepararNota(n){
  document.getElementById('notaAluno').value=n;
  const s=document.getElementById('notaDisciplina');
  s.innerHTML='';
  const doc=await db.collection('alunos').doc(n).get();
  doc.data().disciplina.forEach(d=>{
    s.innerHTML+=`<option>${d}</option>`;
  });
}

async function salvarNota(){
  await db.collection('notas').add({
    numero:notaAluno.value,
    disciplina:notaDisciplina.value,
    nota:Number(notaValor.value),
    trimestre:notaTrimestre.value
  });
  Swal.fire({title:'Nota salva', width:300});
    }
