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
                    <div class="sem-dados-icon">💸</div>
                    <p>Nenhum pagamento registrado</p>
                </li>
            `;
            return;
        }
        
        let totalPago = 0;
        extratoSnap.forEach(doc => {
            const pagamento = doc.data();
            totalPago += pagamento.valor;
            
            const li = document.createElement('li');
            li.className = 'extrato-item';
            li.innerHTML = `
                <div class="extrato-data">${formatarData(pagamento.data)}</div>
                <div class="extrato-descricao">
                    <strong>${pagamento.descricao || 'Pagamento'}</strong>
                    <span class="extrato-mes">${pagamento.mes || ''}</span>
                </div>
                <div class="extrato-valor">${pagamento.valor.toFixed(2)} MZN</div>
                <div class="extrato-status pago">PAGO</div>
            `;
            lista.appendChild(li);
        });
        
        // Adicionar resumo
        const resumo = document.createElement('div');
        resumo.className = 'extrato-resumo';
        resumo.innerHTML = `
            <h4>Resumo Financeiro</h4>
            <p>Total Pago: <strong>${totalPago.toFixed(2)} MZN</strong></p>
            <p>Nº de Pagamentos: <strong>${extratoSnap.size}</strong></p>
        `;
        lista.parentNode.insertBefore(resumo, lista);
        
    } catch (error) {
        console.error('Erro ao carregar extrato:', error);
    }
}

// ===== ABA HISTÓRICO - COMPLETA =====
async function carregarHistoricoAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        const lista = document.getElementById('listaHistorico');
        lista.innerHTML = '';
        
        // Dados do histórico
        const historico = [
            {
                ano: new Date().getFullYear() - 1,
                classe: `${parseInt(aluno.classe) - 1}ª Classe`,
                escola: 'Escola Anterior',
                status: 'Concluído',
                media: '14.5'
            },
            {
                ano: new Date().getFullYear(),
                classe: `${aluno.classe}ª Classe`,
                escola: 'ZÊNITE Escola',
                status: aluno.statusAcademico || 'Em curso',
                media: aluno.mediaFinal || 'Em curso'
            }
        ];
        
        historico.forEach(item => {
            const li = document.createElement('li');
            li.className = 'historico-item';
            li.innerHTML = `
                <div class="historico-ano">${item.ano}</div>
                <div class="historico-info">
                    <h4>${item.classe} - ${item.escola}</h4>
                    <div class="historico-detalhes">
                        <span class="status ${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span>
                        <span class="media">Média: ${item.media}</span>
                    </div>
                </div>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// ===== ABA CALENDÁRIO - COMPLETA =====
async function carregarCalendarioAluno() {
    try {
        const calendarioSnap = await db.collection('calendario')
            .orderBy('data')
            .get();
        
        const lista = document.getElementById('listaCalendario');
        lista.innerHTML = '';
        
        if (calendarioSnap.empty) {
            lista.innerHTML = `
                <li class="sem-dados">
                    <div class="sem-dados-icon">📅</div>
                    <p>Nenhum evento no calendário</p>
                    <p class="info-text">A administração irá adicionar eventos em breve.</p>
                </li>
            `;
            return;
        }
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        calendarioSnap.forEach(doc => {
            const evento = doc.data();
            const dataEvento = evento.data.toDate ? evento.data.toDate() : new Date(evento.data);
            
            const li = document.createElement('li');
            li.className = 'calendario-item';
            
            const diffDias = Math.floor((dataEvento - hoje) / (1000 * 60 * 60 * 24));
            
            let indicador = '';
            if (diffDias === 0) indicador = '<span class="hoje">HOJE</span>';
            else if (diffDias === 1) indicador = '<span class="amanha">AMANHÃ</span>';
            else if (diffDias > 0 && diffDias <= 7) indicador = `<span class="proximo">EM ${diffDias} DIAS</span>`;
            
            li.innerHTML = `
                <div class="calendario-data">
                    <strong>${formatarDataCompleta(dataEvento)}</strong>
                    ${indicador}
                </div>
                <div class="calendario-descricao">
                    <span class="tipo-evento">${evento.tipo || 'Geral'}</span>
                    <p>${evento.evento}</p>
                </div>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar calendário:', error);
    }
            }

// ===== ABA DÍVIDAS - COMPLETA =====
async function carregarDividasAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        // Atualizar total
        const totalDivida = document.getElementById('totalDivida');
        totalDivida.textContent = `${aluno.divida || 0} MZN`;
        
        if (aluno.divida > 0) {
            totalDivida.className = 'valor-divida negativo';
            document.getElementById('statusDivida').textContent = 'EM DÍVIDA';
            document.getElementById('statusDivida').className = 'status-divida negativa';
            
            // Buscar detalhes das dívidas
            const dividasSnap = await db.collection('dividas')
                .where('numeroAluno', '==', numeroAluno)
                .orderBy('data', 'desc')
                .get();
            
            const lista = document.getElementById('listaDividas');
            lista.innerHTML = '';
            
            dividasSnap.forEach(doc => {
                const divida = doc.data();
                const li = document.createElement('li');
                li.className = 'divida-item';
                li.innerHTML = `
                    <div class="divida-data">${formatarData(divida.data)}</div>
                    <div class="divida-descricao">${divida.descricao}</div>
                    <div class="divida-valor">${divida.valor} MZN</div>
                `;
                lista.appendChild(li);
            });
        } else {
            totalDivida.className = 'valor-divida positivo';
            document.getElementById('statusDivida').textContent = 'REGULAR';
            document.getElementById('statusDivida').className = 'status-divida positiva';
            
            document.getElementById('listaDividas').innerHTML = `
                <li class="sem-dados">
                    <div class="sem-dados-icon">✅</div>
                    <p>Nenhuma dívida registrada</p>
                </li>
            `;
        }
        
    } catch (error) {
        console.error('Erro ao carregar dívidas:', error);
    }
}

// ===== CONFIGURAÇÃO DAS ABAS =====
function configurarAbasAluno(aluno) {
    const botoesAbas = document.querySelectorAll('.aba-btn[data-aba]');
    
    botoesAbas.forEach(botao => {
        botao.addEventListener('click', async function() {
            // Atualizar botões ativos
            botoesAbas.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Atualizar abas visíveis
            document.querySelectorAll('.aba').forEach(aba => {
                aba.classList.remove('active');
            });
            
            const abaAlvo = this.dataset.aba;
            const abaElemento = document.getElementById('aba' + abaAlvo.charAt(0).toUpperCase() + abaAlvo.slice(1));
            
            if (abaElemento) {
                abaElemento.classList.add('active');
                
                // Verificar dívida para aba de notas
                if (abaAlvo === 'notas' && aluno.divida > 0) {
                    document.getElementById('avisoDivida').style.display = 'block';
                    document.getElementById('containerNotas').style.display = 'none';
                } else if (abaAlvo === 'notas') {
                    document.getElementById('avisoDivida').style.display = 'none';
                    document.getElementById('containerNotas').style.display = 'block';
                }
                
                // Recarregar dados da aba ativa
                switch(abaAlvo) {
                    case 'notas':
                        await carregarNotasAluno(aluno.numeroAluno);
                        break;
                    case 'extrato':
                        await carregarExtratoAluno(aluno.numeroAluno);
                        break;
                    case 'historico':
                        await carregarHistoricoAluno(aluno.numeroAluno);
                        break;
                    case 'calendario':
                        await carregarCalendarioAluno();
                        break;
                    case 'dividas':
                        await carregarDividasAluno(aluno.numeroAluno);
                        break;
                }
            }
        });
    });
    
    // Ativar primeira aba
    botoesAbas[0].click();
}

// ===== PAINEL DO ADMINISTRADOR =====
async function carregarPainelAdmin() {
    try {
        await carregarAlunosAdmin();
        await carregarCalendarioAdmin();
        configurarFormulariosAdmin();
        await mostrarNotasRecentes();
        
    } catch (error) {
        console.error('Erro ao carregar painel admin:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar o painel administrativo', 'erro');
    }
}

async function carregarAlunosAdmin() {
    try {
        const alunosSnap = await db.collection('alunos').orderBy('nome').get();
        const tbody = document.querySelector('#tabelaAlunos tbody');
        tbody.innerHTML = '';
        
        // Limpar selects
        ['notaAluno', 'dividaAluno', 'pagamentoAluno'].forEach(id => {
            const select = document.getElementById(id);
            select.innerHTML = '<option value="">Selecione o aluno</option>';
        });
        
        alunosSnap.forEach(doc => {
            const aluno = doc.data();
            const numeroAluno = aluno.numeroAluno;
            
            // Adicionar à tabela
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aluno.nome} ${aluno.apelido}</td>
                <td>${numeroAluno}</td>
                <td>${aluno.classe}ª</td>
                <td>${aluno.turma}</td>
                <td><span class="status ${aluno.ativo ? 'ativo' : 'inativo'}">${aluno.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td>${aluno.divida || 0} MZN</td>
                <td>
                    <div class="acoes-admin">
                        <button onclick="verFormularioAluno('${numeroAluno}')" class="btn-acao ver">📄 Ver Formulário</button>
                        <button onclick="editarPlanoPagamento('${numeroAluno}', '${aluno.planoPagamento || 'normal'}')" class="btn-acao plano">💰 Plano</button>
                        <button onclick="editarAluno('${numeroAluno}')" class="btn-acao editar">✏️ Editar</button>
                        <button onclick="suspenderAluno('${numeroAluno}', ${aluno.ativo})" class="btn-acao ${aluno.ativo ? 'suspender' : 'ativar'}">
                            ${aluno.ativo ? '⏸️ Suspender' : '▶️ Ativar'}
                        </button>
                        <button onclick="excluirAluno('${numeroAluno}')" class="btn-acao excluir">🗑️ Excluir</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
            
            // Adicionar aos selects
            ['notaAluno', 'dividaAluno', 'pagamentoAluno'].forEach(id => {
                const select = document.getElementById(id);
                const option = document.createElement('option');
                option.value = numeroAluno;
                option.textContent = `${aluno.nome} - ${numeroAluno}`;
                select.appendChild(option);
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
    }
            }

function configurarFormulariosAdmin() {
    // FORMULÁRIO DE NOTAS
    document.getElementById('formNota').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const alunoNumero = document.getElementById('notaAluno').value;
        const disciplina = document.getElementById('notaDisciplina').value;
        const trimestre = parseInt(document.getElementById('notaTrimestre').value);
        const tipo = document.getElementById('notaTipo').value;
        const valor = parseFloat(document.getElementById('notaValor').value);
        
        if (!alunoNumero || !disciplina || valor < 0 || valor > 20) {
            mostrarAlerta('Erro', 'Preencha todos os campos corretamente!', 'erro');
            return;
        }
        
        try {
            // Verificar aluno e disciplina
            const alunoDoc = await db.collection('alunos').doc(alunoNumero).get();
            if (!alunoDoc.exists) {
                mostrarAlerta('Erro', 'Aluno não encontrado!', 'erro');
                return;
            }
            
            const aluno = alunoDoc.data();
            if (!aluno.disciplinas.includes(disciplina)) {
                mostrarAlerta('Erro', 'Esta disciplina não pertence ao aluno!', 'erro');
                return;
            }
            
            // Criar/Atualizar nota
            const notaId = `${alunoNumero}_${disciplina}_${trimestre}_${tipo}`;
            const notaData = {
                numeroAluno: alunoNumero,
                disciplina: disciplina,
                trimestre: trimestre,
                tipo: tipo,
                nota: valor,
                alunoNome: aluno.nome + ' ' + aluno.apelido,
                alunoClasse: aluno.classe,
                alunoTurma: aluno.turma,
                atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('notas').doc(notaId).set(notaData);
            
            // Atualizar média do aluno
            await atualizarMediaAluno(alunoNumero);
            
            mostrarAlerta('✅ Nota Lançada!', 
                `Nota registrada para ${aluno.nome}\n` +
                `Disciplina: ${disciplina}\n` +
                `Nota: ${valor}\n\n` +
                `A nota já está disponível no painel do aluno!`,
                'sucesso'
            );
            
            this.reset();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível lançar a nota', 'erro');
        }
    });
    
    // Atualizar disciplinas quando selecionar aluno
    document.getElementById('notaAluno').addEventListener('change', async function() {
        const numeroAluno = this.value;
        const selectDisciplina = document.getElementById('notaDisciplina');
        
        selectDisciplina.innerHTML = '<option value="">Selecione a disciplina</option>';
        
        if (!numeroAluno) return;
        
        try {
            const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
            const aluno = alunoDoc.data();
            
            if (aluno && aluno.disciplinas) {
                aluno.disciplinas.forEach(disciplina => {
                    const option = document.createElement('option');
                    option.value = disciplina;
                    option.textContent = disciplina;
                    selectDisciplina.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Erro ao carregar disciplinas:', error);
        }
    });
    
    // FORMULÁRIO DE DÍVIDAS
    document.getElementById('formDivida').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const alunoNumero = document.getElementById('dividaAluno').value;
        const valor = parseFloat(document.getElementById('dividaValor').value);
        const descricao = document.getElementById('dividaDescricao').value;
        
        if (!alunoNumero || !valor || !descricao) {
            mostrarAlerta('Erro', 'Preencha todos os campos!', 'erro');
            return;
        }
        
        try {
            // Atualizar dívida do aluno
            const alunoDoc = await db.collection('alunos').doc(alunoNumero).get();
            const dividaAtual = alunoDoc.data().divida || 0;
            const novaDivida = dividaAtual + valor;
            
            await db.collection('alunos').doc(alunoNumero).update({
                divida: novaDivida
            });
            
            // Registrar no histórico de dívidas
            await db.collection('dividas').add({
                numeroAluno: alunoNumero,
                valor: valor,
                descricao: descricao,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarAlerta('✅ Dívida Registrada!', 
                `Dívida de ${valor} MZN registrada para o aluno.\n` +
                `Total atual: ${novaDivida} MZN`,
                'sucesso'
            );
            
            this.reset();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível registrar a dívida', 'erro');
        }
    });

    // FORMULÁRIO DE PAGAMENTOS
    document.getElementById('formPagamento').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const alunoNumero = document.getElementById('pagamentoAluno').value;
        const valor = parseFloat(document.getElementById('pagamentoValor').value);
        const mes = document.getElementById('pagamentoMes').value;
        
        if (!alunoNumero || !valor || !mes) {
            mostrarAlerta('Erro', 'Preencha todos os campos!', 'erro');
            return;
        }
        
        try {
            // Registrar pagamento
            await db.collection('pagamentos').add({
                numeroAluno: alunoNumero,
                valor: valor,
                mes: mes,
                descricao: `Pagamento - ${mes}`,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Reduzir dívida
            const alunoDoc = await db.collection('alunos').doc(alunoNumero).get();
            const dividaAtual = alunoDoc.data().divida || 0;
            const novaDivida = Math.max(0, dividaAtual - valor);
            
            await db.collection('alunos').doc(alunoNumero).update({
                divida: novaDivida
            });
            
            mostrarAlerta('✅ Pagamento Registrado!', 
                `Pagamento de ${valor} MZN registrado.\n` +
                `Dívida restante: ${novaDivida} MZN`,
                'sucesso'
            );
            
            this.reset();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível registrar o pagamento', 'erro');
        }
    });
    
    // FORMULÁRIO DE CALENDÁRIO
    document.getElementById('formEvento').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = document.getElementById('eventoData').value;
        const descricao = document.getElementById('eventoDesc').value;
        
        if (!data || !descricao) {
            mostrarAlerta('Erro', 'Preencha todos os campos!', 'erro');
            return;
        }
        
        try {
            await db.collection('calendario').add({
                data: data,
                evento: descricao,
                tipo: 'Acadêmico',
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarAlerta('✅ Evento Adicionado!', 
                `Evento "${descricao}" adicionado ao calendário.\n` +
                `Data: ${formatarDataCompleta(new Date(data))}\n\n` +
                `O evento já está visível para todos os alunos!`,
                'sucesso'
            );
            
            this.reset();
            await carregarCalendarioAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível adicionar o evento', 'erro');
        }
    });
}

async function atualizarMediaAluno(numeroAluno) {
    try {
        const notasSnap = await db.collection('notas')
            .where('numeroAluno', '==', numeroAluno)
            .get();
        
        if (notasSnap.empty) return;
        
        let somaNotas = 0;
        let contadorNotas = 0;
        
        notasSnap.forEach(doc => {
            const nota = doc.data().nota;
            if (!isNaN(nota)) {
                somaNotas += nota;
                contadorNotas++;
            }
        });
        
        const media = contadorNotas > 0 ? (somaNotas / contadorNotas).toFixed(1) : 0;
        
        let status = 'Reprovado';
        if (media >= 10) status = 'Aprovado';
        else if (media >= 8) status = 'Recuperação';
        
        await db.collection('alunos').doc(numeroAluno).update({
            mediaFinal: parseFloat(media),
            statusAcademico: status
        });
        
    } catch (error) {
        console.error('Erro ao atualizar média:', error);
    }
}

async function carregarCalendarioAdmin() {
    try {
        const calendarioSnap = await db.collection('calendario')
            .orderBy('data')
            .get();
        
        const lista = document.getElementById('adminCalendario');
        lista.innerHTML = '';
        
        calendarioSnap.forEach(doc => {
            const evento = doc.data();
            const li = document.createElement('li');
            li.className = 'evento-admin';
            li.innerHTML = `
                <div>
                    <strong>${formatarData(evento.data)}</strong>
                    <span>${evento.evento}</span>
                </div>
                <button onclick="removerEvento('${doc.id}')" class="btn-remover">Remover</button>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar calendário admin:', error);
    }
}

async function removerEvento(idEvento) {
    if (!confirm('Remover este evento do calendário?')) return;
    
    try {
        await db.collection('calendario').doc(idEvento).delete();
        await carregarCalendarioAdmin();
        mostrarAlerta('Evento Removido', 'O evento foi removido do calendário.', 'sucesso');
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível remover o evento', 'erro');
    }
}

async function mostrarNotasRecentes() {
    try {
        const notasSnap = await db.collection('notas')
            .orderBy('atualizadoEm', 'desc')
            .limit(5)
            .get();
        
        const container = document.createElement('div');
        container.className = 'notas-recentes';
        container.innerHTML = '<h3>📝 Últimas Notas Lançadas</h3>';
        
        if (notasSnap.empty) {
            container.innerHTML += '<p>Nenhuma nota lançada ainda.</p>';
        } else {
            const lista = document.createElement('div');
            notasSnap.forEach(doc => {
                const nota = doc.data();
                const item = document.createElement('div');
                item.className = 'nota-recente';
                item.innerHTML = `
                    <strong>${nota.alunoNome}</strong>
                    <span>${nota.disciplina}: ${nota.nota}</span>
                    <small>${formatarData(nota.atualizadoEm)}</small>
                `;
                lista.appendChild(item);
            });
            container.appendChild(lista);
        }
        
        // Adicionar ao painel
        const adminFunc = document.querySelector('.admin-funcionalidades');
        if (adminFunc) {
            adminFunc.insertBefore(container, adminFunc.firstChild);
        }
        
    } catch (error) {
        console.error('Erro ao mostrar notas recentes:', error);
    }
}

async function editarAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        const novoNome = prompt('Novo nome:', aluno.nome);
        const novoEmail = prompt('Novo email:', aluno.email);
        const novoTelefone = prompt('Novo telefone:', aluno.telefone);
        
        if (novoNome && novoEmail && novoTelefone) {
            await db.collection('alunos').doc(numeroAluno).update({
                nome: novoNome,
                email: novoEmail,
                telefone: novoTelefone
            });
            
            mostrarAlerta('Aluno Atualizado', 'Os dados do aluno foram atualizados.', 'sucesso');
            carregarAlunosAdmin();
        }
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível editar o aluno', 'erro');
    }
}

async function suspenderAluno(numeroAluno, ativo) {
    try {
        await db.collection('alunos').doc(numeroAluno).update({
            ativo: !ativo
        });
        
        const acao = ativo ? 'suspenso' : 'ativado';
        mostrarAlerta('Status Alterado', `Aluno ${acao} com sucesso!`, 'sucesso');
        carregarAlunosAdmin();
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível alterar o status', 'erro');
    }
}

// ===== NOVAS FUNÇÕES PARA OS BOTÕES DO ADMIN =====

// 1. VER FORMULÁRIO DO ALUNO
async function verFormularioAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        if (!alunoDoc.exists) {
            mostrarAlerta('Erro', 'Aluno não encontrado!', 'erro');
            return;
        }
        
        const aluno = alunoDoc.data();
        
        // Criar conteúdo detalhado do formulário
        let conteudo = `
            <div class="formulario-detalhado">
                <h3>📋 FORMULÁRIO COMPLETO DO ALUNO</h3>
                <div class="info-grid">
                    
                    <div class="info-section">
                        <h4>👤 DADOS PESSOAIS</h4>
                        <p><strong>Nome Completo:</strong> ${aluno.nome} ${aluno.apelido}</p>
                        <p><strong>Número do Aluno:</strong> ${numeroAluno}</p>
                        <p><strong>BI/Passaporte:</strong> ${aluno.bi || 'Não informado'}</p>
                        <p><strong>Data de Nascimento:</strong> ${formatarData(aluno.dataNascimento)}</p>
                        <p><strong>Email:</strong> ${aluno.email}</p>
                        <p><strong>Telefone:</strong> ${aluno.telefone}</p>
                        <p><strong>WhatsApp:</strong> ${aluno.whatsapp || 'Não informado'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>🏠 DADOS RESIDENCIAIS</h4>
                        <p><strong>Província:</strong> ${aluno.provincia}</p>
                        <p><strong>Distrito:</strong> ${aluno.distrito}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>👨‍👩‍👧‍👦 DADOS FAMILIARES</h4>
                        <p><strong>Nome do Pai:</strong> ${aluno.nomePai || 'Não informado'}</p>
                        <p><strong>Nome da Mãe:</strong> ${aluno.nomeMae || 'Não informado'}</p>
                        <p><strong>Encarregado:</strong> ${aluno.nomeEncarregado}</p>
                        <p><strong>Telefone do Encarregado:</strong> ${aluno.telefoneEncarregado}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>🎓 DADOS ACADÊMICOS</h4>
                        <p><strong>Classe:</strong> ${aluno.classe}ª</p>
                        <p><strong>Curso:</strong> ${aluno.curso || 'Geral'}</p>
                        <p><strong>Turma:</strong> ${aluno.turma}</p>
                        <p><strong>Status Acadêmico:</strong> ${aluno.statusAcademico || 'Regular'}</p>
                        <p><strong>Média Final:</strong> ${aluno.mediaFinal || 'Não calculada'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>📚 DISCIPLINAS INSCRITAS</h4>
                        <ul class="disciplinas-lista">
                            ${aluno.disciplinas ? aluno.disciplinas.map(d => `<li>${d}</li>`).join('') : '<li>Nenhuma disciplina</li>'}
                        </ul>
                    </div>
                    
                    <div class="info-section">
                        <h4>💰 DADOS FINANCEIROS</h4>
                        <p><strong>Plano de Pagamento:</strong> ${aluno.planoPagamento || 'Normal'}</p>
                        <p><strong>Dívida Atual:</strong> ${aluno.divida || 0} MZN</p>
                        <p><strong>Status da Conta:</strong> ${aluno.ativo ? 'Ativa' : 'Suspensa'}</p>
                        <p><strong>Data de Inscrição:</strong> ${formatarData(aluno.criadoEm)}</p>
                    </div>
                    
                </div>
                
                <div class="botoes-acao">
                    <button onclick="imprimirFormulario('${numeroAluno}')" class="btn-imprimir">🖨️ Imprimir Formulário</button>
                    <button onclick="fecharAlerta()" class="btn-fechar">Fechar</button>
                </div>
            </div>
        `;
        
        // Abrir modal com o formulário
        document.getElementById('alertTitle').textContent = `Formulário do Aluno: ${aluno.nome}`;
        document.getElementById('alertMessage').innerHTML = conteudo;
        document.getElementById('alertModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar o formulário do aluno', 'erro');
    }
}

// 2. FUNÇÃO PARA IMPRIMIR FORMULÁRIO
function imprimirFormulario(numeroAluno) {
    const conteudo = document.querySelector('.formulario-detalhado').innerHTML;
    
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Formulário do Aluno - ${numeroAluno}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h3 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
                .info-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                .info-section h4 { color: #555; margin-top: 0; }
                .disciplinas-lista { columns: 2; }
                strong { color: #333; }
                @media print {
                    .no-print { display: none; }
                    body { font-size: 12px; }
                }
            </style>
        </head>
        <body>
            ${conteudo}
            <div class="no-print">
                <button onclick="window.print()">🖨️ Imprimir</button>
                <button onclick="window.close()">❌ Fechar</button>
            </div>
        </body>
        </html>
    `);
    janelaImpressao.document.close();
        }

// 3. EDITAR PLANO DE PAGAMENTO
async function editarPlanoPagamento(numeroAluno, planoAtual) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        if (!alunoDoc.exists) {
            mostrarAlerta('Erro', 'Aluno não encontrado!', 'erro');
            return;
        }
        
        const aluno = alunoDoc.data();
        
        // Criar modal para selecionar plano
        const conteudo = `
            <div class="modal-plano-pagamento">
                <h4>💰 EDITAR PLANO DE PAGAMENTO</h4>
                <p><strong>Aluno:</strong> ${aluno.nome} ${aluno.apelido}</p>
                <p><strong>Plano Atual:</strong> ${planoAtual.toUpperCase()}</p>
                
                <div class="planos-opcoes">
                    <label class="plano-opcao ${planoAtual === 'normal' ? 'selecionado' : ''}">
                        <input type="radio" name="plano" value="normal" ${planoAtual === 'normal' ? 'checked' : ''}>
                        <div class="plano-card">
                            <h5>NORMAL</h5>
                            <p>Pagamento mensal padrão</p>
                            <p><strong>Valor:</strong> 5.000 MZN/mês</p>
                            <small>Prazo: Até dia 10 de cada mês</small>
                        </div>
                    </label>
                    
                    <label class="plano-opcao ${planoAtual === 'vip' ? 'selecionado' : ''}">
                        <input type="radio" name="plano" value="vip" ${planoAtual === 'vip' ? 'checked' : ''}>
                        <div class="plano-card vip">
                            <h5>VIP</h5>
                            <p>Pagamento trimestral com desconto</p>
                            <p><strong>Valor:</strong> 13.500 MZN/trimestre</p>
                            <small>Economia: 1.500 MZN/trimestre</small>
                        </div>
                    </label>
                    
                    <label class="plano-opcao ${planoAtual === 'premium' ? 'selecionado' : ''}">
                        <input type="radio" name="plano" value="premium" ${planoAtual === 'premium' ? 'checked' : ''}>
                        <div class="plano-card premium">
                            <h5>PREMIUM</h5>
                            <p>Pagamento anual com máximo desconto</p>
                            <p><strong>Valor:</strong> 50.000 MZN/ano</p>
                            <small>Economia: 10.000 MZN/ano</small>
                        </div>
                    </label>
                </div>
                
                <div class="acoes-plano">
                    <button onclick="confirmarPlanoPagamento('${numeroAluno}')" class="btn-confirmar">✅ Confirmar Plano</button>
                    <button onclick="fecharAlerta()" class="btn-cancelar">❌ Cancelar</button>
                </div>
            </div>
        `;
        
        document.getElementById('alertTitle').textContent = 'Editar Plano de Pagamento';
        document.getElementById('alertMessage').innerHTML = conteudo;
        document.getElementById('alertModal').style.display = 'flex';
        
        // Adicionar estilos para os planos
        const style = document.createElement('style');
        style.textContent = `
            .modal-plano-pagamento { max-width: 600px; }
            .planos-opcoes { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0; }
            .plano-opcao input { display: none; }
            .plano-card { padding: 15px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
            .plano-card:hover { border-color: #1976d2; background: #f0f8ff; }
            .plano-card.selecionado { border-color: #4caf50; background: #e8f5e9; }
            .plano-card.vip { border-color: #ff9800; }
            .plano-card.premium { border-color: #9c27b0; }
            .plano-card h5 { margin: 0 0 10px 0; color: #1976d2; }
            .plano-card.vip h5 { color: #ff9800; }
            .plano-card.premium h5 { color: #9c27b0; }
            .plano-card p { margin: 5px 0; font-size: 0.9rem; }
            .plano-card small { display: block; color: #666; font-size: 0.8rem; margin-top: 10px; }
            .acoes-plano { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
            .btn-confirmar { background: #4caf50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            .btn-cancelar { background: #f44336; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        `;
        document.head.appendChild(style);
        
    } catch (error) {
        console.error('Erro ao carregar plano de pagamento:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar os dados do plano', 'erro');
    }
}

// 4. CONFIRMAR PLANO DE PAGAMENTO
async function confirmarPlanoPagamento(numeroAluno) {
    try {
        const planoSelecionado = document.querySelector('input[name="plano"]:checked');
        
        if (!planoSelecionado) {
            mostrarAlerta('Atenção', 'Selecione um plano de pagamento!', 'erro');
            return;
        }
        
        const novoPlano = planoSelecionado.value;
        
        // Atualizar plano no banco de dados
        await db.collection('alunos').doc(numeroAluno).update({
            planoPagamento: novoPlano,
            planoAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Ajustar dívida baseada no plano (opcional)
        let ajusteDivida = 0;
        switch(novoPlano) {
            case 'normal':
                ajusteDivida = 5000; // Mensalidade normal
                break;
            case 'vip':
                ajusteDivida = 13500; // Trimestral VIP
                break;
            case 'premium':
                ajusteDivida = 50000; // Anual Premium
                break;
        }
        
        // Atualizar dívida (opcional - você pode remover esta parte se quiser)
        await db.collection('alunos').doc(numeroAluno).update({
            divida: firebase.firestore.FieldValue.increment(ajusteDivida)
        });
        
        mostrarAlerta('✅ Plano Atualizado!', 
            `Plano alterado para: ${novoPlano.toUpperCase()}\n` +
            `Aluno: ${numeroAluno}\n` +
            `Nova mensalidade: ${ajusteDivida} MZN\n\n` +
            `O plano foi atualizado com sucesso!`,
            'sucesso'
        );
        
        // Fechar modal e atualizar tabela
        fecharAlerta();
        carregarAlunosAdmin();
        
    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        mostrarAlerta('Erro', 'Não foi possível atualizar o plano de pagamento', 'erro');
    }
}

// 5. EXCLUIR ALUNO
async function excluirAluno(numeroAluno) {
    try {
        // Buscar dados do aluno para confirmação
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        if (!alunoDoc.exists) {
            mostrarAlerta('Erro', 'Aluno não encontrado!', 'erro');
            return;
        }
        
        // Pedir confirmação detalhada
        const confirmar = await mostrarConfirmacaoExclusao(aluno, numeroAluno);
        
        if (!confirmar) return;
        
        // Verificar se há dados relacionados
        const notasSnap = await db.collection('notas').where('numeroAluno', '==', numeroAluno).get();
        const pagamentosSnap = await db.collection('pagamentos').where('numeroAluno', '==', numeroAluno).get();
        const dividasSnap = await db.collection('dividas').where('numeroAluno', '==', numeroAluno).get();
        
        // Opção 1: Excluir completamente (aluno + dados relacionados)
        // Opção 2: Marcar como excluído (manter histórico)
        
        // Vou implementar a opção 2 (marcar como excluído)
        await db.collection('alunos').doc(numeroAluno).update({
            excluido: true,
            excluidoEm: firebase.firestore.FieldValue.serverTimestamp(),
            ativo: false,
            motivoExclusao: 'Excluído pelo administrador'
        });
        
        mostrarAlerta('✅ Aluno Excluído!', 
            `Aluno: ${aluno.nome} ${aluno.apelido}\n` +
            `Número: ${numeroAluno}\n` +
            `Status: Excluído do sistema\n` +
            `Notas relacionadas: ${notasSnap.size}\n` +
            `Pagamentos: ${pagamentosSnap.size}\n\n` +
            `O aluno foi marcado como excluído. Os dados foram mantidos para histórico.`,
            'sucesso'
        );
        
        // Atualizar tabela
        carregarAlunosAdmin();
        
    } catch (error) {
        console.error('Erro ao excluir aluno:', error);
        mostrarAlerta('Erro', 'Não foi possível excluir o aluno', 'erro');
    }
}

// 6. FUNÇÃO DE CONFIRMAÇÃO DE EXCLUSÃO
async function mostrarConfirmacaoExclusao(aluno, numeroAluno) {
    return new Promise((resolve) => {
        const conteudo = `
            <div class="confirmacao-exclusao">
                <h4>⚠️ CONFIRMAR EXCLUSÃO DO ALUNO</h4>
                <div class="alerta-perigo">
                    <p><strong>ATENÇÃO:</strong> Esta ação é irreversível!</p>
                </div>
                
                <div class="info-aluno-exclusao">
                    <p><strong>Aluno:</strong> ${aluno.nome} ${aluno.apelido}</p>
                    <p><strong>Número:</strong> ${numeroAluno}</p>
                    <p><strong>Classe:</strong> ${aluno.classe}ª - ${aluno.turma}</p>
                    <p><strong>Data de Inscrição:</strong> ${formatarData(aluno.criadoEm)}</p>
                    <p><strong>Status:</strong> ${aluno.ativo ? 'Ativo' : 'Inativo'}</p>
                    <p><strong>Dívida:</strong> ${aluno.divida || 0} MZN</p>
                </div>
                
                <div class="opcoes-exclusao">
                    <label>
                        <input type="radio" name="tipoExclusao" value="arquivar" checked>
                        <span>📁 Arquivar (Mantém dados para histórico)</span>
                    </label>
                    <label>
                        <input type="radio" name="tipoExclusao" value="completa">
                        <span>🗑️ Exclusão Completa (Remove todos os dados)</span>
                    </label>
                </div>
                
                <div class="motivo-exclusao">
                    <label>Motivo da Exclusão:</label>
                    <select id="motivoExclusaoSelect">
                        <option value="">Selecione um motivo</option>
                        <option value="transferencia">Transferência para outra escola</option>
                        <option value="desistencia">Desistência do aluno</option>
                        <option value="problemas_financeiros">Problemas financeiros</option>
                        <option value="outro">Outro motivo</option>
                    </select>
                    <textarea id="motivoExclusaoTexto" placeholder="Detalhe o motivo (opcional)" rows="3"></textarea>
                </div>
                
                <div class="botoes-confirmacao">
                    <button onclick="confirmarExclusaoFinal('${numeroAluno}')" class="btn-excluir-confirmar">✅ Confirmar Exclusão</button>
                    <button onclick="cancelarExclusao()" class="btn-excluir-cancelar">❌ Cancelar</button>
                </div>
            </div>
        `;
        
        document.getElementById('alertTitle').textContent = 'Confirmar Exclusão';
        document.getElementById('alertMessage').innerHTML = conteudo;
        document.getElementById('alertModal').style.display = 'flex';
        
        // Adicionar estilos
        const style = document.createElement('style');
        style.textContent = `
            .confirmacao-exclusao { max-width: 500px; }
            .alerta-perigo { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .alerta-perigo p { color: #856404; margin: 0; }
            .info-aluno-exclusao { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .info-aluno-exclusao p { margin: 5px 0; }
            .opcoes-exclusao label { display: block; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin: 5px 0; cursor: pointer; }
            .opcoes-exclusao label:hover { background: #f0f8ff; }
            .motivo-exclusao { margin: 15px 0; }
            .motivo-exclusao label { display: block; margin-bottom: 5px; font-weight: bold; }
            .motivo-exclusao select, .motivo-exclusao textarea { width: 100%; padding: 8px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px; }
            .botoes-confirmacao { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
            .btn-excluir-confirmar { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            .btn-excluir-cancelar { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        `;
        document.head.appendChild(style);
        
        // Funções globais para os botões
        window.confirmarExclusaoFinal = async function(numeroAluno) {
            const tipoExclusao = document.querySelector('input[name="tipoExclusao"]:checked').value;
            const motivo = document.getElementById('motivoExclusaoSelect').value;
            const motivoTexto = document.getElementById('motivoExclusaoTexto').value;
            
            if (!motivo) {
                mostrarAlerta('Atenção', 'Selecione um motivo para a exclusão!', 'erro');
                return;
            }
            
            try {
                if (tipoExclusao === 'completa') {
                    // Exclusão completa - remover todos os dados
                    await excluirAlunoCompleto(numeroAluno, motivo, motivoTexto);
                } else {
                    // Apenas arq


function buscarAluno() {
    const termo = document.getElementById('buscaAluno').value.trim().toLowerCase();
    const linhas = document.querySelectorAll('#tabelaAlunos tbody tr');
    
    let encontrados = 0;
    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        if (texto.includes(termo)) {
            linha.style.display = '';
            encontrados++;
        } else {
            linha.style.display = 'none';
        }
    });
    
    if (encontrados === 0 && termo) {
        mostrarAlerta('Busca', 'Nenhum aluno encontrado', 'info');
    }
}

function limparBusca() {
    document.getElementById('buscaAluno').value = '';
    const linhas = document.querySelectorAll('#tabelaAlunos tbody tr');
    linhas.forEach(linha => linha.style.display = '');
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há aluno logado
    const alunoSalvo = localStorage.getItem('alunoData');
    if (alunoSalvo) {
        alunoLogado = JSON.parse(alunoSalvo);
        mostrarPainelAluno(alunoLogado);
    } else {
        const paginaSalva = localStorage.getItem('paginaAtual') || 'home';
        mostrarPagina(paginaSalva);
    }
    
    // Efeito de digitação no título
    const titleText = document.getElementById('title-text');
    if (titleText) {
        const text = 'ZÊNITE PORTAL';
        titleText.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < text.length) {
                titleText.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        }
        typeWriter();
    }
});

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
            
