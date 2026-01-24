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

  // Listas vazias (preparar para preencher notas, extrato, histórico, calendário)
  document.getElementById('listaNotas').innerHTML='';
  document.getElementById('listaExtrato').innerHTML='';
  document.getElementById('listaHistorico').innerHTML='';
  document.getElementById('listaCalendario').innerHTML='';

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
    const plano = document.getElementById('novoPlano').value;
    await db.collection('alunos').doc(id).update({ plano });
    fecharModal();
    Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Plano atualizado', timer: 2000, showConfirmButton: false });
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
