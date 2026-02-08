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
            statusMatricula: 'pendente', // ← ADICIONE ESTA LINHA
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
                
            
  // ===== PAINEL DO ADMINISTRADOR COMPLETO =====

// Função principal para carregar o painel do admin
async function carregarPainelAdmin() {
    try {
        await carregarAlunosAdmin();
        await carregarCalendarioAdmin();
        configurarFormulariosAdmin();
        await mostrarNotasRecentes();
        
        // Adicionar filtros de status
        adicionarFiltroStatus();
        
        mostrarAlerta('Bem-vindo!', 'Painel do administrador carregado com sucesso!', 'sucesso');
        
    } catch (error) {
        console.error('Erro ao carregar painel admin:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar o painel administrativo', 'erro');
    }
}

// ===== TABELA DE ALUNOS =====
async function carregarAlunosAdmin() {
    try {
        const alunosSnap = await db.collection('alunos')
            .where('excluido', '!=', true)
            .orderBy('nome')
            .get();
        
        const tbody = document.querySelector('#tabelaAlunos tbody');
        tbody.innerHTML = '';
        
        // Limpar selects
        ['notaAluno', 'dividaAluno', 'pagamentoAluno'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.innerHTML = '<option value="">Selecione o aluno</option>';
            }
        });
        
        if (alunosSnap.empty) {
            tbody.innerHTML = '<tr><td colspan="8">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
        alunosSnap.forEach(doc => {
            const aluno = doc.data();
            const numeroAluno = aluno.numeroAluno || doc.id;
            const statusMatricula = aluno.statusMatricula || 'pendente';
            const planoPagamento = aluno.planoPagamento || 'normal';
            
            // Adicionar à tabela
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aluno.nome || ''} ${aluno.apelido || ''}</td>
                <td>${numeroAluno}</td>
                <td>${aluno.classe || '-'}ª</td>
                <td>${aluno.turma || '-'}</td>
                <td>
                    <span class="status-matricula ${statusMatricula}" 
                          title="Clique para gerenciar matrícula" 
                          onclick="gerenciarMatricula('${numeroAluno}', '${statusMatricula}')"
                          style="cursor:pointer; padding:4px 10px; border-radius:12px; font-size:0.8rem; display:inline-block; min-width:100px; text-align:center;">
                        ${statusMatricula === 'confirmada' ? '✅ CONFIRMADA' : 
                          statusMatricula === 'anulada' ? '❌ ANULADA' : '🟡 PENDENTE'}
                    </span>
                </td>
                <td>
                    <span class="status-ativo ${aluno.ativo ? 'ativo' : 'inativo'}">
                        ${aluno.ativo ? '✅ Ativo' : '⏸️ Inativo'}
                    </span>
                </td>
                <td>${aluno.divida || 0} MZN</td>
                <td>
                    <div class="acoes-admin">
                        <!-- Botão Ver Formulário -->
                        <button onclick="verFormularioAluno('${numeroAluno}')" class="btn-acao ver" title="Ver formulário completo">
                            📄 Ver
                        </button>
                        
                        <!-- Botão Matrícula -->
                        <button onclick="gerenciarMatricula('${numeroAluno}', '${statusMatricula}')" class="btn-acao matricula" title="Gerenciar matrícula">
                            🎓 Matrícula
                        </button>
                        
                        <!-- Botão Plano Pagamento -->
                        <button onclick="editarPlanoPagamento('${numeroAluno}', '${planoPagamento}')" class="btn-acao plano" title="Editar plano de pagamento">
                            💰 ${planoPagamento.toUpperCase()}
                        </button>
                        
                        <!-- Botão Editar -->
                        <button onclick="editarAluno('${numeroAluno}')" class="btn-acao editar" title="Editar dados do aluno">
                            ✏️ Editar
                        </button>
                        
                        <!-- Botão Suspender/Ativar -->
                        <button onclick="suspenderAluno('${numeroAluno}', ${aluno.ativo})" class="btn-acao ${aluno.ativo ? 'suspender' : 'ativar'}" 
                                title="${aluno.ativo ? 'Suspender aluno' : 'Ativar aluno'}">
                            ${aluno.ativo ? '⏸️ Suspender' : '▶️ Ativar'}
                        </button>
                        
                        <!-- Botão Excluir -->
                        <button onclick="excluirAluno('${numeroAluno}')" class="btn-acao excluir" title="Excluir aluno">
                            🗑️ Excluir
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
            
            // Adicionar aos selects
            ['notaAluno', 'dividaAluno', 'pagamentoAluno'].forEach(id => {
                const select = document.getElementById(id);
                if (select) {
                    const option = document.createElement('option');
                    option.value = numeroAluno;
                    option.textContent = `${aluno.nome || ''} - ${numeroAluno}`;
                    select.appendChild(option);
                }
            });
        });
        
        // Adicionar estilos dinâmicos
        adicionarEstilosAdmin();
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar a lista de alunos', 'erro');
    }
}

// ===== FUNÇÕES DOS BOTÕES DO ADMIN =====

// 1. VER FORMULÁRIO DO ALUNO
async function verFormularioAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        if (!alunoDoc.exists) {
            mostrarAlerta('Erro', 'Aluno não encontrado!', 'erro');
            return;
        }
        
        const aluno = alunoDoc.data();
        
        const conteudo = `
            <div class="formulario-completo">
                <h3 style="color:#1976d2; border-bottom:2px solid #1976d2; padding-bottom:10px; margin-top:0;">
                    📋 FORMULÁRIO COMPLETO - ${aluno.nome} ${aluno.apelido}
                </h3>
                
                <div class="info-sections">
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
                        <p><strong>Status Matrícula:</strong> 
                            <span class="status-badge ${aluno.statusMatricula || 'pendente'}">
                                ${aluno.statusMatricula ? aluno.statusMatricula.toUpperCase() : 'PENDENTE'}
                            </span>
                        </p>
                        <p><strong>Status Acadêmico:</strong> ${aluno.statusAcademico || 'Regular'}</p>
                        <p><strong>Média Final:</strong> ${aluno.mediaFinal || 'Não calculada'}</p>
                        <p><strong>Disciplinas:</strong> ${aluno.disciplinas ? aluno.disciplinas.join(', ') : 'Não definidas'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>💰 DADOS FINANCEIROS</h4>
                        <p><strong>Plano de Pagamento:</strong> 
                            <span class="plano-badge ${aluno.planoPagamento || 'normal'}">
                                ${aluno.planoPagamento ? aluno.planoPagamento.toUpperCase() : 'NORMAL'}
                            </span>
                        </p>
                        <p><strong>Dívida Atual:</strong> ${aluno.divida || 0} MZN</p>
                        <p><strong>Status da Conta:</strong> ${aluno.ativo ? 'Ativa' : 'Suspensa'}</p>
                        <p><strong>Data de Inscrição:</strong> ${formatarData(aluno.criadoEm)}</p>
                    </div>
                </div>
                
                <div class="botoes-acao-formulario">
                    <button onclick="imprimirFormulario('${numeroAluno}')" class="btn-imprimir">
                        🖨️ Imprimir Formulário
                    </button>
                    <button onclick="fecharAlerta()" class="btn-fechar">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('alertTitle').textContent = `Formulário do Aluno - ${numeroAluno}`;
        document.getElementById('alertMessage').innerHTML = conteudo;
        document.getElementById('alertModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Erro ao carregar formulário:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar o formulário do aluno', 'erro');
    }
}

// 2. GERENCIAR MATRÍCULA
async function gerenciarMatricula(numeroAluno, statusAtual = 'pendente') {
    const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
    const aluno = alunoDoc.data();
    
    const conteudo = `
        <div class="modal-matricula">
            <h4>🎓 GERENCIAR MATRÍCULA</h4>
            <div class="info-aluno-matricula">
                <p><strong>Aluno:</strong> ${aluno.nome} ${aluno.apelido}</p>
                <p><strong>Número:</strong> ${numeroAluno}</p>
                <p><strong>Status Atual:</strong> 
                    <span class="status-matricula-badge ${statusAtual}">
                        ${statusAtual.toUpperCase()}
                    </span>
                </p>
            </div>
            
            <div class="opcoes-matricula">
                <div class="opcao-matricula ${statusAtual === 'pendente' ? 'selecionada' : ''}" 
                     onclick="selecionarOpcaoMatricula('pendente')">
                    <div class="icone-opcao">🟡</div>
                    <div class="texto-opcao">
                        <strong>PENDENTE</strong>
                        <small>Aluno só acessa o perfil</small>
                    </div>
                    <input type="radio" name="opcaoMatricula" value="pendente" ${statusAtual === 'pendente' ? 'checked' : ''}>
                </div>
                
                <div class="opcao-matricula ${statusAtual === 'confirmada' ? 'selecionada' : ''}" 
                     onclick="selecionarOpcaoMatricula('confirmada')">
                    <div class="icone-opcao">✅</div>
                    <div class="texto-opcao">
                        <strong>CONFIRMADA</strong>
                        <small>Acesso completo ao sistema</small>
                    </div>
                    <input type="radio" name="opcaoMatricula" value="confirmada" ${statusAtual === 'confirmada' ? 'checked' : ''}>
                </div>
                
                <div class="opcao-matricula ${statusAtual === 'anulada' ? 'selecionada' : ''}" 
                     onclick="selecionarOpcaoMatricula('anulada')">
                    <div class="icone-opcao">❌</div>
                    <div class="texto-opcao">
                        <strong>ANULADA</strong>
                        <small>Matrícula cancelada</small>
                    </div>
                    <input type="radio" name="opcaoMatricula" value="anulada" ${statusAtual === 'anulada' ? 'checked' : ''}>
                </div>
            </div>
            
            <div class="botoes-matricula">
                <button onclick="confirmarStatusMatricula('${numeroAluno}')" class="btn-confirmar">
                    ✅ Confirmar Alteração
                </button>
                <button onclick="fecharAlerta()" class="btn-cancelar">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('alertTitle').textContent = 'Gerenciar Matrícula';
    document.getElementById('alertMessage').innerHTML = conteudo;
    document.getElementById('alertModal').style.display = 'flex';
    
    // Adicionar eventos
    window.selecionarOpcaoMatricula = function(status) {
        document.querySelectorAll('.opcao-matricula').forEach(opcao => {
            opcao.classList.remove('selecionada');
        });
        event.target.closest('.opcao-matricula').classList.add('selecionada');
        document.querySelector(`input[value="${status}"]`).checked = true;
    };
    
    window.confirmarStatusMatricula = async function(numeroAluno) {
        const novoStatus = document.querySelector('input[name="opcaoMatricula"]:checked').value;
        
        try {
            await db.collection('alunos').doc(numeroAluno).update({
                statusMatricula: novoStatus,
                ativo: novoStatus === 'confirmada',
                dataConfirmacaoMatricula: novoStatus === 'confirmada' ? firebase.firestore.FieldValue.serverTimestamp() : null,
                dataAnulacaoMatricula: novoStatus === 'anulada' ? firebase.firestore.FieldValue.serverTimestamp() : null
            });
            
            // Registrar no histórico
            await db.collection('historicoMatriculas').add({
                numeroAluno: numeroAluno,
                alunoNome: aluno.nome + ' ' + aluno.apelido,
                statusAnterior: statusAtual,
                statusNovo: novoStatus,
                dataAlteracao: firebase.firestore.FieldValue.serverTimestamp(),
                administrador: 'Admin'
            });
            
            let mensagem = '';
            switch(novoStatus) {
                case 'confirmada':
                    mensagem = '✅ Matrícula CONFIRMADA! O aluno agora tem acesso completo.';
                    break;
                case 'pendente':
                    mensagem = '🟡 Matrícula marcada como PENDENTE. Acesso limitado.';
                    break;
                case 'anulada':
                    mensagem = '❌ Matrícula ANULADA! Acesso bloqueado.';
                    break;
            }
            
            mostrarAlerta('Status Atualizado', 
                `${mensagem}\n\n` +
                `Aluno: ${aluno.nome}\n` +
                `Status: ${novoStatus.toUpperCase()}`,
                novoStatus === 'confirmada' ? 'sucesso' : 
                novoStatus === 'anulada' ? 'erro' : 'info'
            );
            
            fecharAlerta();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível atualizar o status', 'erro');
        }
    };
}

// 3. EDITAR PLANO DE PAGAMENTO
async function editarPlanoPagamento(numeroAluno, planoAtual = 'normal') {
    const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
    const aluno = alunoDoc.data();
    
    const conteudo = `
        <div class="modal-plano">
            <h4>💰 EDITAR PLANO DE PAGAMENTO</h4>
            <div class="info-aluno-plano">
                <p><strong>Aluno:</strong> ${aluno.nome} ${aluno.apelido}</p>
                <p><strong>Plano Atual:</strong> 
                    <span class="plano-atual ${planoAtual}">
                        ${planoAtual.toUpperCase()}
                    </span>
                </p>
            </div>
            
            <div class="opcoes-plano">
                <div class="opcao-plano ${planoAtual === 'normal' ? 'selecionada' : ''}" 
                     onclick="selecionarOpcaoPlano('normal')">
                    <div class="icone-plano">📊</div>
                    <div class="texto-plano">
                        <strong>NORMAL</strong>
                        <p class="valor-plano">5.000 MZN/mês</p>
                        <small>Pagamento mensal padrão</small>
                    </div>
                    <input type="radio" name="opcaoPlano" value="normal" ${planoAtual === 'normal' ? 'checked' : ''}>
                </div>
                
                <div class="opcao-plano ${planoAtual === 'vip' ? 'selecionada' : ''}" 
                     onclick="selecionarOpcaoPlano('vip')">
                    <div class="icone-plano">⭐</div>
                    <div class="texto-plano">
                        <strong>VIP</strong>
                        <p class="valor-plano">13.500 MZN/trimestre</p>
                        <small>Economia de 1.500 MZN</small>
                    </div>
                    <input type="radio" name="opcaoPlano" value="vip" ${planoAtual === 'vip' ? 'checked' : ''}>
                </div>
                
                <div class="opcao-plano ${planoAtual === 'premium' ? 'selecionada' : ''}" 
                     onclick="selecionarOpcaoPlano('premium')">
                    <div class="icone-plano">👑</div>
                    <div class="texto-plano">
                        <strong>PREMIUM</strong>
                        <p class="valor-plano">50.000 MZN/ano</p>
                        <small>Economia de 10.000 MZN</small>
                    </div>
                    <input type="radio" name="opcaoPlano" value="premium" ${planoAtual === 'premium' ? 'checked' : ''}>
                </div>
            </div>
            
            <div class="info-adicional">
                <p><strong>💡 Nota:</strong> A mudança de plano pode ajustar automaticamente a dívida do aluno.</p>
            </div>
            
            <div class="botoes-plano">
                <button onclick="confirmarPlanoPagamento('${numeroAluno}')" class="btn-confirmar-plano">
                    ✅ Confirmar Plano
                </button>
                <button onclick="fecharAlerta()" class="btn-cancelar">
                    ❌ Cancelar
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('alertTitle').textContent = 'Plano de Pagamento';
    document.getElementById('alertMessage').innerHTML = conteudo;
    document.getElementById('alertModal').style.display = 'flex';
    
    // Adicionar eventos
    window.selecionarOpcaoPlano = function(plano) {
        document.querySelectorAll('.opcao-plano').forEach(opcao => {
            opcao.classList.remove('selecionada');
        });
        event.target.closest('.opcao-plano').classList.add('selecionada');
        document.querySelector(`input[value="${plano}"]`).checked = true;
    };
    
    window.confirmarPlanoPagamento = async function(numeroAluno) {
        const novoPlano = document.querySelector('input[name="opcaoPlano"]:checked').value;
        
        try {
            // Calcular ajuste na dívida
            const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
            const aluno = alunoDoc.data();
            const planoAnterior = aluno.planoPagamento || 'normal';
            
            // Valores dos planos
            const valoresPlanos = {
                normal: 5000,
                vip: 13500,
                premium: 50000
            };
            
            // Atualizar plano
            await db.collection('alunos').doc(numeroAluno).update({
                planoPagamento: novoPlano,
                planoAtualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Registrar alteração
            await db.collection('historicoPlanos').add({
                numeroAluno: numeroAluno,
                alunoNome: aluno.nome + ' ' + aluno.apelido,
                planoAnterior: planoAnterior,
                planoNovo: novoPlano,
                dataAlteracao: firebase.firestore.FieldValue.serverTimestamp(),
                administrador: 'Admin'
            });
            
            mostrarAlerta('✅ Plano Atualizado!', 
                `Plano alterado para: ${novoPlano.toUpperCase()}\n` +
                `Aluno: ${aluno.nome}\n` +
                `Valor: ${valoresPlanos[novoPlano]} MZN\n` +
                `Status: Ativo`,
                'sucesso'
            );
            
            fecharAlerta();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível atualizar o plano', 'erro');
        }
    };
}

// 4. EDITAR ALUNO
async function editarAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        const conteudo = `
            <div class="modal-editar-aluno">
                <h4>✏️ EDITAR DADOS DO ALUNO</h4>
                <div class="form-editar">
                    <div class="form-group">
                        <label>Nome:</label>
                        <input type="text" id="editarNome" value="${aluno.nome || ''}" placeholder="Nome do aluno">
                    </div>
                    
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" id="editarEmail" value="${aluno.email || ''}" placeholder="Email do aluno">
                    </div>
                    
                    <div class="form-group">
                        <label>Telefone:</label>
                        <input type="tel" id="editarTelefone" value="${aluno.telefone || ''}" placeholder="Telefone">
                    </div>
                    
                    <div class="form-group">
                        <label>Classe:</label>
                        <select id="editarClasse">
                            <option value="9" ${aluno.classe === '9' ? 'selected' : ''}>9ª Classe</option>
                            <option value="10" ${aluno.classe === '10' ? 'selected' : ''}>10ª Classe</option>
                            <option value="11" ${aluno.classe === '11' ? 'selected' : ''}>11ª Classe</option>
                            <option value="12" ${aluno.classe === '12' ? 'selected' : ''}>12ª Classe</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Turma:</label>
                        <select id="editarTurma">
                            <option value="A" ${aluno.turma === 'A' ? 'selected' : ''}>Turma A</option>
                            <option value="B" ${aluno.turma === 'B' ? 'selected' : ''}>Turma B</option>
                            <option value="C" ${aluno.turma === 'C' ? 'selected' : ''}>Turma C</option>
                            <option value="D" ${aluno.turma === 'D' ? 'selected' : ''}>Turma D</option>
                        </select>
                    </div>
                </div>
                
                <div class="botoes-editar">
                    <button onclick="salvarEdicaoAluno('${numeroAluno}')" class="btn-salvar">
                        💾 Salvar Alterações
                    </button>
                    <button onclick="fecharAlerta()" class="btn-cancelar">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('alertTitle').textContent = 'Editar Aluno';
        document.getElementById('alertMessage').innerHTML = conteudo;
        document.getElementById('alertModal').style.display = 'flex';
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível carregar dados do aluno', 'erro');
    }
}

// 5. SALVAR EDIÇÃO DO ALUNO
window.salvarEdicaoAluno = async function(numeroAluno) {
    try {
        const nome = document.getElementById('editarNome').value;
        const email = document.getElementById('editarEmail').value;
        const telefone = document.getElementById('editarTelefone').value;
        const classe = document.getElementById('editarClasse').value;
        const turma = document.getElementById('editarTurma').value;
        
        if (!nome || !email || !telefone) {
            mostrarAlerta('Atenção', 'Preencha todos os campos obrigatórios!', 'erro');
            return;
        }
        
        await db.collection('alunos').doc(numeroAluno).update({
            nome: nome,
            email: email,
            telefone: telefone,
            classe: classe,
            turma: turma,
            atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar também nas notas
        const notasSnap = await db.collection('notas').where('numeroAluno', '==', numeroAluno).get();
        const batch = db.batch();
        notasSnap.forEach(doc => {
            batch.update(doc.ref, {
                alunoNome: nome,
                alunoClasse: classe,
                alunoTurma: turma
            });
        });
        await batch.commit();
        
        mostrarAlerta('✅ Aluno Atualizado!', 
            `Dados do aluno foram atualizados com sucesso!\n` +
            `Nome: ${nome}\n` +
            `Classe: ${classe}ª - ${turma}`,
            'sucesso'
        );
        
        fecharAlerta();
        carregarAlunosAdmin();
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível atualizar o aluno', 'erro');
    }
};

// 6. SUSPENDER/ATIVAR ALUNO
async function suspenderAluno(numeroAluno, atualmenteAtivo) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        const acao = atualmenteAtivo ? 'suspender' : 'ativar';
        const confirmar = await mostrarConfirmacao(`
            Tem certeza que deseja ${acao} o aluno?
            <br><br>
            <strong>Aluno:</strong> ${aluno.nome} ${aluno.apelido}
            <br>
            <strong>Status atual:</strong> ${atualmenteAtivo ? 'Ativo' : 'Suspenso'}
        `);
        
        if (!confirmar) return;
        
        await db.collection('alunos').doc(numeroAluno).update({
            ativo: !atualmenteAtivo,
            dataSuspensao: !atualmenteAtivo ? null : firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarAlerta('✅ Status Alterado!', 
            `Aluno ${acao}do com sucesso!\n` +
            `Nome: ${aluno.nome}\n` +
            `Novo status: ${!atualmenteAtivo ? 'Ativo' : 'Suspenso'}`,
            'sucesso'
        );
        
        carregarAlunosAdmin();
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível alterar o status do aluno', 'erro');
    }
            }

    // 7. EXCLUIR ALUNO
async function excluirAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        const confirmar = await mostrarConfirmacao(`
            <div style="text-align:center;">
                <h4 style="color:#f44336;">⚠️ CONFIRMAR EXCLUSÃO</h4>
                <p style="background:#ffebee; padding:10px; border-radius:5px;">
                    Esta ação é irreversível!
                </p>
                <br>
                <p><strong>Aluno:</strong> ${aluno.nome} ${aluno.apelido}</p>
                <p><strong>Número:</strong> ${numeroAluno}</p>
                <p><strong>Classe:</strong> ${aluno.classe}ª - ${aluno.turma}</p>
                <p><strong>Dívida:</strong> ${aluno.divida || 0} MZN</p>
                <br>
                <p>Selecione o tipo de exclusão:</p>
                <select id="tipoExclusao" style="width:100%; padding:8px; margin:10px 0;">
                    <option value="arquivar">📁 Arquivar (Mantém histórico)</option>
                    <option value="completa">🗑️ Exclusão Completa</option>
                </select>
                <textarea id="motivoExclusao" placeholder="Motivo da exclusão (opcional)" 
                          style="width:100%; padding:8px; margin:10px 0; border:1px solid #ddd; border-radius:4px;" rows="3"></textarea>
            </div>
        `, true);
        
        if (!confirmar) return;
        
        const tipoExclusao = document.getElementById('tipoExclusao').value;
        const motivo = document.getElementById('motivoExclusao').value;
        
        if (tipoExclusao === 'completa') {
            // Exclusão completa
            await excluirAlunoCompleto(numeroAluno, motivo);
        } else {
            // Arquivar
            await arquivarAluno(numeroAluno, motivo);
        }
        
        carregarAlunosAdmin();
        
    } catch (error) {
        console.error('Erro ao excluir aluno:', error);
        mostrarAlerta('Erro', 'Não foi possível excluir o aluno', 'erro');
    }
}

// 8. EXCLUSÃO COMPLETA
async function excluirAlunoCompleto(numeroAluno, motivo) {
    try {
        // Buscar dados relacionados
        const notasSnap = await db.collection('notas').where('numeroAluno', '==', numeroAluno).get();
        const pagamentosSnap = await db.collection('pagamentos').where('numeroAluno', '==', numeroAluno).get();
        const dividasSnap = await db.collection('dividas').where('numeroAluno', '==', numeroAluno).get();
        
        // Excluir em batch
        const batch = db.batch();
        
        notasSnap.forEach(doc => batch.delete(doc.ref));
        pagamentosSnap.forEach(doc => batch.delete(doc.ref));
        dividasSnap.forEach(doc => batch.delete(doc.ref));
        
        await batch.commit();
        
        // Excluir aluno
        await db.collection('alunos').doc(numeroAluno).delete();
        
        mostrarAlerta('✅ Exclusão Completa!', 
            `Aluno removido completamente do sistema.\n` +
            `Dados excluídos:\n` +
            `- Notas: ${notasSnap.size}\n` +
            `- Pagamentos: ${pagamentosSnap.size}\n` +
            `- Dívidas: ${dividasSnap.size}\n` +
            `Motivo: ${motivo || 'Não informado'}`,
            'sucesso'
        );
        
    } catch (error) {
        throw error;
    }
}

// 9. ARQUIVAR ALUNO
async function arquivarAluno(numeroAluno, motivo) {
    try {
        await db.collection('alunos').doc(numeroAluno).update({
            excluido: true,
            arquivado: true,
            ativo: false,
            motivoExclusao: motivo || 'Excluído pelo administrador',
            dataExclusao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        mostrarAlerta('✅ Aluno Arquivado!', 
            `Aluno arquivado com sucesso.\n` +
            `Os dados foram mantidos para fins históricos.\n` +
            `Motivo: ${motivo || 'Não informado'}`,
            'sucesso'
        );
        
    } catch (error) {
        throw error;
    }
}

 // 10. IMPRIMIR FORMULÁRIO
function imprimirFormulario(numeroAluno) {
    const conteudo = document.querySelector('.formulario-completo').innerHTML;
    const janela = window.open('', '_blank');
    janela.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Formulário do Aluno - ${numeroAluno}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h3 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; }
                .info-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .info-section { background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2; }
                .info-section h4 { color: #1976d2; margin-top: 0; }
                .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.9rem; font-weight: bold; }
                .status-badge.pendente { background: #ff9800; color: white; }
                .status-badge.confirmada { background: #4caf50; color: white; }
                .status-badge.anulada { background: #f44336; color: white; }
                .plano-badge { padding: 4px 10px; border-radius: 12px; font-size: 0.9rem; font-weight: bold; }
                .plano-badge.normal { background: #2196f3; color: white; }
                .plano-badge.vip { background: #ff9800; color: white; }
                .plano-badge.premium { background: #9c27b0; color: white; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            ${conteudo}
            <div style="text-align:center; margin-top:30px;">
                <button onclick="window.print()" style="background:#2196f3; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer; margin-right:10px;">
                    🖨️ Imprimir
                </button>
                <button onclick="window.close()" style="background:#757575; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">
                    ❌ Fechar
                </button>
            </div>
        </body>
        </html>
    `);
    janela.document.close();
}

// 11. CONFIRMAÇÃO GENÉRICA
function mostrarConfirmacao(mensagem, retornarValor = false) {
    return new Promise((resolve) => {
        const conteudo = `
            <div style="max-width:500px;">
                ${mensagem}
                <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
                    <button onclick="confirmarAcao(true)" 
                            style="background:#4caf50; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">
                        ✅ Confirmar
                    </button>
                    <button onclick="confirmarAcao(false)" 
                            style="background:#f44336; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">
                        ❌ Cancelar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('alertTitle').textContent = 'Confirmação';
        document.getElementById('alertMessage').innerHTML = conteudo;
        document.getElementById('alertModal').style.display = 'flex';
        
        window.confirmarAcao = function(confirmado) {
            fecharAlerta();
            resolve(confirmado);
        };
    });
}

// 12. FORMULÁRIOS DO ADMIN
function configurarFormulariosAdmin() {
    // FORMULÁRIO DE NOTAS
    document.getElementById('formNota').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const alunoNumero = document.getElementById('notaAluno').value;
        const disciplina = document.getElementById('notaDisciplina').value;
        const trimestre = parseInt(document.getElementById('notaTrimestre').value);
        const tipo = document.getElementById('notaTipo').value;
        const valor = parseFloat(document.getElementById('notaValor').value);
        
        if (!alunoNumero || !disciplina || isNaN(valor) || valor < 0 || valor > 20) {
            mostrarAlerta('Erro', 'Preencha todos os campos corretamente!', 'erro');
            return;
        }
        
        try {
            // Verificar se aluno existe e se disciplina pertence a ele
            const alunoDoc = await db.collection('alunos').doc(alunoNumero).get();
            if (!alunoDoc.exists) {
                mostrarAlerta('Erro', 'Aluno não encontrado!', 'erro');
                return;
            }
            
            const aluno = alunoDoc.data();
            if (!aluno.disciplinas || !aluno.disciplinas.includes(disciplina)) {
                mostrarAlerta('Erro', 'Esta disciplina não pertence ao aluno!', 'erro');
                return;
            }
            
            // Criar ID único para a nota
            const notaId = `${alunoNumero}_${disciplina}_${trimestre}_${tipo}`;
            
            // Verificar se já existe
            const notaExistente = await db.collection('notas').doc(notaId).get();
            
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
            
            if (notaExistente.exists) {
                // Atualizar
                await db.collection('notas').doc(notaId).update(notaData);
                mostrarAlerta('✅ Nota Atualizada!', `Nota ${tipo} atualizada para ${valor}`, 'sucesso');
            } else {
                // Criar nova
                notaData.criadoEm = firebase.firestore.FieldValue.serverTimestamp();
                await db.collection('notas').doc(notaId).set(notaData);
                mostrarAlerta('✅ Nota Lançada!', `Nota ${tipo} registrada: ${valor}`, 'sucesso');
            }
            
            // Atualizar média do aluno
            await atualizarMediaAluno(alunoNumero);
            
            // Limpar formulário
            this.reset();
            carregarAlunosAdmin();
            mostrarNotasRecentes();
            
        } catch (error) {
            console.error('Erro ao lançar nota:', error);
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
            // Atualizar dívida total do aluno
            const alunoDoc = await db.collection('alunos').doc(alunoNumero).get();
            const dividaAtual = alunoDoc.data().divida || 0;
            const novaDivida = dividaAtual + valor;
            
            await db.collection('alunos').doc(alunoNumero).update({
                divida: novaDivida
            });
            
            // Registrar no histórico
            await db.collection('dividas').add({
                numeroAluno: alunoNumero,
                valor: valor,
                descricao: descricao,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarAlerta('✅ Dívida Registrada!', 
                `Dívida registrada: ${valor} MZN\n` +
                `Total atual: ${novaDivida} MZN\n` +
                `Aluno: ${alunoDoc.data().nome}`,
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
                `Pagamento registrado: ${valor} MZN\n` +
                `Dívida restante: ${novaDivida} MZN\n` +
                `Mês: ${mes}`,
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
                `Evento adicionado ao calendário:\n` +
                `Data: ${formatarData(new Date(data))}\n` +
                `Descrição: ${descricao}`,
                'sucesso'
            );
            
            this.reset();
            await carregarCalendarioAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível adicionar o evento', 'erro');
        }
    });
}

// 13. ATUALIZAR MÉDIA DO ALUNO
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

// 14. CALENDÁRIO DO ADMIN
async function carregarCalendarioAdmin() {
    try {
        const calendarioSnap = await db.collection('calendario')
            .orderBy('data')
            .get();
        
        const lista = document.getElementById('adminCalendario');
        if (!lista) return;
        
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
                <button onclick="removerEvento('${doc.id}')" class="btn-remover">🗑️ Remover</button>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar calendário admin:', error);
    }
    }

    // 15. REMOVER EVENTO
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

// 16. NOTAS RECENTES
async function mostrarNotasRecentes() {
    try {
        const notasSnap = await db.collection('notas')
            .orderBy('atualizadoEm', 'desc')
            .limit(10)
            .get();
        
        const container = document.createElement('div');
        container.className = 'notas-recentes';
        container.innerHTML = '<h3>📝 Últimas Notas Lançadas</h3>';
        
        if (notasSnap.empty) {
            container.innerHTML += '<p style="color:#666; text-align:center;">Nenhuma nota lançada ainda</p>';
        } else {
            const lista = document.createElement('div');
            lista.className = 'lista-notas-recentes';
            
            notasSnap.forEach(doc => {
                const nota = doc.data();
                const item = document.createElement('div');
                item.className = 'nota-recente';
                item.innerHTML = `
                    <div class="nota-info">
                        <strong>${nota.alunoNome}</strong>
                        <span>${nota.disciplina} - ${nota.tipo}</span>
                    </div>
                    <div class="nota-valor">${nota.nota}</div>
                    <div class="nota-data">${formatarData(nota.atualizadoEm)}</div>
                `;
                lista.appendChild(item);
            });
            container.appendChild(lista);
        }
        
        // Adicionar ao painel
        const adminFunc = document.querySelector('.admin-funcionalidades');
        if (adminFunc && !document.querySelector('.notas-recentes')) {
            adminFunc.insertBefore(container, adminFunc.firstChild);
        }
        
    } catch (error) {
        console.error('Erro ao mostrar notas recentes:', error);
    }
}

// 17. FILTRO DE STATUS
function adicionarFiltroStatus() {
    const buscaContainer = document.querySelector('.busca-container');
    if (!buscaContainer) return;
    
    const filtroDiv = document.createElement('div');
    filtroDiv.className = 'filtro-status';
    filtroDiv.innerHTML = `
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">
            <button onclick="filtrarAlunos('todos')" class="btn-filtro active">👥 Todos</button>
            <button onclick="filtrarAlunos('pendente')" class="btn-filtro">🟡 Pendentes</button>
            <button onclick="filtrarAlunos('confirmada')" class="btn-filtro">✅ Confirmados</button>
            <button onclick="filtrarAlunos('anulada')" class="btn-filtro">❌ Anulados</button>
            <button onclick="filtrarAlunos('divida')" class="btn-filtro">💰 Com Dívida</button>
            <button onclick="filtrarAlunos('ativo')" class="btn-filtro">✅ Ativos</button>
            <button onclick="filtrarAlunos('inativo')" class="btn-filtro">⏸️ Inativos</button>
        </div>
    `;
    
    buscaContainer.parentNode.insertBefore(filtroDiv, buscaContainer.nextSibling);
}

// 18. FILTRAR ALUNOS
async function filtrarAlunos(tipo) {
    // Atualizar botões ativos
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    try {
        let query = db.collection('alunos');
        
        // Aplicar filtros
        switch(tipo) {
            case 'pendente':
                query = query.where('statusMatricula', '==', 'pendente');
                break;
            case 'confirmada':
                query = query.where('statusMatricula', '==', 'confirmada');
                break;
            case 'anulada':
                query = query.where('statusMatricula', '==', 'anulada');
                break;
            case 'divida':
                query = query.where('divida', '>', 0);
                break;
            case 'ativo':
                query = query.where('ativo', '==', true);
                break;
            case 'inativo':
                query = query.where('ativo', '==', false);
                break;
            // 'todos' não aplica filtro
        }
        
        query = query.where('excluido', '!=', true).orderBy('nome');
        
        const alunosSnap = await query.get();
        const tbody = document.querySelector('#tabelaAlunos tbody');
        tbody.innerHTML = '';
        
        if (alunosSnap.empty) {
            tbody.innerHTML = `<tr><td colspan="8">Nenhum aluno encontrado</td></tr>`;
            return;
        }
        
        alunosSnap.forEach(doc => {
            const aluno = doc.data();
            const numeroAluno = aluno.numeroAluno || doc.id;
            const statusMatricula = aluno.statusMatricula || 'pendente';
            const planoPagamento = aluno.planoPagamento || 'normal';
            
            // Adicionar à tabela (mesmo HTML da função carregarAlunosAdmin)
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${aluno.nome || ''} ${aluno.apelido || ''}</td>
                <td>${numeroAluno}</td>
                <td>${aluno.classe || '-'}ª</td>
                <td>${aluno.turma || '-'}</td>
                <td>
                    <span class="status-matricula ${statusMatricula}" 
                          onclick="gerenciarMatricula('${numeroAluno}', '${statusMatricula}')"
                          style="cursor:pointer; padding:4px 10px; border-radius:12px; font-size:0.8rem; display:inline-block; min-width:100px; text-align:center;">
                        ${statusMatricula === 'confirmada' ? '✅ CONFIRMADA' : 
                          statusMatricula === 'anulada' ? '❌ ANULADA' : '🟡 PENDENTE'}
                    </span>
                </td>
                <td>
                    <span class="status-ativo ${aluno.ativo ? 'ativo' : 'inativo'}">
                        ${aluno.ativo ? '✅ Ativo' : '⏸️ Inativo'}
                    </span>
                </td>
                <td>${aluno.divida || 0} MZN</td>
                <td>
                    <div class="acoes-admin">
                        <button onclick="verFormularioAluno('${numeroAluno}')" class="btn-acao ver">📄 Ver</button>
                        <button onclick="gerenciarMatricula('${numeroAluno}', '${statusMatricula}')" class="btn-acao matricula">🎓 Matrícula</button>
                        <button onclick="editarPlanoPagamento('${numeroAluno}', '${planoPagamento}')" class="btn-acao plano">💰 ${planoPagamento.toUpperCase()}</button>
                        <button onclick="editarAluno('${numeroAluno}')" class="btn-acao editar">✏️ Editar</button>
                        <button onclick="suspenderAluno('${numeroAluno}', ${aluno.ativo})" class="btn-acao ${aluno.ativo ? 'suspender' : 'ativar'}">
                            ${aluno.ativo ? '⏸️ Suspender' : '▶️ Ativar'}
                        </button>
                        <button onclick="excluirAluno('${numeroAluno}')" class="btn-acao excluir">🗑️ Excluir</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (error) {
        console.error('Erro ao filtrar alunos:', error);
        mostrarAlerta('Erro', 'Não foi possível aplicar o filtro', 'erro');
    }
                }

    // 19. BUSCAR ALUNO
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
        mostrarAlerta('Busca', 'Nenhum aluno encontrado com este termo', 'info');
    }
}

// 20. LIMPAR BUSCA
function limparBusca() {
    document.getElementById('buscaAluno').value = '';
    const linhas = document.querySelectorAll('#tabelaAlunos tbody tr');
    linhas.forEach(linha => linha.style.display = '');
}

// 21. ADICIONAR ESTILOS DINÂMICOS
function adicionarEstilosAdmin() {
    const styles = `
        <style>
            /* Estilos para o painel do admin */
            .acoes-admin {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                justify-content: center;
            }
            
            .btn-acao {
                padding: 6px 10px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.3s;
                white-space: nowrap;
            }
            
            .btn-acao:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            }
            
            .btn-acao.ver { background: #2196f3; color: white; }
            .btn-acao.matricula { background: #9c27b0; color: white; }
            .btn-acao.plano { background: #ff9800; color: white; }
            .btn-acao.editar { background: #4caf50; color: white; }
            .btn-acao.suspender { background: #ff5722; color: white; }
            .btn-acao.ativar { background: #00bcd4; color: white; }
            .btn-acao.excluir { background: #f44336; color: white; }
            
            .status-matricula {
                font-weight: bold;
            }
            .status-matricula.pendente { color: #ff9800; }
            .status-matricula.confirmada { color: #4caf50; }
            .status-matricula.anulada { color: #f44336; }
            
            .status-ativo.ativo { color: #4caf50; font-weight: bold; }
            .status-ativo.inativo { color: #ff5722; font-weight: bold; }
            
            .btn-filtro {
                padding: 8px 15px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 0.9rem;
            }
            
            .btn-filtro:hover {
                background: #f5f5f5;
            }
            
            .btn-filtro.active {
                background: #1976d2;
                color: white;
                border-color: #1976d2;
            }
            
            .notas-recentes {
                background: white;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            
            .lista-notas-recentes {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .nota-recente {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .nota-recente:last-child {
                border-bottom: none;
            }
            
            .nota-info {
                flex: 1;
            }
            
            .nota-info strong {
                display: block;
                font-size: 0.9rem;
            }
            
            .nota-info span {
                font-size: 0.8rem;
                color: #666;
            }
            
            .nota-valor {
                font-weight: bold;
                font-size: 1.1rem;
                color: #1976d2;
                margin: 0 15px;
            }
            
            .nota-data {
                font-size: 0.8rem;
                color: #999;
            }
            
            .evento-admin {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .btn-remover {
                background: #f44336;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 0.8rem;
            }
            
            /* Estilos para modais */
            .modal-matricula, .modal-plano, .modal-editar-aluno {
                max-width: 500px;
                margin: 0 auto;
            }
            
            .opcao-matricula, .opcao-plano {
                display: flex;
                align-items: center;
                padding: 15px;
                border: 2px solid #ddd;
                border-radius: 8px;
                margin: 10px 0;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .opcao-matricula:hover, .opcao-plano:hover {
                border-color: #1976d2;
                background: #f0f8ff;
            }
            
            .opcao-matricula.selecionada, .opcao-plano.selecionada {
                border-color: #4caf50;
                background: #e8f5e9;
            }
            
            .icone-opcao, .icone-plano {
                font-size: 1.5rem;
                margin-right: 15px;
            }
            
            .texto-opcao, .texto-plano {
                flex: 1;
            }
            
            .texto-opcao strong, .texto-plano strong {
                display: block;
                font-size: 1.1rem;
            }
            
            .texto-opcao small, .texto-plano small {
                color: #666;
                font-size: 0.9rem;
            }
            
            .valor-plano {
                font-weight: bold;
                color: #1976d2;
                margin: 5px 0;
            }
            
            .form-editar {
                display: grid;
                gap: 15px;
                margin: 20px 0;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: bold;
                color: #555;
            }
            
            .form-group input, .form-group select {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 1rem;
            }
            
            .botoes-matricula, .botoes-plano, .botoes-editar {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .btn-confirmar, .btn-confirmar-plano, .btn-salvar {
                background: #4caf50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .btn-cancelar {
                background: #f44336;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            .info-aluno-matricula, .info-aluno-plano {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 5px;
                margin: 15px 0;
            }
            
            .status-matricula-badge, .plano-atual {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: bold;
                display: inline-block;
            }
            
            .status-matricula-badge.pendente { background: #ff9800; color: white; }
            .status-matricula-badge.confirmada { background: #4caf50; color: white; }
            .status-matricula-badge.anulada { background: #f44336; color: white; }
            
            .plano-atual.normal { background: #2196f3; color: white; }
            .plano-atual.vip { background: #ff9800; color: white; }
            .plano-atual.premium { background: #9c27b0; color: white; }
            
            /* Formulário completo */
            .formulario-completo {
                max-width: 800px;
                max-height: 70vh;
                overflow-y: auto;
            }
            
            .info-sections {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            
            .info-section {
                background: #f9f9f9;
                padding: 20px;
                border-radius: 10px;
                border-left: 5px solid #1976d2;
            }
            
            .info-section h4 {
                color: #1976d2;
                margin-top: 0;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            
            .info-section p {
                margin: 8px 0;
                line-height: 1.5;
            }
            
            .status-badge, .plano-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.9rem;
                font-weight: bold;
                display: inline-block;
            }
            
            .status-badge.pendente { background: #ff9800; color: white; }
            .status-badge.confirmada { background: #4caf50; color: white; }
            .status-badge.anulada { background: #f44336; color: white; }
            
            .plano-badge.normal { background: #2196f3; color: white; }
            .plano-badge.vip { background: #ff9800; color: white; }
            .plano-badge.premium { background: #9c27b0; color: white; }
            
            .botoes-acao-formulario {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #eee;
            }
            
            .btn-imprimir {
                background: #2196f3;
                color: white;
                padding: 12px 25px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-fechar {
                background: #757575;
                color: white;
                padding: 12px 25px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 1rem;
            }
            
            /* Responsividade */
            @media (max-width: 768px) {
                .acoes-admin {
                    flex-direction: column;
                }
                
                .btn-acao {
                    width: 100%;
                    justify-content: center;
                }
                
                .info-sections {
                    grid-template-columns: 1fr;
                }
                
                .botoes-acao-formulario {
                    flex-direction: column;
                }
                
                .btn-imprimir, .btn-fechar {
                    width: 100%;
                    justify-content: center;
                }
            }
        </style>
    `;
    
    // Remover estilos antigos se existirem
    const oldStyles = document.querySelector('#admin-styles');
    if (oldStyles) oldStyles.remove();
    
    // Adicionar novos estilos
    const styleElement = document.createElement('div');
    styleElement.id = 'admin-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}

// 22. INICIALIZAR PAINEL ADMIN AO MOSTRAR
function mostrarPainelAdmin() {
    mostrarPagina('painelAdmin');
    carregarPainelAdmin();
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
