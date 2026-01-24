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

// ===== GERAÇÃO DE ALUNO E SENHA =====
function gerarNumeroAluno(){ return '2007'+Math.floor(10000+Math.random()*90000); }
function gerarSenha(nome, numero){ 
  const primeiroNome = nome.split(' ')[0].toLowerCase();
  return `${primeiroNome}${numero}@IZ.com`;
}

// ===== INSCRIÇÃO =====
document.getElementById('formInscricao').addEventListener('submit', async e=>{
  e.preventDefault();
  const disciplinasSelecionadas = Array.from(document.querySelectorAll('#disciplinasCheckboxes input[name="disciplinas"]:checked')).map(cb=>cb.value);
  if(disciplinasSelecionadas.length===0) return Swal.fire('Erro','Selecione pelo menos uma disciplina!','error');

  const alunoNumero = gerarNumeroAluno();
  const alunoSenha = gerarSenha(document.getElementById('nome').value, alunoNumero);

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
    numero: alunoNumero,
    senha: alunoSenha,
    ativo:true,
    confirmado:false,
    divida:0,
    planoPagamento:{total:5000, parcelas:5},
    statusAcademico:'Reprovado'
  };

  try{
    await db.collection('alunos').doc(aluno.numero).set(aluno);
    Swal.fire('Sucesso',`Número: ${aluno.numero}\nSenha: ${aluno.senha}`,'success');
    document.getElementById('formInscricao').reset();
    voltarHome();
  }catch(err){ Swal.fire('Erro', err.message,'error'); console.error(err);}
});

// ===== LOGIN =====
document.getElementById('formLogin').addEventListener('submit', async e=>{
  e.preventDefault();
  const usuario = document.getElementById('loginUsuario').value;
  const senha = document.getElementById('loginSenha').value;

  // --- Login admin ---
  if(usuario === 'zenite' && senha === 'adminzenite'){
    mostrarPainelAdmin();
    return;
  }

  try{
    // --- Procurar aluno por número ---
    let alunoSnap = await db.collection('alunos').doc(usuario).get();

    // --- Se não achar pelo número, procurar por email ---
    if(!alunoSnap.exists){
      const snapshot = await db.collection('alunos').where('email','==',usuario).get();
      if(snapshot.empty){
        Swal.fire('Erro','Aluno não encontrado','error');
        return;
      }
      alunoSnap = snapshot.docs[0];
    }

    const alunoData = alunoSnap.data();

    // --- Verifica confirmação da conta ---
    if(!alunoData.confirmado){
      Swal.fire('Erro','Conta não confirmada, aguarde aprovação do administrador','error');
      return;
    }

    // --- Verifica senha ---
    if(alunoData.senha !== senha){
      Swal.fire('Erro','Senha incorreta','error');
      return;
    }

    // --- Login válido: mostra painel do aluno ---
    mostrarPainelAluno(alunoData);

  } catch(err){
    console.error(err);
    Swal.fire('Erro', err.message, 'error');
  }
});

// ===== PAINEL ALUNO =====
function mostrarAba(nome){
  document.querySelectorAll('.aba').forEach(a=>a.classList.remove('active'));
  const aba = document.getElementById('aba'+nome.charAt(0).toUpperCase()+nome.slice(1));
  if(aba) aba.classList.add('active');
}

async function mostrarPainelAluno(aluno){
  mostrarPagina('painelAluno');
  document.getElementById('perfilNome').innerText=aluno.nome;
  document.getElementById('perfilNumero').innerText=aluno.numero;
  document.getElementById('perfilClasse').innerText=aluno.classe;
  document.getElementById('perfilTurma').innerText=aluno.turma;
  document.getElementById('perfilNascimento').innerText=aluno.nascimento;
  document.getElementById('perfilContato').innerText=`Tel: ${aluno.telefone} / WhatsApp: ${aluno.whatsapp}`;
  document.getElementById('valorTotal').innerText=aluno.planoPagamento?.total||0;
  document.getElementById('parcelas').innerText=aluno.planoPagamento?.parcelas||0;
  document.getElementById('totalDivida').innerText=aluno.divida;

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
    if(mediaFinalAnual > = 10){
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
  
    // Mostrar aba perfil como padrão
    mostrarAba('perfil');
      }

// ===== PAINEL ADMIN =====
async function mostrarPainelAdmin(){
  mostrarPagina('painelAdmin');

  const tabela=document.getElementById('tabelaAlunos');
  tabela.innerHTML=`<tr>
    <th>Nome</th><th>Número</th><th>Status</th><th>Status Académico</th><th>Dívida</th><th>Ações</th>
  </tr>`;
  const snapshot = await db.collection('alunos').get();
  snapshot.forEach(doc=>{
    const a=doc.data();
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${a.nome}</td>
      <td>${a.numero}</td>
      <td>${a.ativo?'Ativo':'Suspenso'}</td>
      <td>${a.statusAcademico}</td>
      <td>${a.divida}</td>
      <td>
        <button onclick="confirmar('${a.numero}')">Confirmar</button>
        <button onclick="verFormulario('${a.numero}')">Ver Formulário</button>
        <button onclick="registrarPagamento('${a.numero}')">Registrar Pagamento</button>
        <button onclick="editarPlanoPagamento('${a.numero}')">Editar Plano</button>
        <button onclick="suspender('${a.numero}',${a.ativo})">${a.ativo?'Suspender':'Ativar'}</button>
        <button onclick="excluir('${a.numero}')">Excluir</button>
        <button onclick="editarDivida('${a.numero}')">Editar Dívida</button>
        <button onclick="fecharAno('${a.numero}')">Fechar Ano</button>
      </td>`;
    tabela.appendChild(tr);
  });
}

// ===== ALERTAS SWEETALERT2 =====
function alertaSucesso(msg){ Swal.fire('Sucesso',msg,'success'); }
function alertaErro(msg){ Swal.fire('Erro',msg,'error'); }

// ===== LOGOUT =====
document.getElementById('btnSair')?.addEventListener('click',logout);
function logout(){ mostrarPagina('home'); Swal.fire('Logout','Você saiu com sucesso!','success'); }

// ===== TÍTULO ANIMADO =====
const title = "Portal Zênite";
const titleElement = document.getElementById('title-text');
let index=0;
function typeWriter(){
  if(index<title.length){
    const span=document.createElement('span');
    span.textContent=title[index];
    titleElement.appendChild(span);
    span.style.opacity=0;
    span.style.transform='translateY(-20px)';
    span.style.transition='all 0.3s ease';
    setTimeout(()=>{span.style.opacity=1;span.style.transform='translateY(0)';},50);
    index++;
    setTimeout(typeWriter,150);
  }else{ setTimeout(()=>{titleElement.innerHTML=''; index=0; typeWriter();},2000);}
}
typeWriter();

// ===== ABRIR MODAL =====
function abrirModal(titulo, conteudoHTML) {
    const modal = document.getElementById('modalFormulario');
    document.getElementById('modalTitulo').innerText = titulo;
    document.getElementById('conteudoFormulario').innerHTML = conteudoHTML;
    modal.style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalFormulario').style.display = 'none';
}

// ===== VER FORMULÁRIO DO ALUNO =====
async function verFormulario(id) {
    try {
        const doc = await db.collection('alunos').doc(id).get();
        if (!doc.exists) {
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Aluno não encontrado', timer: 2000, showConfirmButton: false });
            return;
        }

        const a = doc.data();
        abrirModal('📄 Formulário do Aluno', `
            <p><strong>Nome:</strong> ${a.nome}</p>
            <p><strong>Número:</strong> ${a.numero}</p>
            <p><strong>Email:</strong> ${a.email}</p>
            <p><strong>Plano:</strong> ${a.plano || '—'}</p>
            <p><strong>Status:</strong> ${a.status || 'Ativo'}</p>
        `);

    } catch (e) {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha ao buscar formulário', timer: 2000, showConfirmButton: false });
    }
}

// ===== REGISTRAR PAGAMENTO =====
function registrarPagamento(id) {
    abrirModal('💰 Registrar Pagamento', `
        <input id="valorPagamento" placeholder="Valor pago">
        <button onclick="salvarPagamento('${id}')">Confirmar</button>
    `);
}

async function salvarPagamento(id) {
    const valor = document.getElementById('valorPagamento').value;
    if (!valor) return Swal.fire({ icon: 'warning', title: 'Aviso', text: 'Informe o valor', timer: 2000, showConfirmButton: false });

    await db.collection('pagamentos').add({
        alunoId: id,
        valor: parseFloat(valor),
        data: new Date().toLocaleDateString()
    });

    fecharModal();
    Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Pagamento registrado', timer: 2000, showConfirmButton: false });
}

// ===== EDITAR PLANO =====
function editarPlano(id) {
    abrirModal('✏️ Editar Plano', `
        <select id="novoPlano">
            <option value="Basico">Básico</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
        </select>
        <button onclick="salvarPlano('${id}')">Salvar</button>
    `);
}

async function salvarPlano(id) {
    try {
        const plano = document.getElementById('novoPlano').value;
        if (!plano) return Swal.fire({ icon: 'warning', title: 'Aviso', text: 'Selecione um plano', timer: 2000, showConfirmButton: false });

        await db.collection('alunos').doc(id).update({ plano });
        fecharModal();
        Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Plano atualizado', timer: 2000, showConfirmButton: false });
        mostrarPainelAdmin(); // atualiza tabela após mudança
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha ao atualizar plano', timer: 2000, showConfirmButton: false });
    }
     }

// ===== SUSPENDER / ATIVAR ALUNO =====
async function suspender(numero, ativo) {
    try {
        await db.collection('alunos').doc(numero).update({ ativo: !ativo });
        Swal.fire({
            icon: 'success',
            title: 'Sucesso',
            text: `Aluno ${!ativo ? 'ativado' : 'suspenso'} com sucesso!`,
            timer: 2000,
            showConfirmButton: false
        });
        mostrarPainelAdmin(); // atualiza tabela após mudança
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha ao alterar status', timer: 2000, showConfirmButton: false });
    }
}

// ===== FECHAR ANO =====
function fecharAno(id) {
    abrirModal('⚠️ Fechar Ano', `
        <p>Tem certeza que deseja fechar o ano deste aluno?</p>
        <button onclick="confirmarFecharAno('${id}')">SIM, fechar</button>
    `);
}

async function confirmarFecharAno(id) {
    await db.collection('alunos').doc(id).update({ status: 'Encerrado' });
    fecharModal();
    Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Ano fechado com sucesso', timer: 2000, showConfirmButton: false });
}

// ===== SAIR DO SISTEMA =====
function sair() {
    mostrarPagina('home');

    // Limpa dados sensíveis do painel do aluno
    ['perfilNome','perfilNumero','perfilClasse','perfilTurma','perfilNascimento','perfilContato',
     'listaNotas','listaExtrato','listaCalendario','listaHistorico','mediaFinalAluno','statusAcademicoAluno'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = '';
    });

    Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Você saiu com sucesso!', timer: 2000, showConfirmButton: false });
}
