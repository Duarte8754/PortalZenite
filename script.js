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

// ===== MODAL =====
function abrirModal(titulo, conteudoHTML) {
  document.getElementById('modalTitulo').innerText = titulo;
  document.getElementById('conteudoFormulario').innerHTML = conteudoHTML;
  document.getElementById('modalFormulario').style.display = 'flex';
}

function fecharModal() {
  document.getElementById('modalFormulario').style.display = 'none';
}

// ======================
// NAVEGAÇÃO ENTRE PÁGINAS
// ======================

// Função para mostrar uma página e esconder as outras
function mostrarPagina(id) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const pagina = document.getElementById(id);
  if (pagina) pagina.style.display = 'block';

  // Salva a última página acessada
  localStorage.setItem('paginaAtual', id);
}

// Inicializa a página ao carregar
window.addEventListener('DOMContentLoaded', () => {
  const paginaSalva = localStorage.getItem('paginaAtual') || 'home';
  mostrarPagina(paginaSalva);
});

// Funções auxiliares para navegação
function mostrarInscricao() { mostrarPagina('inscricao'); }
function mostrarLogin() { mostrarPagina('login'); }
function mostrarHome() { mostrarPagina('home'); }
function mostrarPainelAluno() { mostrarPagina('painelAluno'); }
function mostrarPainelAdmin() { mostrarPagina('painelAdmin'); }

// Exemplo: ligar botões a essas funções
document.getElementById('btnInscricao')?.addEventListener('click', mostrarInscricao);
document.getElementById('btnLogin')?.addEventListener('click', mostrarLogin);
document.getElementById('btnHome')?.addEventListener('click', mostrarHome);
document.getElementById('btnSair')?.addEventListener('click', () => {
  mostrarHome();
  localStorage.removeItem('paginaAtual');
});

// ======================
// FUNÇÃO VOLTAR / HOME
// ======================
function voltarHome() {
    mostrarPagina('home');       // Mostra a página inicial
    localStorage.setItem('paginaAtual', 'home'); // Atualiza o histórico da página
}

// LIGA O BOTÃO VOLTAR
document.getElementById('btnVoltar')?.addEventListener('click', voltarHome);

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

// ============================
// ELEMENTOS DO FORMULÁRIO
// ============================
const classe = document.getElementById("classe");
const curso = document.getElementById("curso");
const disciplinasDiv = document.getElementById("disciplinasDiv");
const form = document.getElementById("formInscricao");

// ============================
// DISCIPLINAS
// ============================
const disciplinasBase = [
  "Português",
  "Matemática",
  "História",
  "Geografia",
  "Educação Física",
  "Inglês",
  "TICs",
  "Filosofia"
];

const disciplinasCurso = {
  Letras: ["Literatura"],
  Ciencias: ["Biologia", "Química", "Física"],
  Desenho: ["Desenho", "Artes", "Geometria Descritiva"]
};

// ============================
// MOSTRAR DISCIPLINAS
// ============================
function mostrarDisciplinas(lista) {
  disciplinasDiv.innerHTML = "<h4>Selecione as disciplinas</h4>";

  lista.forEach(d => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.innerHTML = `
      <input type="checkbox" name="disciplinas" value="${d}">
      ${d}
    `;
    disciplinasDiv.appendChild(label);
  });
}

// ============================
// CLASSE → DISCIPLINAS
// ============================
classe.addEventListener("change", () => {
  disciplinasDiv.innerHTML = "";
  curso.value = "";

  if (classe.value === "9" || classe.value === "10") {
    curso.style.display = "none";
    mostrarDisciplinas(disciplinasBase);
  }

  if (classe.value === "11" || classe.value === "12") {
    curso.style.display = "block";
  }
});

// ============================
// CURSO → DISCIPLINAS (11ª / 12ª)
// ============================
curso.addEventListener("change", () => {
  if (!curso.value) return;

  const listaFinal = disciplinasBase.concat(disciplinasCurso[curso.value]);
  mostrarDisciplinas(listaFinal);
});

// ============================
// GERAR NÚMERO E SENHA
// ============================
function gerarNumeroAluno() {
  return "2007" + Math.floor(10000 + Math.random() * 90000);
}

// ============================
// SUBMIT INSCRIÇÃO
// ============================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  // CAMPOS OBRIGATÓRIOS
  const nome = document.getElementById("nome").value.trim();
  const apelido = document.getElementById("apelido").value.trim();
  const bi = document.getElementById("bi").value.trim();
  const dataNascimento = document.getElementById("dataNascimento").value;
  const provincia = document.getElementById("provincia").value.trim();
  const distrito = document.getElementById("distrito").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const whatsapp = document.getElementById("whatsapp").value.trim();
  const email = document.getElementById("email").value.trim();
  const nomePai = document.getElementById("nomePai").value.trim();
  const nomeMae = document.getElementById("nomeMae").value.trim();
  const nomeEncarregado = document.getElementById("nomeEncarregado").value.trim();
  const telefoneEncarregado = document.getElementById("telefoneEncarregado").value.trim();

  if (
    !nome || !apelido || !bi || !dataNascimento ||
    !provincia || !distrito || !telefone ||
    !email || !nomeEncarregado || !telefoneEncarregado ||
    !classe.value
  ) {
    mostrarAlerta("Erro", "Preencha todos os campos obrigatórios.");
    return;
  }

  if ((classe.value === "11" || classe.value === "12") && !curso.value) {
    mostrarAlerta("Erro", "Selecione o curso.");
    return;
  }

  // PEGA DISCIPLINAS SELECIONADAS
  const checkboxes = document.querySelectorAll('input[name="disciplinas[]"]:checked');
  if (!checkboxes.length) {
    mostrarAlerta("Erro", "Selecione pelo menos uma disciplina.");
    return;
  }
  const disciplinasSelecionadas = Array.from(checkboxes).map(c => c.value);

  // GERAR CREDENCIAIS
  const numeroAluno = gerarNumeroAluno();
  const senha = nome.toLowerCase() + numeroAluno + "@IZ.com";

  // DADOS DO ALUNO
  const dados = {
    nome,
    apelido,
    bi,
    dataNascimento,
    turma: ['A','B','C','D'][Math.floor(Math.random()*4)],
    provincia,
    distrito,
    telefone,
    whatsapp,
    email,
    nomePai,
    nomeMae,
    nomeEncarregado,
    telefoneEncarregado,
    classe: classe.value,
    curso: curso.value || "Geral",
    numeroAluno,
    senha,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    confirmado: false,
    statusAcademico: '-',
    divida: 0,
    ativo: true,
    planoPagamento: { total: 450, parcelas: 2 },
    disciplina: disciplinasSelecionadas
  };

  // SALVAR NO FIRESTORE
  db.collection("alunos").doc(numeroAluno).set(dados)
    .then(() => {
      mostrarAlerta(
        "Inscrição concluída",
        `Número do Aluno: ${numeroAluno}\nSenha: ${senha}`
      );
      form.reset();
      disciplinasDiv.innerHTML = "";
      curso.style.display = "none";
    })
    .catch(() => {
      mostrarAlerta("Erro", "Falha ao guardar os dados no sistema.");
    });
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

  
// ===== PERFIL DO ALUNO =====
document.getElementById('perfilNome').innerText = aluno.nome || '-';
document.getElementById('perfilNumero').innerText = aluno.numeroAluno || '-';
document.getElementById('perfilClasse').innerText = aluno.classe || '-';
document.getElementById('perfilTurma').innerText = aluno.turma || '-';
document.getElementById('perfilNascimento').innerText = aluno.dataNascimento || '-';
document.getElementById('perfilContato').innerText =
  `Tel: ${aluno.telefone || '-'} / WhatsApp: ${aluno.whatsapp || '-'}`;

document.getElementById('mediaFinalAluno').innerText = '-';
document.getElementById('statusAcademicoAluno').innerText = aluno.statusAcademico || '-';

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
  const a = doc.data();
  const numero = a.numeroAluno || doc.id;

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${a.nome || '-'}</td>
    <td>${numero}</td>
    <td>${a.ativo ? 'Ativo' : 'Suspenso'}</td>
    <td>${a.statusAcademico || 'Regular'}</td>
    <td>${a.divida ?? 0}</td>
    <td>
      <button onclick="confirmar('${numero}')">Confirmar</button>
      <button onclick="verFormulario('${numero}')">Ver Formulário</button>
      <button onclick="registrarPagamento('${numero}')">Registrar Pagamento</button>
      <button onclick="editarPlanoPagamento('${numero}')">Editar Plano</button>
      <button onclick="suspender('${numero}', ${a.ativo})">${a.ativo ? 'Suspender' : 'Ativar'}</button>
      <button onclick="excluir('${numero}')">Excluir</button>
      <button onclick="editarDivida('${numero}')">Editar Dívida</button>
      <button onclick="fecharAno('${numero}')">Fechar Ano</button>
    </td>
  `;
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

function fecharModal() {
    const modal = document.getElementById('modalFormulario');
    if (!modal) return;
    modal.style.display = 'none';
}

// ===== BUSCAR ALUNO =====
document.getElementById('btnBuscarAluno').addEventListener('click', async () => {
    const busca = document.getElementById('buscaAluno').value.trim().toLowerCase();
    if (!busca) {
        mostrarPainelAdmin(); // Se vazio, mostra todos os alunos
        return;
    }

    try {
        const snapshot = await db.collection('alunos').get();
        const tabela = document.getElementById('tabelaAlunos');
        tabela.innerHTML = `<tr>
            <th>Nome</th><th>Número</th><th>Status</th><th>Status Académico</th><th>Dívida</th><th>Ações</th>
        </tr>`;

        snapshot.forEach(doc => {
            const a = doc.data();
            const nomeLower = (a.nome || '').toLowerCase();
            const numeroAluno = a.numeroAluno || doc.id;

            if (nomeLower.includes(busca) || numeroAluno.includes(busca)) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${a.nome}</td>
                    <td>${numeroAluno}</td>
                    <td>${a.ativo?'Ativo':'Suspenso'}</td>
                    <td>${a.statusAcademico || '-'}</td>
                    <td>${a.divida || 0}</td>
                    <td>
                        <button onclick="confirmar('${numeroAluno}')">Confirmar</button>
                        <button onclick="verFormulario('${numeroAluno}')">Ver Formulário</button>
                        <button onclick="registrarPagamento('${numeroAluno}')">Registrar Pagamento</button>
                        <button onclick="editarPlanoPagamento('${numeroAluno}')">Editar Plano</button>
                        <button onclick="suspender('${numeroAluno}',${a.ativo})">${a.ativo?'Suspender':'Ativar'}</button>
                        <button onclick="excluir('${numeroAluno}')">Excluir</button>
                        <button onclick="editarDivida('${numeroAluno}')">Editar Dívida</button>
                        <button onclick="fecharAno('${numeroAluno}')">Fechar Ano</button>
                    </td>`;
                tabela.appendChild(tr);
            }
        });
    } catch(err) {
        console.error(err);
        alert('Erro ao buscar aluno.');
    }
});


// ===== FUNÇÕES COMPLETAS DO ADMINISTRADOR =====

// 1️⃣ Confirmar matrícula
async function confirmar(numeroAluno) {
    try {
        await db.collection('alunos').doc(numeroAluno).update({confirmado: true});
        alert(`✅ Matrícula do aluno ${numeroAluno} confirmada com sucesso!`);
        mostrarPainelAdmin();
    } catch (err) {
        alert(`❌ Erro ao confirmar matrícula do aluno ${numeroAluno}: ${err.message}`);
    }
}

// 2️⃣ Ver formulário completo do aluno
async function verFormulario(numeroAluno) {
    try {
        const doc = await db.collection('alunos').doc(numeroAluno).get();
        if (!doc.exists) {
            abrirModal('Erro', '<p>❌ Aluno não encontrado!</p>');
            return;
        }

        const a = doc.data();

        abrirModal('📄 Formulário do Aluno', `
            <h3>DADOS PESSOAIS</h3>
            <p><strong>Nome:</strong> ${a.nome || '-'}</p>
            <p><strong>Apelido:</strong> ${a.apelido || '-'}</p>
            <p><strong>BI:</strong> ${a.bi || '-'}</p>
            <p><strong>Data de Nascimento:</strong> ${a.dataNascimento || a.nascimento || '-'}</p>
            <p><strong>Província:</strong> ${a.provincia || '-'}</p>
            <p><strong>Distrito:</strong> ${a.distrito || '-'}</p>
            <p><strong>Telefone:</strong> ${a.telefone || '-'}</p>
            <p><strong>WhatsApp:</strong> ${a.whatsapp || '-'}</p>
            <p><strong>Email:</strong> ${a.email || '-'}</p>

            <h3>DADOS FAMILIARES</h3>
            <p><strong>Nome do Pai:</strong> ${a.nomePai || '-'}</p>
            <p><strong>Nome da Mãe:</strong> ${a.nomeMae || '-'}</p>
            <p><strong>Nome do Encarregado:</strong> ${a.nomeEncarregado || '-'}</p>
            <p><strong>Telefone do Encarregado:</strong> ${a.telefoneEncarregado || '-'}</p>

            <h3>INFORMAÇÕES ACADÊMICAS</h3>
            <p><strong>Classe:</strong> ${a.classe || '-'}</p>
            <p><strong>Curso:</strong> ${a.curso || 'Geral'}</p>
            <p><strong>Número do Aluno:</strong> ${a.numero || '-'}</p>
            <p><strong>Senha:</strong> ${a.senha || '-'}</p>
        `);
    } catch (err) {
        alert(`❌ Erro ao carregar formulário do aluno ${numeroAluno}: ${err.message}`);
        console.error(err);
    }
}

// 3️⃣ Registrar pagamento
function registrarPagamento(numeroAluno) {
    abrirModal('💰 Registrar Pagamento', `
        <input id="valorPagamento" placeholder="Valor pago">
        <button onclick="salvarPagamento('${numeroAluno}')">Confirmar Pagamento</button>
    `);
}

async function salvarPagamento(numeroAluno) {
    const valor = parseFloat(document.getElementById('valorPagamento').value);
    if (!valor || isNaN(valor)) { alert('⚠️ Informe um valor válido para o pagamento!'); return; }
    try {
        await db.collection('pagamentos').add({
            numero: numeroAluno,
            valor: valor,
            data: new Date().toLocaleDateString(),
            status: 'Pago'
        });
        fecharModal();
        alert(`✅ Pagamento de ${valor} registrado com sucesso para o aluno ${numeroAluno}!`);
        mostrarPainelAdmin();
    } catch (err) {
        alert(`❌ Erro ao registrar pagamento do aluno ${numeroAluno}: ${err.message}`);
    }
}

// 4️⃣ Editar plano de pagamento
function editarPlanoPagamento(numeroAluno) {
    abrirModal('✏️ Editar Plano de Pagamento', `
        <select id="novoPlano">
            <option value="Basico">Básico</option>
            <option value="Premium">Premium</option>
            <option value="VIP">VIP</option>
        </select>
        <button onclick="salvarPlano('${numeroAluno}')">Salvar Plano</button>
    `);
}

async function salvarPlano(numeroAluno) {
    const plano = document.getElementById('novoPlano').value;
    try {
        await db.collection('alunos').doc(numeroAluno).update({planoPagamento: {plano}});
        fecharModal();
        alert(`✅ Plano de pagamento do aluno ${numeroAluno} atualizado para "${plano}"!`);
        mostrarPainelAdmin();
    } catch (err) {
        alert(`❌ Erro ao atualizar plano do aluno ${numeroAluno}: ${err.message}`);
    }
}

// 5️⃣ Suspender ou ativar aluno
async function suspender(numeroAluno, ativo) {
    try {
        await db.collection('alunos').doc(numeroAluno).update({ativo: !ativo});
        alert(`⚠️ Aluno ${numeroAluno} foi ${!ativo ? 'ativado' : 'suspenso'} com sucesso!`);
        mostrarPainelAdmin();
    } catch (err) {
        alert(`❌ Erro ao atualizar status do aluno ${numeroAluno}: ${err.message}`);
    }
}

// 6️⃣ Excluir aluno
async function excluir(numeroAluno) {
    if (confirm(`⚠️ Deseja realmente excluir o aluno ${numeroAluno}? Essa ação não pode ser desfeita!`)) {
        try {
            await db.collection('alunos').doc(numeroAluno).delete();
            alert(`🗑️ Aluno ${numeroAluno} excluído com sucesso!`);
            mostrarPainelAdmin();
        } catch (err) {
            alert(`❌ Erro ao excluir aluno ${numeroAluno}: ${err.message}`);
        }
    }
}

// 7️⃣ Editar dívida do aluno
async function editarDivida(numeroAluno) {
    const nova = prompt(`💰 Informe o novo valor da dívida do aluno ${numeroAluno}:`);
    if (nova !== null) {
        const valor = parseFloat(nova);
        if (isNaN(valor)) { alert('⚠️ Valor inválido!'); return; }
        try {
            await db.collection('alunos').doc(numeroAluno).update({divida: valor});
            alert(`✅ Dívida do aluno ${numeroAluno} atualizada para ${valor}!`);
            mostrarPainelAdmin();
        } catch (err) {
            alert(`❌ Erro ao atualizar dívida do aluno ${numeroAluno}: ${err.message}`);
        }
    }
}

// 8️⃣ Fechar ano letivo
function fecharAno(numeroAluno) {
    abrirModal('⚠️ Fechar Ano', `
        <p>Tem certeza que deseja fechar o ano letivo do aluno ${numeroAluno}? Isso registrará o status final acadêmico.</p>
        <button onclick="confirmarFecharAno('${numeroAluno}')">SIM, Fechar Ano</button>
    `);
}

async function confirmarFecharAno(numeroAluno) {
    try {
        await db.collection('alunos').doc(numeroAluno).update({status: 'Encerrado'});
        fecharModal();
        alert(`✅ Ano letivo do aluno ${numeroAluno} fechado com sucesso!`);
        mostrarPainelAdmin();
    } catch (err) {
        alert(`❌ Erro ao fechar ano do aluno ${numeroAluno}: ${err.message}`);
    }
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
