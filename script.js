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
function gerarNumeroAluno(){ return '2007'+Math.floor(10000+Math.random()*90000); }
function gerarSenha(){ return Math.random().toString(36).slice(-8); }
function calcularMedia(valores){
  const notas = Object.values(valores).filter(v=>typeof v==='number');
  if(!notas.length) return 0;
  return (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1);
}
async function avaliarAluno(numero, mediaFinal, divida){
  let status='Reprovado';
  if(divida>0) status='Bloqueado';
  else if(mediaFinal>=10) status='Aprovado';
  await db.collection('alunos').doc(numero).update({statusAcademico:status});
  return status;
}

// ===== INSCRIÇÃO =====
document.getElementById('formInscricao').addEventListener('submit', async e => {
    e.preventDefault();
    try {
        const checkboxEls = document.querySelectorAll('#disciplinasCheckboxes input[name="disciplinas"]:checked');
        const disciplinasSelecionadas = Array.from(checkboxEls).map(cb => cb.value);
        if (!disciplinasSelecionadas.length) { alert('Selecione pelo menos uma disciplina!'); return; }

        const aluno = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            whatsapp: document.getElementById('whatsapp').value,
            paiMae: document.getElementById('paiMae').value,
            classe: document.getElementById('classe').value,
            disciplina: disciplinasSelecionadas,
            nascimento: document.getElementById('nascimento').value,
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

        // Mostra alerta com SweetAlert2
        if(typeof Swal !== 'undefined'){
          Swal.fire({
            icon: 'success',
            title: 'Inscrição realizada!',
            html: `<b>Número do Aluno:</b> ${aluno.numero}<br><b>Senha:</b> ${aluno.senha}<br><small>Guarde estes dados com segurança</small>`,
            confirmButtonText: 'OK'
          });
        } else {
          alert(`Inscrição realizada!\nNúmero: ${aluno.numero}\nSenha: ${aluno.senha}`);
        }

        document.getElementById('formInscricao').reset();
        voltarHome();
    } catch (err) {
        alert('Erro ao registrar aluno: ' + err.message);
        console.error(err);
    }
});

// ===== LOGIN =====
document.getElementById('formLogin').addEventListener('submit', async e=>{
  e.preventDefault();
  const usuario = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;

  try {
    // Login Admin
    if(usuario==='zenite' && senha==='adminzenite'){
      mostrarPainelAdmin();
      return;
    }

    // Login Aluno
    let snapshot = await db.collection('alunos').where('email','==',usuario).get();
    let alunoData;
    if(snapshot.empty){
      const snapNum = await db.collection('alunos').doc(usuario).get();
      if(!snapNum.exists) throw new Error('Aluno não encontrado');
      if(snapNum.data().senha !== senha) throw new Error('Senha incorreta');
      alunoData = snapNum.data();
    } else {
      const data = snapshot.docs[0].data();
      if(data.senha !== senha) throw new Error('Senha incorreta');
      alunoData = data;
    }

    mostrarPainelAluno(alunoData);

  } catch(err){ alert(err.message); }
});

// ===== PAINEL DO ALUNO =====
async function mostrarPainelAluno(aluno){
  mostrarPagina('painelAluno');

  // PERFIL
  document.getElementById('perfilNome').innerText = aluno.nome;
  document.getElementById('perfilNumero').innerText = aluno.numero;
  document.getElementById('perfilClasse').innerText = aluno.classe;
  document.getElementById('perfilTurma').innerText = aluno.turma;
  document.getElementById('perfilNascimento').innerText = aluno.nascimento;
  document.getElementById('perfilContato').innerText = `Tel: ${aluno.telefone} / WhatsApp: ${aluno.whatsapp}`;
  document.getElementById('valorTotal').innerText = aluno.planoPagamento?.total || 0;
  document.getElementById('parcelas').innerText = aluno.planoPagamento?.parcelas || 0;

  // NOTAS
  const listaNotas = document.getElementById('listaNotas');
  listaNotas.innerHTML = '';
  const disciplinas = aluno.disciplina;
  const dados = {};
  disciplinas.forEach(d=>{
    dados[d] = {1:{teste1:'-',teste2:'-',trabalho:'-',final:'-'},2:{teste1:'-',teste2:'-',trabalho:'-',final:'-'},3:{teste1:'-',teste2:'-',trabalho:'-',final:'-'}};
  });

  const notasSnap = await db.collection('notas').where('numero','==',aluno.numero).get();
  notasSnap.forEach(doc=>{
    const n = doc.data();
    if(dados[n.disciplina] && dados[n.disciplina][n.trimestre]){
      dados[n.disciplina][n.trimestre][n.tipo] = n.nota;
    }
  });

  function mediaTrimestre(tri){
    const notas = ['teste1','teste2','trabalho','final'].map(t => tri[t]).filter(v=>typeof v==='number');
    if(!notas.length) return '-';
    return (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1);
  }

  const tabela = document.createElement('table');
  tabela.innerHTML = `<tr>
    <th>Disciplina</th><th>Trimestre</th><th>Teste 1</th><th>Teste 2</th><th>Trabalho</th><th>Final</th><th>Média Trimestre</th>
  </tr>`;

  let somaMedias=0, contadorMedias=0;
  disciplinas.forEach(d=>{
    [1,2,3].forEach(t=>{
      const mediaT = mediaTrimestre(dados[d][t]);
      if(mediaT!=='-'){ somaMedias+=parseFloat(mediaT); contadorMedias++; }
      tabela.innerHTML += `<tr>
        <td>${d}</td><td>${t}</td><td>${dados[d][t].teste1}</td><td>${dados[d][t].teste2}</td><td>${dados[d][t].trabalho}</td><td>${dados[d][t].final}</td><td>${mediaT}</td>
      </tr>`;
    });
  });

  const mediaFinalAnual = contadorMedias?(somaMedias/contadorMedias).toFixed(1) : '-';
  let corMedia='black', statusTexto='';
  if(mediaFinalAnual!=='-'){ statusTexto = mediaFinalAnual>=10?'Aprovado':'Perigo de reprovar'; corMedia = mediaFinalAnual>=10?'green':'red'; }
  tabela.innerHTML += `<tr style="background:#e8f5e9"><td colspan="6"><strong>MÉDIA FINAL ANUAL</strong></td><td><strong style="color:${corMedia}">${mediaFinalAnual} (${statusTexto})</strong></td></tr>`;

  if(mediaFinalAnual!=='-'){
    const status = await avaliarAluno(aluno.numero, mediaFinalAnual, aluno.divida);
    const statusSpan = document.getElementById('statusAcademicoAluno');
    statusSpan.innerText = status;
    statusSpan.style.color = status==='Aprovado'?'green':status==='Reprovado'?'red':'orange';
    document.getElementById('mediaFinalAluno').innerText = mediaFinalAnual;
  }

  listaNotas.appendChild(tabela);

  // EXTRATO
  const listaExtrato = document.getElementById('listaExtrato');
  listaExtrato.innerHTML = '';
  const pagamentosSnap = await db.collection('pagamentos').where('numero','==',aluno.numero).get();
  pagamentosSnap.forEach(doc=>{
    const li = document.createElement('li');
    li.innerText = `${doc.data().data}: ${doc.data().valor} - ${doc.data().status || 'Pago'}`;
    listaExtrato.appendChild(li);
  });

  // CALENDÁRIO
  const listaCalendario=document.getElementById('listaCalendario');
  listaCalendario.innerHTML='';
  const calSnap=await db.collection('calendario').get();
  calSnap.forEach(doc=>{
    const li=document.createElement('li');
    li.innerText=`${doc.data().data}: ${doc.data().evento}`;
    listaCalendario.appendChild(li);
  });

  // HISTÓRICO
  const listaHistorico=document.getElementById('listaHistorico');
  listaHistorico.innerHTML='';
  const histSnap=await db.collection('historico').where('numero','==',aluno.numero).get();
  histSnap.forEach(doc=>{
    const h=doc.data();
    const li=document.createElement('li');
    li.innerText=`Ano ${h.anoLetivo}: ${h.disciplina} - Média: ${h.mediaFinal} - Status: ${h.statusAcademico}`;
    listaHistorico.appendChild(li);
  });

  mostrarAba('perfil');
}

// ===== PAINEL ADMIN =====
async function mostrarPainelAdmin(){
  mostrarPagina('painelAdmin');

  // LISTAR ALUNOS
  const snapshot = await db.collection('alunos').get();
  const tabela = document.getElementById('tabelaAlunos');
  tabela.innerHTML = `<tr><th>Nome</th><th>Número</th><th>Status</th><th>Status Académico</th><th>Dívida</th><th>Ações</th></tr>`;
  snapshot.forEach(doc=>{
    const a = doc.data();
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.nome}</td><td>${a.numero}</td><td>${a.ativo?'Ativo':'Suspenso'}</td><td>${a.statusAcademico}</td><td>${a.divida}</td><td>
      <button onclick="confirmar('${a.numero}')">Confirmar</button>
      <button onclick="verFormulario('${a.numero}')">Ver Formulário</button>
      <button onclick="registrarPagamento('${a.numero}')">Registrar Pagamento</button>
      <button onclick="editarPlano('${a.numero}')">Editar Plano</button>
      <button onclick="suspender('${a.numero}',${a.ativo})">${a.ativo?'Suspender':'Ativar'}</button>
      <button onclick="excluir('${a.numero}')">Excluir</button>
      <button onclick="editarDivida('${a.numero}')">Editar Dívida</button>
      <button onclick="fecharAno('${a.numero}')">Fechar Ano</button>
    </td>`;
    tabela.appendChild(tr);
  });

  // CALENDÁRIO
  const lista=document.getElementById('adminCalendario');
  lista.innerHTML='';
  const calSnap2 = await db.collection('calendario').get();
  calSnap2.forEach(doc=>{
    const li = document.createElement('li');
    li.innerHTML = `${doc.data().data}: ${doc.data().evento} 
      <button onclick="editarEvento('${doc.id}')">Editar</button>
      <button onclick="limparEvento('${doc.id}')">Limpar</button>`;
    lista.appendChild(li);
  });
}

// ===== FUNÇÕES ADMIN =====
async function confirmar(numero){ await db.collection('alunos').doc(numero).update({confirmado:true}); alert('Matrícula confirmada'); mostrarPainelAdmin(); }
async function suspender(numero, ativo){ await db.collection('alunos').doc(numero).update({ativo:!ativo}); alert(`Aluno ${!ativo?'ativado':'suspenso'}`); mostrarPainelAdmin(); }
async function excluir(numero){ if(confirm('Deseja realmente excluir este aluno?')){ await db.collection('alunos').doc(numero).delete(); alert('Aluno excluído'); mostrarPainelAdmin(); } }
async function editarDivida(numero){ const nova=prompt('Informe o valor da dívida:'); if(nova!==null){ await db.collection('alunos').doc(numero).update({divida:parseFloat(nova)}); alert('Dívida atualizada'); mostrarPainelAdmin(); } }
async function registrarPagamento(numero){ const valor=prompt('Valor pago:'); if(!valor) return; await db.collection('pagamentos').add({aluno:numero, valor:parseFloat(valor), data:new Date().toLocaleDateString(), status:'Pago'}); alert('Pagamento registrado'); mostrarPainelAdmin(); }
async function editarPlano(numero){ const plano=prompt('Informe o novo plano (Básico / Premium / VIP):'); if(!plano) return; await db.collection('alunos').doc(numero).update({plano}); alert('Plano atualizado'); mostrarPainelAdmin(); }
async function fecharAno(numero){ if(!confirm('Deseja fechar o ano deste aluno?')) return; await db.collection('alunos').doc(numero).update({encerrado:true}); alert('Ano fechado'); mostrarPainelAdmin(); }
async function verFormulario(numero){ const doc=await db.collection('alunos').doc(numero).get(); if(!doc.exists){alert('Aluno não encontrado'); return;} const a=doc.data(); document.getElementById('conteudoFormulario').innerHTML = `
  <p><strong>Nome:</strong> ${a.nome}</p>
  <p><strong>Número:</strong> ${numero}</p>
  <p><strong>Email:</strong> ${a.email||'-'}</p>
  <p><strong>Telefone:</strong> ${a.telefone||'-'}</p>
  <p><strong>Classe:</strong> ${a.classe||'-'}</p>
  <p><strong>Dívida:</strong> ${a.divida||0} MT</p>
  <p><strong>Status:</strong> ${a.ativo?'Ativo':'Suspenso'}</p>`; 
  document.getElementById('modalFormulario').style.display='flex'; }
function fecharFormulario(){ document.getElementById('modalFormulario').style.display='none'; }

// ===== LANÇAR NOTA =====
document.getElementById('formNota').addEventListener('submit', async e=>{
  e.preventDefault();
  const numero=document.getElementById('notaAluno').value;
  const disciplina=document.getElementById('notaDisciplina').value;
  const valor=parseFloat(document.getElementById('notaValor').value);
  const trimestre=parseInt(document.getElementById('notaTrimestre').value);
  const tipo=document.getElementById('notaTipo').value;
  if(!numero||!disciplina){ alert('Preencha o número do aluno e selecione a disciplina'); return; }
  try{ await db.collection('notas').add({numero, disciplina, nota:valor, trimestre, tipo}); alert('Nota lançada com sucesso!'); } 
  catch(err){ alert('Erro ao lançar nota: '+err.message); console.error(err); }
});

// ===== ADICIONAR EVENTO =====
document.getElementById('formEvento').addEventListener('submit', async e=>{
  e.preventDefault();
  const data=document.getElementById('eventoData').value;
  const evento=document.getElementById('eventoDesc').value;
  await db.collection('calendario').add({data,evento});
  alert('Evento adicionado');
  mostrarPainelAdmin();
});

// ===== TÍTULO ANIMADO =====
const title="Portal Zênite";
const titleElement=document.getElementById('title-text');
let index=0;
function typeWriter(){
  if(index<title.length){
    const span=document.createElement('span');
    span.textContent=title[index];
    titleElement.appendChild(span);
    span.style.opacity=0;
    span.style.transform='translateY(-20px)';
    span.style.transition='all 0.3s ease';
    setTimeout(()=>{span.style.opacity=1; span.style.transform='translateY(0)';},50);
    index++;
    setTimeout(typeWriter,150);
  } else {
    setTimeout(()=>{titleElement.innerHTML=''; index=0; typeWriter();},2000);
  }
}
typeWriter();

// ===== LOGOUT / SAIR =====
function sair(){
  mostrarPagina('home');
  document.getElementById('perfilNome').innerText='';
  document.getElementById('perfilNumero').
