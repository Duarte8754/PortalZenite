// ================= FIREBASE =================
firebase.initializeApp({
  apiKey: "AIzaSyAk2_prEtJXNPanJFRGHxbQqXi1TVhX0e8",
  authDomain: "portal-de-aluno-zenite-e816a.firebaseapp.com",
  projectId: "portal-de-aluno-zenite-e816a"
});

const db = firebase.firestore();

// ================= NAVEGAÇÃO =================
function mostrarPagina(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function mostrarAba(id){
  document.querySelectorAll('.aba').forEach(a=>a.style.display='none');
  document.getElementById('aba'+id.charAt(0).toUpperCase()+id.slice(1)).style.display='block';
}

// ================= UTIL =================
function gerarNumeroAluno(){
  return '2007' + Math.floor(10000 + Math.random()*90000);
}

function gerarSenha(nome, numero){
  const primeiroNome = nome.trim().split(' ')[0].toLowerCase();
  return `${primeiroNome}${numero}@IZ.com`;
}

// ================= INSCRIÇÃO =================
document.getElementById('formInscricao').addEventListener('submit', async e=>{
  e.preventDefault();

  const disciplinas = [...document.querySelectorAll('input[name="disciplinas"]:checked')]
    .map(d=>d.value);

  if(!disciplinas.length){
    Swal.fire('Erro','Selecione disciplinas','error');
    return;
  }

  const numero = gerarNumeroAluno();

  const aluno = {
    nome: nome.value,
    email: email.value,
    telefone: telefone.value,
    whatsapp: whatsapp.value,
    paiMae: paiMae.value,
    classe: classe.value,
    nascimento: nascimento.value,
    disciplina: disciplinas,
    numero,
    senha: gerarSenha(nome.value, numero),
    turma: ['A','B','C'][Math.floor(Math.random()*3)],
    divida: 5000,
    ativo: true,
    confirmado: false
  };

  await db.collection('alunos').doc(numero).set(aluno);

  Swal.fire({
    title:'Inscrição concluída',
    html:`<b>Número:</b> ${numero}<br><b>Senha:</b> ${aluno.senha}`,
    icon:'success'
  });

  mostrarPagina('home');
  e.target.reset();
});

// ================= LOGIN =================
document.getElementById('formLogin').addEventListener('submit', async e=>{
  e.preventDefault();

  const user = loginUsuario.value;
  const pass = loginSenha.value;

  // ADMIN
  if(user==='zenite' && pass==='adminzenite'){
    Swal.fire('Admin','Login confirmado','success');
    carregarAdmin();
    return;
  }

  let aluno = null;
  const byEmail = await db.collection('alunos').where('email','==',user).get();
  if(!byEmail.empty) aluno = byEmail.docs[0].data();
  else{
    const doc = await db.collection('alunos').doc(user).get();
    if(doc.exists) aluno = doc.data();
  }

  if(!aluno || aluno.senha!==pass){
    Swal.fire('Erro','Credenciais inválidas','error');
    return;
  }

  const conf = await Swal.fire({
    title:'Confirmar',
    text:`Entrar como ${aluno.nome}?`,
    icon:'question',
    showCancelButton:true
  });

  if(!conf.isConfirmed) return;

  carregarAluno(aluno);
});

// ================= PAINEL ALUNO =================
async function carregarAluno(aluno){
  mostrarPagina('painelAluno');

  perfilNome.innerText = aluno.nome;
  perfilNumero.innerText = aluno.numero;
  perfilClasse.innerText = aluno.classe;
  perfilTurma.innerText = aluno.turma;
  perfilNascimento.innerText = aluno.nascimento;
  perfilContato.innerText = `${aluno.telefone} / ${aluno.whatsapp}`;

  // NOTAS
  listaNotas.innerHTML='';
  const dados = {};
  aluno.disciplina.forEach(d=>{
    dados[d]={1:{},2:{},3:{}};
  });

  const snapNotas = await db.collection('notas').where('numero','==',aluno.numero).get();
  snapNotas.forEach(doc=>{
    const n=doc.data();
    dados[n.disciplina][n.trimestre][n.tipo]=n.nota;
  });

  const tabela=document.createElement('table');
  tabela.innerHTML=`<tr>
    <th>Disciplina</th><th>Tri</th><th>T1</th><th>T2</th><th>Trab</th><th>Final</th><th>Média</th>
  </tr>`;

  let soma=0, cont=0;

  for(const d of aluno.disciplina){
    for(let t=1;t<=3;t++){
      const notas=Object.values(dados[d][t]).filter(n=>typeof n==='number');
      const media=notas.length?(notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1):'-';
      if(media!=='-'){soma+=+media;cont++;}
      tabela.innerHTML+=`
      <tr>
        <td>${d}</td><td>${t}</td>
        <td>${dados[d][t].teste1||'-'}</td>
        <td>${dados[d][t].teste2||'-'}</td>
        <td>${dados[d][t].trabalho||'-'}</td>
        <td>${dados[d][t].final||'-'}</td>
        <td>${media}</td>
      </tr>`;
    }
  }

  const mediaFinal=cont?(soma/cont).toFixed(1):'-';
  mediaFinalAluno.innerText=mediaFinal;

  if(mediaFinal!=='-' && mediaFinal>=10 && aluno.divida===0){
    statusAcademicoAluno.innerText='Aprovado';
    statusAcademicoAluno.style.color='green';
  }else{
    statusAcademicoAluno.innerText='Bloqueado/Reprovado';
    statusAcademicoAluno.style.color='red';
  }

  listaNotas.appendChild(tabela);

  // EXTRATO
  listaExtrato.innerHTML='';
  const pagSnap=await db.collection('pagamentos').where('numero','==',aluno.numero).get();
  pagSnap.forEach(p=>{
    listaExtrato.innerHTML+=`<li>${p.data().data} - ${p.data().valor} MT</li>`;
  });

  // CALENDÁRIO
  listaCalendario.innerHTML='';
  const calSnap=await db.collection('calendario').get();
  calSnap.forEach(c=>{
    listaCalendario.innerHTML+=`<li>${c.data().data} - ${c.data().evento}</li>`;
  });

  // DÍVIDA
  totalDivida.innerText=aluno.divida;

  // HISTÓRICO
  listaHistorico.innerHTML='';
  const histSnap=await db.collection('historico').where('numero','==',aluno.numero).get();
  histSnap.forEach(h=>{
    listaHistorico.innerHTML+=`<li>${h.data().ano}: ${h.data().status}</li>`;
  });

  mostrarAba('perfil');
}

// ================= ADMIN =================
async function carregarAdmin(){
  mostrarPagina('painelAdmin');
  tabelaAlunos.innerHTML=`
  <tr><th>Nome</th><th>Número</th><th>Dívida</th><th>Ações</th></tr>`;

  const snap=await db.collection('alunos').get();
  snap.forEach(doc=>{
    const a=doc.data();
    tabelaAlunos.innerHTML+=`
    <tr>
      <td>${a.nome}</td>
      <td>${a.numero}</td>
      <td>${a.divida} MT</td>
      <td>
        <button onclick="prepararNota('${a.numero}')">Nota</button>
        <button onclick="verAluno('${a.numero}')">Ver</button>
        <button onclick="pagar('${a.numero}')">Pagamento</button>
      </td>
    </tr>`;
  });
}

// DISCIPLINAS DO ALUNO
async function prepararNota(numero){
  notaAluno.value=numero;
  notaDisciplina.innerHTML='<option>Selecione</option>';

  const doc=await db.collection('alunos').doc(numero).get();
  doc.data().disciplina.forEach(d=>{
    notaDisciplina.innerHTML+=`<option value="${d}">${d}</option>`;
  });
}

// LANÇAR NOTA
document.getElementById('formNota').addEventListener('submit',async e=>{
  e.preventDefault();
  await db.collection('notas').add({
    numero:notaAluno.value,
    disciplina:notaDisciplina.value,
    nota:+notaValor.value,
    trimestre:+notaTrimestre.value,
    tipo:notaTipo.value
  });
  Swal.fire('Sucesso','Nota lançada','success');
});

// ================= SAIR =================
function logout(){
  Swal.fire('Sessão encerrada','','info');
  mostrarPagina('home');
                             }
