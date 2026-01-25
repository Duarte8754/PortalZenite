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

function mostrarModal(mensagem) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modalConfirm');
    const msg = document.getElementById('modalMensagem');
    const btnSim = document.getElementById('modalSim');
    const btnNao = document.getElementById('modalNao');

    msg.innerText = mensagem;
    modal.style.display = 'flex';

    btnSim.onclick = () => { modal.style.display='none'; resolve(true); };
    btnNao.onclick = () => { modal.style.display='none'; resolve(false); };
  });
}

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

// ===== ESTRUTURA CURRICULAR (INSCRIÇÃO) =====
const estruturaCurricular = {
  "9ª": {
    disciplinas: [
      "Português","Matemática","Física","Química","Biologia",
      "História","Geografia","Inglês","Educação Física"
    ]
  },
  "10ª": {
    disciplinas: [
      "Português","Matemática","Física","Química","Biologia",
      "História","Geografia","Inglês","Educação Física","TICs"
    ]
  },
  "11ª": {
    areas: {
      "Letras": [
        "Português","Inglês","Matemática","Filosofia",
        "História","Geografia","TICs"
      ],
      "Ciências (Biologia/Química)": [
        "Português","Inglês","Matemática","Filosofia",
        "Física","Química","Biologia","TICs"
      ],
      "Ciências (Desenho)": [
        "Português","Inglês","Matemática","Filosofia",
        "Física","Química","Desenho","TICs"
      ]
    }
  },
  "12ª": {
    areas: {
      "Letras": [
        "Português","Inglês","Matemática","Filosofia",
        "História","Geografia","TICs"
      ],
      "Ciências (Biologia/Química)": [
        "Português","Inglês","Matemática","Filosofia",
        "Física","Química","Biologia","TICs"
      ],
      "Ciências (Desenho)": [
        "Português","Inglês","Matemática","Filosofia",
        "Física","Química","Desenho","TICs"
      ]
    }
  }
};

// ===== ELEMENTOS DO FORMULÁRIO =====
const classeSelect = document.getElementById('classe');
const areaSelect = document.getElementById('area');
const disciplinasDiv = document.getElementById('disciplinasCheckboxes');

// ===== POPULAR CLASSES =====
["9ª","10ª","11ª","12ª"].forEach(c=>{
  const opt=document.createElement('option');
  opt.value=c;
  opt.textContent=c+" Classe";
  classeSelect.appendChild(opt);
});

// ===== AO MUDAR CLASSE =====
classeSelect.addEventListener('change',()=>{
  disciplinasDiv.innerHTML='';
  areaSelect.innerHTML='<option value="">Selecione a área</option>';
  areaSelect.style.display='none';

  const classe = classeSelect.value;
  if(!classe) return;

  const dados = estruturaCurricular[classe];

  if(dados.areas){
    areaSelect.style.display='block';
    Object.keys(dados.areas).forEach(a=>{
      const opt=document.createElement('option');
      opt.value=a;
      opt.textContent=a;
      areaSelect.appendChild(opt);
    });
  } else {
    criarCheckboxes(dados.disciplinas);
  }
});

// ===== AO MUDAR ÁREA =====
areaSelect.addEventListener('change',()=>{
  disciplinasDiv.innerHTML='';
  const classe = classeSelect.value;
  const area = areaSelect.value;
  if(!classe || !area) return;
  criarCheckboxes(estruturaCurricular[classe].areas[area]);
});

// ===== CRIAR CHECKBOXES =====
function criarCheckboxes(lista){
  lista.forEach(d=>{
    const div=document.createElement('div');
    div.innerHTML=`
      <label>
        <input type="checkbox" name="disciplinas" value="${d}">
        ${d}
      </label>
    `;
    disciplinasDiv.appendChild(div);
  });
    }
// =======================
// SISTEMA DE INSCRIÇÃO
// =======================

// Criar modal personalizado dinamicamente
function criarModal() {
  if (document.getElementById("modalCustom")) return;

  const modal = document.createElement("div");
  modal.id = "modalCustom";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  modal.innerHTML = `
    <div style="
      background:#fff;
      width:90%;
      max-width:400px;
      border-radius:10px;
      padding:20px;
      text-align:center;
      font-family: Arial;
    ">
      <h3 id="modalTitulo"></h3>
      <p id="modalMensagem"></p>
      <div style="margin-top:20px;">
        <button id="btnSim" style="padding:10px 20px;">Sim</button>
        <button id="btnNao" style="padding:10px 20px;">Não</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function mostrarModal(titulo, mensagem, callback) {
  criarModal();

  document.getElementById("modalTitulo").innerText = titulo;
  document.getElementById("modalMensagem").innerText = mensagem;

  const modal = document.getElementById("modalCustom");
  modal.style.display = "flex";

  document.getElementById("btnSim").onclick = () => {
    modal.style.display = "none";
    callback(true);
  };

  document.getElementById("btnNao").onclick = () => {
    modal.style.display = "none";
    callback(false);
  };
}

// =======================
// FUNÇÃO DE INSCRIÇÃO
// =======================
document.getElementById("btnInscrever").addEventListener("click", function () {

  const nome = document.getElementById("nome").value.trim();
  const apelido = document.getElementById("apelido").value.trim();
  const classe = document.getElementById("classe").value;
  const curso = document.getElementById("curso").value;
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();

  // =======================
  // VALIDAÇÕES
  // =======================
  if (!nome || !apelido || !classe || !curso || !email || !telefone) {
    mostrarModal(
      "Campos em falta",
      "Preencha todos os campos antes de continuar.",
      () => {}
    );
    return;
  }

  // =======================
  // CONFIRMAÇÃO
  // =======================
  mostrarModal(
    "Confirmar Inscrição",
    `Confirma a inscrição do aluno ${nome} ${apelido} na ${classe}ª classe, curso ${curso}?`,
    function (confirmado) {

      if (!confirmado) {
        mostrarModal(
          "Cancelado",
          "A inscrição foi cancelada.",
          () => {}
        );
        return;
      }

      // =======================
      // AQUI É ONDE A INSCRIÇÃO ACONTECE
      // (Firebase, LocalStorage, API, etc.)
      // =======================
      const dadosInscricao = {
        nome,
        apelido,
        classe,
        curso,
        email,
        telefone,
        data: new Date().toLocaleString()
      };

      console.log("INSCRIÇÃO REALIZADA:", dadosInscricao);

      // =======================
      // SUCESSO
      // =======================
      mostrarModal(
        "Sucesso",
        "Inscrição realizada com sucesso!",
        () => {
          document.getElementById("nome").value = "";
          document.getElementById("apelido").value = "";
          document.getElementById("classe").value = "";
          document.getElementById("curso").value = "";
          document.getElementById("email").value = "";
          document.getElementById("telefone").value = "";
        }
      );
    }
  );
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

// ===== 1. CONFIRMAR MATRÍCULA =====
async function confirmar(numero){
  const ok = await mostrarModal('Deseja confirmar a matrícula deste aluno?');
  if(!ok) return;

  await db.collection('alunos').doc(numero).update({ confirmado:true });
  await mostrarModal('Matrícula confirmada com sucesso!');
  mostrarPainelAdmin();
}

// ===== 2. VER FORMULÁRIO DO ALUNO =====
async function verFormulario(numero){
  const doc = await db.collection('alunos').doc(numero).get();
  if(!doc.exists){ await mostrarModal('Aluno não encontrado'); return; }
  const a = doc.data();

  await mostrarModal(
    `NOME: ${a.nome}\nNÚMERO: ${a.numero}\nEMAIL: ${a.email}\nTELEFONE: ${a.telefone}\n` +
    `WHATSAPP: ${a.whatsapp}\nPAI/MÃE: ${a.paiMae}\nCLASSE: ${a.classe}\n` +
    `DISCIPLINAS: ${a.disciplina.join(', ')}\nDATA INSCRIÇÃO: ${a.dataInscricao}\n` +
    `CONFIRMADO: ${a.confirmado ? 'SIM' : 'NÃO'}`
  );
}

// ===== 3. REGISTRAR PAGAMENTO =====
async function registrarPagamento(numero){
  const valor = prompt('Valor pago:');
  if(valor === null) return;

  await db.collection('pagamentos').add({
    numero,
    valor: parseFloat(valor),
    data: new Date().toLocaleDateString(),
    status: 'Pago'
  });

  const alunoRef = db.collection('alunos').doc(numero);
  const doc = await alunoRef.get();
  const novaDivida = Math.max(0, (doc.data().divida || 0) - parseFloat(valor));
  await alunoRef.update({ divida: novaDivida });

  await mostrarModal('Pagamento registrado com sucesso');
  mostrarPainelAdmin();
}

// ===== 4. EDITAR PLANO DE PAGAMENTO =====
async function editarPlanoPagamento(numero){
  const total = prompt('Novo valor total do plano:');
  if(total === null) return;
  const parcelas = prompt('Número de parcelas:');
  if(parcelas === null) return;

  await db.collection('alunos').doc(numero).update({
    planoPagamento: { total: parseFloat(total), parcelas: parseInt(parcelas) }
  });

  await mostrarModal('Plano de pagamento atualizado com sucesso');
  mostrarPainelAdmin();
}

// ===== 5. SUSPENDER / ATIVAR ALUNO =====
async function suspender(numero, ativo){
  const ok = await mostrarModal(`Deseja realmente ${ativo ? 'suspender' : 'ativar'} este aluno?`);
  if(!ok) return;

  await db.collection('alunos').doc(numero).update({ ativo: !ativo });
  await mostrarModal(`Aluno ${!ativo ? 'ativado' : 'suspenso'} com sucesso`);
  mostrarPainelAdmin();
}

// ===== 6. EXCLUIR ALUNO =====
async function excluir(numero){
  const ok = await mostrarModal('Deseja realmente excluir este aluno?');
  if(!ok) return;

  await db.collection('alunos').doc(numero).delete();
  await mostrarModal('Aluno excluído definitivamente');
  mostrarPainelAdmin();
}

// ===== 7. EDITAR DÍVIDA =====
async function editarDivida(numero){
  const novaDivida = prompt('Informe o novo valor da dívida:');
  if(novaDivida === null) return;

  await db.collection('alunos').doc(numero).update({ divida: parseFloat(novaDivida) });
  await mostrarModal('Dívida atualizada com sucesso');
  mostrarPainelAdmin();
}

// ===== 8. FECHAR ANO LETIVO =====
async function fecharAno(numero){
  const ok = await mostrarModal('Deseja realmente fechar o ano letivo deste aluno?');
  if(!ok) return;

  const alunoRef = db.collection('alunos').doc(numero);
  const alunoDoc = await alunoRef.get();
  if(!alunoDoc.exists){ await mostrarModal('Aluno não encontrado'); return; }

  const aluno = alunoDoc.data();

  await db.collection('historico').add({
    numero: aluno.numero,
    anoLetivo: new Date().getFullYear(),
    disciplina: aluno.disciplina.join(', '),
    mediaFinal: aluno.mediaFinal || 0,
    statusAcademico: aluno.statusAcademico
  });

  await alunoRef.update({ statusAcademico: 'Reprovado', confirmado: false });
  await mostrarModal('Ano letivo fechado e histórico salvo');
  mostrarPainelAdmin();
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
