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
function mostrarInscricao(){ mostrarPagina('inscricao'); }
function mostrarLogin(){ mostrarPagina('login'); }
function voltarHome(){ mostrarPagina('home'); }
function mostrarPagina(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
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
    e.preventDefault(); // não recarrega a página
    try {
        const checkboxEls = document.querySelectorAll('#disciplinasCheckboxes input[name="disciplinas"]:checked');
        const disciplinasSelecionadas = Array.from(checkboxEls).map(cb => cb.value);
        if (disciplinasSelecionadas.length === 0) { alert('Selecione pelo menos uma disciplina!'); return; }

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
        Swal.fire({
  icon: 'success',
  title: 'Inscrição realizada!',
  html: `
    <b>Número do Aluno:</b> ${aluno.numero}<br>
    <b>Senha:</b> ${aluno.senha}<br><br>
    <small>Guarde estes dados com segurança</small>
  `,
  confirmButtonText: 'OK'
});
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
  if(usuario==='zenite'&&senha==='adminzenite'){ mostrarPainelAdmin(); return; }

  try{
    let snapshot=await db.collection('alunos').where('email','==',usuario).get();
    let alunoData;
    if(snapshot.empty){
      const snapNum=await db.collection('alunos').doc(usuario).get();
      if(!snapNum.exists) throw new Error('Aluno não encontrado');
      if(snapNum.data().senha!==senha) throw new Error('Senha incorreta');
      alunoData=snapNum.data();
    }else{
      const data=snapshot.docs[0].data();
      if(data.senha!==senha) throw new Error('Senha incorreta');
      alunoData=data;
    }
    mostrarPainelAluno(alunoData);
  }catch(err){ alert(err.message); }
});

// ===== ABAS DO ALUNO =====
function mostrarAba(nome){
  document.querySelectorAll('.aba').forEach(a=>a.classList.remove('active'));
  const aba = document.getElementById('aba'+nome.charAt(0).toUpperCase()+nome.slice(1));
  if(aba) aba.classList.add('active');
}

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

// Pega disciplinas do aluno
const disciplinas = aluno.disciplina; // array de disciplinas selecionadas

// Cria estrutura de dados por disciplina e trimestre
const dados = {};
disciplinas.forEach(d => {
    dados[d] = {
        1:{teste1:'-',teste2:'-',trabalho:'-',final:'-'},
        2:{teste1:'-',teste2:'-',trabalho:'-',final:'-'},
        3:{teste1:'-',teste2:'-',trabalho:'-',final:'-'}
    };
});

// Preenche com notas do Firestore
const notasSnap = await db.collection('notas').where('numero','==',aluno.numero).get();
notasSnap.forEach(doc => {
    const n = doc.data();
    if(dados[n.disciplina] && dados[n.disciplina][n.trimestre]){
        dados[n.disciplina][n.trimestre][n.tipo] = n.nota;
    }
});

// Função para calcular média de uma disciplina em um trimestre
function mediaTrimestre(tri){
    const notas = ['teste1','teste2','trabalho','final'].map(t => tri[t]).filter(v => typeof v === 'number');
    if(!notas.length) return '-';
    return (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1);
}

// Cria a tabela
const tabela = document.createElement('table');
tabela.innerHTML = `<tr>
<th>Disciplina</th>
<th>Trimestre</th>
<th>Teste 1</th>
<th>Teste 2</th>
<th>Trabalho</th>
<th>Final</th>
<th>Média Trimestre</th>
</tr>`;

let somaMedias = 0;
let contadorMedias = 0;

disciplinas.forEach(disc => {
    [1,2,3].forEach(t => {
        const mediaT = mediaTrimestre(dados[disc][t]);
        if(mediaT !== '-') { somaMedias += parseFloat(mediaT); contadorMedias++; }

        tabela.innerHTML += `<tr>
            <td>${disc}</td>
            <td>${t}</td>
            <td>${dados[disc][t].teste1}</td>
            <td>${dados[disc][t].teste2}</td>
            <td>${dados[disc][t].trabalho}</td>
            <td>${dados[disc][t].final}</td>
            <td>${mediaT}</td>
        </tr>`;
    });
});

// Média final anual
const mediaFinalAnual = contadorMedias ? (somaMedias/contadorMedias).toFixed(1) : '-';

// Determina a cor conforme a média
let corMedia = 'black';
let statusTexto = '';
if(mediaFinalAnual !== '-') {
    if(mediaFinalAnual >= 10){
        corMedia = 'green';
        statusTexto = 'Aprovado';
    } else {
        corMedia = 'red';
        statusTexto = 'Perigo de reprovar';
    }
}

// Adiciona linha da média anual na tabela
tabela.innerHTML += `<tr style="background:#e8f5e9">
    <td colspan="6"><strong>MÉDIA FINAL ANUAL</strong></td>
    <td><strong style="color:${corMedia}">${mediaFinalAnual} (${statusTexto})</strong></td>
</tr>`;

// Atualiza status acadêmico no painel
if(mediaFinalAnual !== '-') {
    await avaliarAluno(aluno.numero, mediaFinalAnual, aluno.divida);
    const statusSpan = document.getElementById('statusAcademicoAluno');
    statusSpan.innerText = statusTexto;
    statusSpan.style.color = corMedia;
    document.getElementById('mediaFinalAluno').innerText = mediaFinalAnual;
}

listaNotas.appendChild(tabela);

// Atualiza status acadêmico
if(mediaFinalAnual !== '-') {
    const status = await avaliarAluno(aluno.numero, mediaFinalAnual, aluno.divida);
    const statusSpan = document.getElementById('statusAcademicoAluno');
    statusSpan.innerText = status;
    statusSpan.style.color = status==='Aprovado'?'green':status==='Reprovado'?'red':'orange';
    document.getElementById('mediaFinalAluno').innerText = mediaFinalAnual;
}

  // EXTRATO
  const listaExtrato=document.getElementById('listaExtrato');
  listaExtrato.innerHTML='';
  const pagamentosSnap=await db.collection('pagamentos').where('numero','==',aluno.numero).get();
  pagamentosSnap.forEach(doc=>{
    const li=document.createElement('li');
    li.innerText=`${doc.data().data}: ${doc.data().valor} - ${doc.data().status}`;
    listaExtrato.appendChild(li);
  });

  // CALENDÁRIO
  const calSnap=await db.collection('calendario').get();
  const listaCalendario=document.getElementById('listaCalendario');
  listaCalendario.innerHTML='';
  calSnap.forEach(doc=>{
    const li=document.createElement('li');
    li.innerText=`${doc.data().data}: ${doc.data().evento}`;
    listaCalendario.appendChild(li);
  });

  // DÍVIDAS
  document.getElementById('totalDivida').innerText=aluno.divida;

  // HISTÓRICO
  const histSnap=await db.collection('historico').where('numero','==',aluno.numero).get();
  const listaHistorico=document.getElementById('listaHistorico');
  listaHistorico.innerHTML='';
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
  const snapshot=await db.collection('alunos').get();
  const tabela=document.getElementById('tabelaAlunos');
  tabela.innerHTML=`<tr>
    <th>Nome</th><th>Número</th><th>Status</th><th>Status Académico</th><th>Dívida</th><th>Ações</th>
  </tr>`;
  snapshot.forEach(doc=>{
    const a=doc.data();
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${a.nome}</td>
      <td>${a.numero}</td>
      <td>${a.ativo?'Ativo':'Suspenso'}</td>
      <td>${a.statusAcademico}</td>
      <td>${a.divida}</td>
      <td>
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
  const calSnap=await db.collection('calendario').get();
  const lista=document.getElementById('adminCalendario');
  lista.innerHTML='';
  calSnap.forEach(doc => {
    const li = document.createElement('li');
    li.innerHTML = `${doc.data().data}: ${doc.data().evento} 
      <button onclick="editarEvento('${doc.id}')">Editar</button>
      <button onclick="limparEvento('${doc.id}')">Limpar</button>`;
    lista.appendChild(li);
  });
}

// ===== Preencher disciplinas no select do admin =====
document.getElementById('notaAluno').addEventListener('change', async e => {
  const numero = e.target.value;
  const selectDisciplina = document.getElementById('notaDisciplina');
  selectDisciplina.innerHTML = '<option value="">Selecione a disciplina</option>';

  if (!numero) return;
  try {
      const doc = await db.collection('alunos').doc(numero).get();
      if (!doc.exists) { alert('Aluno não encontrado'); return; }
      doc.data().disciplina.forEach(d => {
          const option = document.createElement('option');
          option.value = d;
          option.textContent = d;
          selectDisciplina.appendChild(option);
      });
  } catch(err) {
      console.error(err);
      alert('Erro ao buscar disciplinas do aluno');
  }
});

// ===== FUNÇÕES ADMIN =====
async function confirmar(numero){ await db.collection('alunos').doc(numero).update({confirmado:true}); alert('Matrícula confirmada'); mostrarPainelAdmin(); }
async function suspender(numero, ativo){ await db.collection('alunos').doc(numero).update({ativo:!ativo}); alert(`Aluno ${!ativo?'ativado':'suspenso'}`); mostrarPainelAdmin(); }
async function excluir(numero){ if(confirm('Deseja realmente excluir este aluno?')){ await db.collection('alunos').doc(numero).delete(); alert('Aluno excluído'); mostrarPainelAdmin(); } }
async function editarDivida(numero){ const nova=prompt('Informe o valor da dívida:'); if(nova!==null){ await db.collection('alunos').doc(numero).update({divida:parseFloat(nova)}); alert('Dívida atualizada'); mostrarPainelAdmin(); } }

// ===== VER FORMULÁRIO =====
  async function verFormulario(numero){
  const doc = await db.collection('alunos').doc(numero).get();
  if(!doc.exists){
    alert('Aluno não encontrado');
    return;
  }

  const a = doc.data();

  document.getElementById('conteudoFormulario').innerHTML = `
    <p style="color:#000 !important;"><strong>Nome:</strong> ${a.nome}</p>
    <p style="color:#000 !important;"><strong>Número:</strong> ${numero}</p>
    <p style="color:#000 !important;"><strong>Email:</strong> ${a.email || '-'}</p>
    <p style="color:#000 !important;"><strong>Telefone:</strong> ${a.telefone || '-'}</p>
    <p style="color:#000 !important;"><strong>Classe:</strong> ${a.classe || '-'}</p>
    <p style="color:#000 !important;"><strong>Dívida:</strong> ${a.divida || 0} MT</p>
    <p style="color:#000 !important;"><strong>Status:</strong> ${a.ativo ? 'Ativo' : 'Suspenso'}</p>
  `;

  document.getElementById('modalFormulario').style.display = 'flex';
}

// ===== REGISTRAR PAGAMENTO =====
async function registrarPagamento(numero){
  const valor = prompt('Valor pago:');
  if(!valor) return;

  await db.collection('pagamentos').add({
    aluno: numero,
    valor: parseFloat(valor),
    data: new Date().toLocaleDateString()
  });

  alert('Pagamento registrado');
}

// ===== EDITAR PLANO =====
async function editarPlano(numero){
  const plano = prompt('Informe o novo plano (Básico / Premium / VIP):');
  if(!plano) return;

  await db.collection('alunos').doc(numero).update({plano});
  alert('Plano atualizado');
  mostrarPainelAdmin();
}

async function editarAluno(numero) {
  try {
    // 🔐 garante que só admin edita
    if (usuarioTipo !== 'admin') {
      Swal.fire('Acesso negado', 'Somente administradores podem editar', 'error');
      return;
    }

    // 🔍 buscar aluno
    const doc = await db.collection('alunos').doc(numero).get();

    if (!doc.exists) {
      Swal.fire('Erro', 'Aluno não encontrado', 'error');
      return;
    }

    const aluno = doc.data();

    // ✏️ alerta com formulário
    const { value: dados } = await Swal.fire({
      title: 'Editar dados do aluno',
      html: `
        <input id="nome" class="swal2-input" placeholder="Nome" value="${aluno.nome || ''}">
        <input id="email" class="swal2-input" placeholder="Email" value="${aluno.email || ''}">
        <input id="telefone" class="swal2-input" placeholder="Telefone" value="${aluno.telefone || ''}">
        <input id="classe" class="swal2-input" placeholder="Classe" value="${aluno.classe || ''}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          nome: document.getElementById('nome').value,
          email: document.getElementById('email').value,
          telefone: document.getElementById('telefone').value,
          classe: document.getElementById('classe').value
        };
      }
    });

    // 💾 salvar alterações
    if (dados) {
      await db.collection('alunos').doc(numero).update(dados);
      Swal.fire('Sucesso', 'Dados atualizados com sucesso', 'success');
      mostrarPainelAdmin();
    }

  } catch (erro) {
    Swal.fire('Erro', erro.message, 'error');
  }
                                                                         }

// ===== FECHAR ANO =====
async function fecharAno(numero){
  if(!confirm('Deseja fechar o ano deste aluno?')) return;

  await db.collection('alunos').doc(numero).update({
    encerrado: true
  });

  alert('Ano fechado');
  mostrarPainelAdmin();
}

// ===== FECHAR MODAL =====
function fecharFormulario(){
  document.getElementById('modalFormulario').style.display = 'none';
}

// ===== LANÇAR NOTA =====
document.getElementById('formNota').addEventListener('submit', async e=>{
  e.preventDefault();
  const numero = document.getElementById('notaAluno').value;
  const disciplina = document.getElementById('notaDisciplina').value;
  const valor = parseFloat(document.getElementById('notaValor').value);
  const trimestre = parseInt(document.getElementById('notaTrimestre').value);
  const tipo = document.getElementById('notaTipo').value;
  if(!numero || !disciplina){ alert('Preencha o número do aluno e selecione a disciplina'); return; }
  try{ await db.collection('notas').add({numero, disciplina, nota:valor, trimestre, tipo}); alert('Nota lançada com sucesso!'); }
  catch(err){ alert('Erro ao lançar nota: '+err.message); console.error(err); }
});

// ===== ADICIONAR EVENTO =====
document.getElementById('formEvento').addEventListener('submit',async e=>{
  e.preventDefault();
  const data=document.getElementById('eventoData').value;
  const evento=document.getElementById('eventoDesc').value;
  await db.collection('calendario').add({data,evento});
  alert('Evento adicionado');
  mostrarPainelAdmin();
});

// ===== TÍTULO ANIMADO =====
const title = "Portal Zênite";
const titleElement = document.getElementById('title-text');
let index = 0;
function typeWriter() {
    if (index < title.length) {
        const span = document.createElement('span');
        span.textContent = title[index];
        titleElement.appendChild(span);
        span.style.opacity = 0;
        span.style.transform = 'translateY(-20px)';
        span.style.transition = 'all 0.3s ease';
        setTimeout(()=>{ span.style.opacity=1; span.style.transform='translateY(0)'; },50);
        index++;
        setTimeout(typeWriter, 150);
    } else {
        setTimeout(()=>{ titleElement.innerHTML=''; index=0; typeWriter(); },2000);
    }
}
typeWriter();

// FUNÇÃO PARA SAIR DO SISTEMA
function sair() {
    // Volta para a página inicial
    mostrarPagina('home');
    
    // Limpa dados sensíveis do painel do aluno
    document.getElementById('perfilNome').innerText = '';
    document.getElementById('perfilNumero').innerText = '';
    document.getElementById('perfilClasse').innerText = '';
    document.getElementById('perfilTurma').innerText = '';
    document.getElementById('perfilNascimento').innerText = '';
    document.getElementById('perfilContato').innerText = '';
    document.getElementById('listaNotas').innerHTML = '';
    document.getElementById('listaExtrato').innerHTML = '';
    document.getElementById('listaCalendario').innerHTML = '';
    document.getElementById('listaHistorico').innerHTML = '';
}

// LIGA O BOTÃO AO SCRIPT
document.getElementById('btnSair').addEventListener('click', sair);

// Função para sair (logout)
function logout() {
    // Limpa qualquer dado do usuário que estiver no painel
    document.getElementById('perfilNome').innerText = '';
    document.getElementById('perfilNumero').innerText = '';
    document.getElementById('perfilClasse').innerText = '';
    document.getElementById('perfilTurma').innerText = '';
    document.getElementById('perfilNascimento').innerText = '';
    document.getElementById('perfilContato').innerText = '';
    document.getElementById('mediaFinalAluno').innerText = '-';
    document.getElementById('statusAcademicoAluno').innerText = '-';

    // Volta para a tela inicial
    mostrarPagina('home');

    alert('Você saiu com sucesso!');
}
