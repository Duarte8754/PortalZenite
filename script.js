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
// ELEMENTOS DO FORMULÁRIO E INSCRIÇÃO
// ============================
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formInscricao");
  const classe = document.getElementById("classe");
  const curso = document.getElementById("curso");
  const disciplinasDiv = document.getElementById("disciplinas");
  const labelCurso = document.getElementById("labelCurso");

  const disciplinasBase = ["Português","Matemática","História","Geografia",
                           "Educação Física","Inglês","TICs","Filosofia"];
  const disciplinasCurso = {
    Letras: ["Literatura"],
    Ciencias: ["Biologia","Química","Física"],
    Desenho: ["Desenho","Artes","Geometria Descritiva"]
  };

  function mostrarDisciplinas(lista){
    disciplinasDiv.innerHTML = "<h4>Selecione as disciplinas</h4>";
    lista.forEach(d => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" name="disciplinas" value="${d}"> ${d}`;
      disciplinasDiv.appendChild(label);
    });
  }

  classe.addEventListener("change", () => {
    disciplinasDiv.innerHTML = "";
    curso.value = "";
    if(classe.value === "9" || classe.value === "10"){
      curso.style.display = "none";
      labelCurso.style.display = "none";
      mostrarDisciplinas(disciplinasBase);
    } else if(classe.value === "11" || classe.value === "12"){
      curso.style.display = "block";
      labelCurso.style.display = "block";
    }
  });

  curso.addEventListener("change", () => {
    if(!curso.value) return;
    mostrarDisciplinas(disciplinasBase.concat(disciplinasCurso[curso.value] || []));
  });

  function gerarNumeroAluno(){ return "2007"+Math.floor(10000+Math.random()*90000); }

  // ==========================
// ALERTA PERSONALIZADO FIXO
// ==========================
function mostrarAlerta(titulo, mensagem, tipo = "sucesso") {
  const alerta = document.getElementById("alertaInscricao");
  const tituloEl = document.getElementById("alertaTitulo");
  const mensagemEl = document.getElementById("alertaMensagem");

  if (!alerta) return console.error("Alerta não encontrado no HTML");

  tituloEl.textContent = titulo;
  mensagemEl.textContent = mensagem;

  alerta.classList.remove("erro");
  if (tipo === "erro") alerta.classList.add("erro");

  alerta.style.display = "block";
}

// Função para fechar o alerta manualmente
function fecharAlerta() {
  const alerta = document.getElementById("alertaInscricao");
  if (!alerta) return;
  alerta.style.display = "none";
    }

  // ==========================
  // ENVIO DO FORMULÁRIO
  // ==========================
  form.addEventListener("submit", async e => {
    e.preventDefault();

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

    // Valida campos obrigatórios
    if(!nome||!apelido||!bi||!dataNascimento||!provincia||!distrito||
       !telefone||!email||!nomeEncarregado||!telefoneEncarregado||!classe.value){
      mostrarAlerta("Erro","Preencha todos os campos obrigatórios","erro");
      return;
    }
    if((classe.value==="11"||classe.value==="12")&&!curso.value){
      mostrarAlerta("Erro","Selecione o curso","erro");
      return;
    }

    const checkboxes = document.querySelectorAll('input[name="disciplinas"]:checked');
    if(!checkboxes.length){
      mostrarAlerta("Erro","Selecione pelo menos uma disciplina","erro");
      return;
    }
    const disciplinasSelecionadas = Array.from(checkboxes).map(c=>c.value);

    const numeroAluno = gerarNumeroAluno();
    const senha = nome.toLowerCase()+numeroAluno+"@IZ.com";

    const dados = { nome,apelido,bi,dataNascimento,provincia,distrito,telefone,whatsapp,email,
                    nomePai,nomeMae,nomeEncarregado,telefoneEncarregado,
                    classe:classe.value,curso:curso.value||"Geral",
                    turma:["A","B","C","D"][Math.floor(Math.random()*4)],
                    numeroAluno,senha,disciplinas:disciplinasSelecionadas,
                    statusAcademico:"-",divida:0,ativo:true,
                    criadoEm:firebase.firestore.FieldValue.serverTimestamp() };

    try{
      await db.collection("alunos").doc(numeroAluno).set(dados);
      mostrarAlerta("Sucesso",`Inscrição concluída\nNúmero: ${numeroAluno}\nSenha: ${senha}`,"sucesso");
      form.reset();
      disciplinasDiv.innerHTML="";
      curso.style.display="none";
      labelCurso.style.display="none";
    }catch(err){
      console.error(err);
      mostrarAlerta("Erro","Falha ao guardar os dados","erro");
    }
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


// ===== PAINEL DO ALUNO =====
// Função para mostrar abas
function mostrarAba(nome) {
  document.querySelectorAll('.aba').forEach(a => a.style.display = 'none');
  document.getElementById('aba' + nome.charAt(0).toUpperCase() + nome.slice(1)).style.display = 'block';
}

// Inicializa abas
document.querySelectorAll('.aba-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const aba = btn.dataset.aba;
    if (aba) mostrarAba(aba);
  });
});

// Função para mostrar abas
function mostrarAba(nome) {
  document.querySelectorAll('.aba').forEach(a => a.style.display = 'none');
  document.getElementById('aba' + nome.charAt(0).toUpperCase() + nome.slice(1)).style.display = 'block';
}

// Inicializa abas
document.querySelectorAll('.aba-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const aba = btn.dataset.aba;
    if (aba) mostrarAba(aba);
  });
});

// Função para carregar painel do aluno
async function mostrarPainelAluno(aluno) {
  mostrarPagina('painelAluno');

  // PERFIL
  document.getElementById('perfilNome').innerText = aluno.nome || '-';
  document.getElementById('perfilNumero').innerText = aluno.numeroAluno || '-';
  document.getElementById('perfilClasse').innerText = aluno.classe || '-';
  document.getElementById('perfilTurma').innerText = aluno.turma || '-';
  document.getElementById('perfilNascimento').innerText = aluno.dataNascimento || '-';
  document.getElementById('perfilContato').innerText = `Tel: ${aluno.telefone || '-'} / WhatsApp: ${aluno.whatsapp || '-'}`;
  document.getElementById('mediaFinalAluno').innerText = '-';
  document.getElementById('statusAcademicoAluno').innerText = aluno.statusAcademico || '-';

  // NOTAS
  const tabelaBody = document.querySelector('#tabelaNotas tbody');
  tabelaBody.innerHTML = '';
  const disciplinas = aluno.disciplinas || [];
  const dadosNotas = {};

  disciplinas.forEach(d => {
    dadosNotas[d] = {1:{teste1:'-',teste2:'-',trabalho:'-',final:'-'}, 2:{teste1:'-',teste2:'-',trabalho:'-',final:'-'}, 3:{teste1:'-',teste2:'-',trabalho:'-',final:'-'}};
  });

  // Buscar notas do Firestore
  const notasSnap = await db.collection('notas').where('numeroAluno','==',aluno.numeroAluno).get();
  notasSnap.forEach(doc => {
    const n = doc.data();
    if(dadosNotas[n.disciplina] && dadosNotas[n.disciplina][n.trimestre]){
      dadosNotas[n.disciplina][n.trimestre][n.tipo] = n.nota;
    }
  });

  function mediaTrimestre(tri){
    const notas = ['teste1','teste2','trabalho','final'].map(t => tri[t]).filter(v => typeof v === 'number');
    if(!notas.length) return '-';
    return (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1);
  }

  let somaMedias=0, contadorMedias=0;

  disciplinas.forEach(disc => {
    [1,2,3].forEach(t => {
      const mediaT = mediaTrimestre(dadosNotas[disc][t]);
      if(mediaT !== '-') { somaMedias += parseFloat(mediaT); contadorMedias++; }
      tabelaBody.innerHTML += `<tr>
        <td>${disc}</td>
        <td>${t}</td>
        <td>${dadosNotas[disc][t].teste1}</td>
        <td>${dadosNotas[disc][t].teste2}</td>
        <td>${dadosNotas[disc][t].trabalho}</td>
        <td>${dadosNotas[disc][t].final}</td>
        <td>${mediaT}</td>
      </tr>`;
    });
  });

  const mediaFinal = contadorMedias ? (somaMedias/contadorMedias).toFixed(1) : '-';
  document.getElementById('mediaFinalAluno').innerText = mediaFinal;

  // Define cor e status
  const statusSpan = document.getElementById('statusAcademicoAluno');
  if(mediaFinal==='-'){ statusSpan.innerText='-'; statusSpan.style.color='black'; }
  else if(mediaFinal>=10){ statusSpan.innerText='Aprovado'; statusSpan.style.color='green'; }
  else{ statusSpan.innerText='Reprovado'; statusSpan.style.color='red'; }

  // Inicializa aba perfil
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
      doc.data().disciplinas.forEach(d => {
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
            <p><strong>Número do Aluno:</strong> ${numeroAluno}</p>
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

// ===== LANÇAR NOTA PROFISSIONAL =====
const formNota = document.getElementById('formNota');
const selectAluno = document.getElementById('notaAluno');
const selectDisciplina = document.getElementById('notaDisciplina');
const inputValor = document.getElementById('notaValor');
const selectTrimestre = document.getElementById('notaTrimestre');
const selectTipo = document.getElementById('notaTipo');

// Preencher alunos no select
const selectAluno = document.getElementById('notaAluno');
const selectDisciplina = document.getElementById('notaDisciplina');

async function carregarAlunos() {
  const snapshot = await db.collection('alunos').get();
  snapshot.forEach(doc => {
    const aluno = doc.data();
    const option = document.createElement('option');
    option.value = aluno.numeroAluno;
    option.textContent = `${aluno.nome} (${aluno.numeroAluno})`;
    selectAluno.appendChild(option);
  });
}

// Atualiza disciplinas quando o aluno muda
selectAluno.addEventListener('change', async () => {
  selectDisciplina.innerHTML = '<option value="">Selecione a disciplina</option>';
  const numero = selectAluno.value;
  if (!numero) return;

  const doc = await db.collection('alunos').doc(numero).get();
  if (!doc.exists) return;

  const aluno = doc.data();
  (aluno.disciplinas || []).forEach(d => {
    const option = document.createElement('option');
    option.value = d;
    option.textContent = d;
    selectDisciplina.appendChild(option);
  });
});

// Lançar nota
document.getElementById('formNota').addEventListener('submit', async e => {
  e.preventDefault();
  const numero = selectAluno.value;
  const disciplina = selectDisciplina.value;
  const nota = parseFloat(document.getElementById('notaValor').value);
  const trimestre = parseInt(document.getElementById('notaTrimestre').value);
  const tipo = document.getElementById('notaTipo').value;

  if (!numero || !disciplina) {
    alert('Preencha o aluno e a disciplina');
    return;
  }

  try {
    // Salva nota no Firestore
    await db.collection('notas').add({ numero, disciplina, nota, trimestre, tipo, criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Nota lançada com sucesso!');

    // Atualiza painel do aluno em tempo real (se estiver aberto)
    if (window.painelAlunoAtual && window.painelAlunoAtual.numeroAluno === numero) {
      mostrarPainelAluno(window.painelAlunoAtual);
    }

    // Limpa formulário
    document.getElementById('notaValor').value = '';
  } catch(err) {
    console.error(err);
    alert('Erro ao lançar nota: ' + err.message);
  }
});

// Carrega alunos ao iniciar
carregarAlunos();

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
