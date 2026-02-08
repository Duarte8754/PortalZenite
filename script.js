// ===== CONFIGURAÇÃO DO FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyAk2_prEtJXNPanJFRGHxbQqXi1TVhX0e8",
    authDomain: "portal-de-aluno-zenite-e816a.firebaseapp.com",
    projectId: "portal-de-aluno-zenite-e816a",
    storageBucket: "portal-de-aluno-zenite-e816a.firebasestorage.app",
    messagingSenderId: "491945820334",
    appId: "1:491945820334:web:9032740671388bbf056d3f"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== VARIÁVEIS GLOBAIS =====
let alunoLogado = null;
let adminLogado = false;
let observers = [];

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function mostrarPagina(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const pagina = document.getElementById(id);
    if (pagina) {
        pagina.style.display = 'block';
        localStorage.setItem('paginaAtual', id);
    }
    
    if (id === 'painelAdmin') {
        carregarPainelAdmin();
    } else if (id === 'inscricao') {
        inicializarFormInscricao();
    }
}

function voltarHome() {
    mostrarPagina('home');
    alunoLogado = null;
    adminLogado = false;
    pararObservadores();
    localStorage.removeItem('alunoData');
}

function fazerLogout() {
    pararObservadores();
    alunoLogado = null;
    adminLogado = false;
    localStorage.removeItem('alunoData');
    mostrarPagina('home');
}

// ===== FUNÇÕES AUXILIARES =====
function mostrarAlerta(titulo, mensagem, tipo = 'info') {
    const modal = document.getElementById('alertModal');
    const tituloEl = document.getElementById('alertTitle');
    const mensagemEl = document.getElementById('alertMessage');
    
    tituloEl.textContent = titulo;
    mensagemEl.textContent = mensagem;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.background = tipo === 'erro' ? '#f8d7da' : 
                                   tipo === 'sucesso' ? '#d4edda' : 
                                   '#d1ecf1';
    
    modal.style.display = 'flex';
}

function fecharAlerta() {
    document.getElementById('alertModal').style.display = 'none';
}

function gerarNumeroAluno() {
    return '2007' + Math.floor(10000 + Math.random() * 90000);
}

function formatarData(data) {
    if (!data) return '-';
    if (data.toDate) data = data.toDate();
    return new Date(data).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatarDataCompleta(data) {
    if (!data) return '-';
    if (data.toDate) data = data.toDate();
    return new Date(data).toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// ===== INICIALIZAÇÃO DO FORMULÁRIO DE INSCRIÇÃO =====
function inicializarFormInscricao() {
    const classe = document.getElementById('classe');
    const curso = document.getElementById('curso');
    const labelCurso = document.getElementById('labelCurso');
    const disciplinasDiv = document.getElementById('disciplinas');
    
    const disciplinasBase = [
        "Português", "Matemática", "História", "Geografia",
        "Educação Física", "Inglês", "TICs", "Filosofia"
    ];
    
    const disciplinasCurso = {
        Letras: ["Literatura", "Gramática Avançada"],
        Ciencias: ["Biologia", "Química", "Física", "Geologia"],
        Desenho: ["Desenho", "Artes", "Geometria Descritiva", "Pintura"]
    };
    
    function mostrarDisciplinas(lista) {
        disciplinasDiv.innerHTML = '<h4>Selecione as disciplinas:</h4>';
        lista.forEach(disciplina => {
            const label = document.createElement('label');
            label.className = 'disciplina-label';
            label.innerHTML = `
                <input type="checkbox" name="disciplinas" value="${disciplina}">
                ${disciplina}
            `;
            disciplinasDiv.appendChild(label);
        });
    }
    
    classe.addEventListener('change', function() {
        const classeSelecionada = this.value;
        
        curso.style.display = 'none';
        labelCurso.style.display = 'none';
        curso.value = '';
        
        mostrarDisciplinas(disciplinasBase);
        
        if (classeSelecionada === '11' || classeSelecionada === '12') {
            curso.style.display = 'block';
            labelCurso.style.display = 'block';
        }
    });
    
    curso.addEventListener('change', function() {
        const cursoSelecionado = this.value;
        if (!cursoSelecionado) return;
        
        const disciplinasCompletas = [...disciplinasBase];
        if (disciplinasCurso[cursoSelecionado]) {
            disciplinasCompletas.push(...disciplinasCurso[cursoSelecionado]);
        }
        
        mostrarDisciplinas(disciplinasCompletas);
    });
    
    const form = document.getElementById('formInscricao');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const dados = {
            nome: document.getElementById('nome').value.trim(),
            apelido: document.getElementById('apelido').value.trim(),
            bi: document.getElementById('bi').value.trim(),
            dataNascimento: document.getElementById('dataNascimento').value,
            provincia: document.getElementById('provincia').value.trim(),
            distrito: document.getElementById('distrito').value.trim(),
            telefone: document.getElementById('telefone').value.trim(),
            whatsapp: document.getElementById('whatsapp').value.trim(),
            email: document.getElementById('email').value.trim(),
            nomePai: document.getElementById('nomePai').value.trim(),
            nomeMae: document.getElementById('nomeMae').value.trim(),
            nomeEncarregado: document.getElementById('nomeEncarregado').value.trim(),
            telefoneEncarregado: document.getElementById('telefoneEncarregado').value.trim(),
            classe: document.getElementById('classe').value,
            curso: document.getElementById('curso').value || 'Geral',
            turma: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
            numeroAluno: gerarNumeroAluno(),
            senha: Math.random().toString(36).slice(-8) + '@ZN',
            disciplinas: Array.from(document.querySelectorAll('input[name="disciplinas"]:checked'))
                            .map(cb => cb.value),
            statusAcademico: 'Regular',
            divida: 0,
            ativo: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (!dados.disciplinas.length) {
            mostrarAlerta('Erro', 'Selecione pelo menos uma disciplina!', 'erro');
            return;
        }
        
        if ((dados.classe === '11' || dados.classe === '12') && !dados.curso) {
            mostrarAlerta('Erro', 'Selecione um curso para a 11ª ou 12ª classe!', 'erro');
            return;
        }
        
        try {
            await db.collection('alunos').doc(dados.numeroAluno).set(dados);
            
            mostrarAlerta(
                '✅ Inscrição Concluída!',
                `Número do Aluno: ${dados.numeroAluno}\nSenha: ${dados.senha}\n\nGuarde estas informações!`,
                'sucesso'
            );
            
            form.reset();
            disciplinasDiv.innerHTML = '';
            
        } catch (error) {
            console.error('Erro ao salvar inscrição:', error);
            mostrarAlerta('Erro', 'Não foi possível concluir a inscrição.', 'erro');
        }
    });
}

// ===== SISTEMA DE LOGIN =====
document.getElementById('formLogin').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    
    // Login do administrador
    if (usuario === 'charmyla.admin' && senha === 'zenite1818') {
        adminLogado = true;
        mostrarPagina('painelAdmin');
        mostrarAlerta('Bem-vindo!', 'Login como administrador realizado!', 'sucesso');
        return;
    }
    
    try {
        let alunoData = null;
        
        // Buscar por email
        const queryByEmail = await db.collection('alunos')
            .where('email', '==', usuario)
            .limit(1)
            .get();
        
        if (!queryByEmail.empty) {
            alunoData = queryByEmail.docs[0].data();
        } else {
            // Buscar por número
            const doc = await db.collection('alunos').doc(usuario).get();
            if (doc.exists) {
                alunoData = doc.data();
            }
        }
        
        if (!alunoData) {
            throw new Error('Aluno não encontrado!');
        }
        
        if (alunoData.senha !== senha) {
            throw new Error('Senha incorreta!');
        }
        
        if (!alunoData.ativo) {
            throw new Error('Conta suspensa. Contacte a administração.');
        }
        
        alunoLogado = alunoData;
        localStorage.setItem('alunoData', JSON.stringify(alunoData));
        mostrarPainelAluno(alunoData);
        
    } catch (error) {
        mostrarAlerta('Erro no Login', error.message, 'erro');
    }
});

// ===== PAINEL DO ALUNO - SISTEMA COMPLETO =====
async function mostrarPainelAluno(aluno) {
    mostrarPagina('painelAluno');
    
    // Atualizar cabeçalho
    document.getElementById('alunoNomePainel').textContent = aluno.nome + ' ' + aluno.apelido;
    document.getElementById('alunoNumeroPainel').textContent = 'Nº: ' + aluno.numeroAluno;
    
    // Preencher perfil
    document.getElementById('perfilNome').textContent = aluno.nome + ' ' + aluno.apelido;
    document.getElementById('perfilNumero').textContent = aluno.numeroAluno;
    document.getElementById('perfilClasse').textContent = aluno.classe + 'ª Classe';
    document.getElementById('perfilTurma').textContent = aluno.turma;
    document.getElementById('perfilCurso').textContent = aluno.curso;
    document.getElementById('perfilNascimento').textContent = formatarData(aluno.dataNascimento);
    document.getElementById('perfilTelefone').textContent = aluno.telefone;
    document.getElementById('perfilWhatsapp').textContent = aluno.whatsapp || '-';
    document.getElementById('perfilEmail').textContent = aluno.email;
    document.getElementById('perfilProvincia').textContent = aluno.provincia;
    document.getElementById('perfilDistrito').textContent = aluno.distrito;
    document.getElementById('perfilEncarregado').textContent = aluno.nomeEncarregado;
    
    // Configurar abas
    configurarAbasAluno(aluno);
    
    // Carregar dados iniciais
    await carregarNotasAluno(aluno.numeroAluno);
    await carregarExtratoAluno(aluno.numeroAluno);
    await carregarHistoricoAluno(aluno.numeroAluno);
    await carregarCalendarioAluno();
    await carregarDividasAluno(aluno.numeroAluno);
    
    // Iniciar observadores em tempo real
    iniciarObservadoresAluno(aluno.numeroAluno);
}

// ===== SISTEMA DE OBSERVAÇÃO EM TEMPO REAL =====
function iniciarObservadoresAluno(numeroAluno) {
    pararObservadores();
    
    // Observar notas
    const notasObserver = db.collection('notas')
        .where('numeroAluno', '==', numeroAluno)
        .onSnapshot(async (snapshot) => {
            console.log('📝 Notas atualizadas em tempo real');
            if (alunoLogado && document.getElementById('abaNotas').classList.contains('active')) {
                await carregarNotasAluno(numeroAluno);
                mostrarNotificacao('🔄', 'Notas atualizadas!', 'info');
            }
        });
    
    // Observar pagamentos (extrato)
    const pagamentosObserver = db.collection('pagamentos')
        .where('numeroAluno', '==', numeroAluno)
        .onSnapshot(async (snapshot) => {
            console.log('💰 Pagamentos atualizados em tempo real');
            if (alunoLogado && document.getElementById('abaExtrato').classList.contains('active')) {
                await carregarExtratoAluno(numeroAluno);
            }
        });
    
    // Observar calendário (para todos os alunos)
    const calendarioObserver = db.collection('calendario')
        .onSnapshot(async (snapshot) => {
            console.log('📅 Calendário atualizado em tempo real');
            if (alunoLogado && document.getElementById('abaCalendario').classList.contains('active')) {
                await carregarCalendarioAluno();
                mostrarNotificacao('📅', 'Calendário atualizado!', 'info');
            }
        });
    
    // Observar dívidas
    const alunoObserver = db.collection('alunos')
        .doc(numeroAluno)
        .onSnapshot(async (doc) => {
            if (doc.exists) {
                const alunoAtualizado = doc.data();
                alunoLogado = { ...alunoLogado, ...alunoAtualizado };
                
                // Atualizar interface
                document.getElementById('mediaFinalAluno').textContent = alunoAtualizado.mediaFinal || '-';
                document.getElementById('statusAcademicoAluno').textContent = alunoAtualizado.statusAcademico || 'Regular';
                
                // Atualizar dívidas se necessário
                if (alunoAtualizado.divida !== alunoLogado.divida) {
                    await carregarDividasAluno(numeroAluno);
                }
            }
        });
    
    observers.push(notasObserver, pagamentosObserver, calendarioObserver, alunoObserver);
}

function pararObservadores() {
    observers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') unsubscribe();
    });
    observers = [];
}

function mostrarNotificacao(emoji, mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao-temporaria';
    notificacao.innerHTML = `${emoji} ${mensagem}`;
    
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'sucesso' ? '#4caf50' : tipo === 'erro' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// ===== ABA NOTAS - COMPLETA =====
async function carregarNotasAluno(numeroAluno) {
    try {
        // Buscar aluno para ver disciplinas
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        if (!aluno || !aluno.disciplinas) {
            document.querySelector('#tabelaNotas tbody').innerHTML = 
                '<tr><td colspan="7">Nenhuma disciplina registrada</td></tr>';
            return;
        }
        
        // Buscar notas
        const notasSnap = await db.collection('notas')
            .where('numeroAluno', '==', numeroAluno)
            .get();
        
        const tbody = document.querySelector('#tabelaNotas tbody');
        tbody.innerHTML = '';
        
        // Estrutura para organizar notas
        const notasOrganizadas = {};
        aluno.disciplinas.forEach(disciplina => {
            notasOrganizadas[disciplina] = {
                1: { teste1: '-', teste2: '-', trabalho: '-', final: '-' },
                2: { teste1: '-', teste2: '-', trabalho: '-', final: '-' },
                3: { teste1: '-', teste2: '-', trabalho: '-', final: '-' }
            };
        });
        
        // Preencher com notas existentes
        notasSnap.forEach(doc => {
            const nota = doc.data();
            const disciplina = nota.disciplina;
            const trimestre = nota.trimestre;
            const tipo = nota.tipo;
            
            if (notasOrganizadas[disciplina] && notasOrganizadas[disciplina][trimestre]) {
                if (['teste1', 'teste2', 'trabalho', 'final'].includes(tipo)) {
                    notasOrganizadas[disciplina][trimestre][tipo] = nota.nota.toFixed(1);
                }
            }
        });
        
        // Calcular médias e preencher tabela
        let somaTotal = 0;
        let contador = 0;
        
        Object.entries(notasOrganizadas).forEach(([disciplina, trimestres]) => {
            Object.entries(trimestres).forEach(([trimestreNum, notas]) => {
                const notasArray = Object.values(notas)
                    .filter(v => v !== '-')
                    .map(v => parseFloat(v));
                
                let media = '-';
                if (notasArray.length > 0) {
                    const soma = notasArray.reduce((a, b) => a + b, 0);
                    media = (soma / notasArray.length).toFixed(1);
                    
                    if (media !== '-') {
                        somaTotal += parseFloat(media);
                        contador++;
                    }
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${disciplina}</td>
                    <td>${trimestreNum}º Trim</td>
                    <td class="nota ${notas.teste1 === '-' ? 'ausente' : 'presente'}">${notas.teste1}</td>
                    <td class="nota ${notas.teste2 === '-' ? 'ausente' : 'presente'}">${notas.teste2}</td>
                    <td class="nota ${notas.trabalho === '-' ? 'ausente' : 'presente'}">${notas.trabalho}</td>
                    <td class="nota ${notas.final === '-' ? 'ausente' : 'presente'}">${notas.final}</td>
                    <td class="media-trimestre ${media >= 10 ? 'aprovado' : media !== '-' ? 'reprovado' : ''}">
                        <strong>${media}</strong>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
        
        // Calcular média final
        const mediaFinal = contador > 0 ? (somaTotal / contador).toFixed(1) : '-';
        document.getElementById('mediaFinalAluno').textContent = mediaFinal;
        
        // Atualizar status
        const statusElement = document.getElementById('statusAcademicoAluno');
        if (mediaFinal !== '-') {
            let status = 'Reprovado';
            let cor = 'red';
            
            if (parseFloat(mediaFinal) >= 10) {
                status = 'Aprovado';
                cor = 'green';
            } else if (parseFloat(mediaFinal) >= 8) {
                status = 'Recuperação';
                cor = 'orange';
            }
            
            statusElement.textContent = status;
            statusElement.style.color = cor;
            
            // Atualizar no banco
            await db.collection('alunos').doc(numeroAluno).update({
                statusAcademico: status,
                mediaFinal: parseFloat(mediaFinal)
            });
        }
        
        // Verificar se deve bloquear notas por dívida
        if (aluno.divida > 0) {
            document.getElementById('avisoDivida').style.display = 'block';
            document.getElementById('containerNotas').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
    }
}

// ===== ABA EXTRATO - COMPLETA =====
async function carregarExtratoAluno(numeroAluno) {
    try {
        const extratoSnap = await db.collection('pagamentos')
            .where('numeroAluno', '==', numeroAluno)
            .orderBy('data', 'desc')
            .get();
        
        const lista = document.getElementById('listaExtrato');
        lista.innerHTML = '';
        
        if (extratoSnap.empty) {
            lista.innerHTML = `
                <li class="sem-dados">
                    <div class="sem-dados-icon"
