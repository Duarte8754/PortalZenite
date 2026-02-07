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

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function mostrarPagina(id) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const pagina = document.getElementById(id);
    if (pagina) {
        pagina.style.display = 'block';
        localStorage.setItem('paginaAtual', id);
    }
    
    // Inicializar funcionalidades específicas da página
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
}

function fazerLogout() {
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
    
    // Definir cor baseada no tipo
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
    return new Date(data).toLocaleDateString('pt-PT');
}

function calcularMedia(notas) {
    const valores = Object.values(notas).filter(v => !isNaN(parseFloat(v)));
    if (valores.length === 0) return 0;
    const soma = valores.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
    return (soma / valores.length).toFixed(1);
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
    
    // Evento de mudança na classe
    classe.addEventListener('change', function() {
        const classeSelecionada = this.value;
        
        // Resetar curso
        curso.style.display = 'none';
        labelCurso.style.display = 'none';
        curso.value = '';
        
        // Mostrar disciplinas base para todas as classes
        mostrarDisciplinas(disciplinasBase);
        
        // Mostrar campo de curso apenas para 11ª e 12ª
        if (classeSelecionada === '11' || classeSelecionada === '12') {
            curso.style.display = 'block';
            labelCurso.style.display = 'block';
        }
    });
    
    // Evento de mudança no curso
    curso.addEventListener('change', function() {
        const cursoSelecionado = this.value;
        if (!cursoSelecionado) return;
        
        // Combinar disciplinas base com disciplinas do curso
        const disciplinasCompletas = [...disciplinasBase];
        if (disciplinasCurso[cursoSelecionado]) {
            disciplinasCompletas.push(...disciplinasCurso[cursoSelecionado]);
        }
        
        mostrarDisciplinas(disciplinasCompletas);
    });
    
    // Submissão do formulário
    const form = document.getElementById('formInscricao');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Coletar dados do formulário
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
            senha: Math.random().toString(36).slice(-8) + '@ZN', // Senha segura
            disciplinas: Array.from(document.querySelectorAll('input[name="disciplinas"]:checked'))
                            .map(cb => cb.value),
            statusAcademico: 'Regular',
            divida: 0,
            ativo: true,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Validação
        if (!dados.disciplinas.length) {
            mostrarAlerta('Erro', 'Selecione pelo menos uma disciplina!', 'erro');
            return;
        }
        
        if ((dados.classe === '11' || dados.classe === '12') && !dados.curso) {
            mostrarAlerta('Erro', 'Selecione um curso para a 11ª ou 12ª classe!', 'erro');
            return;
        }
        
        try {
            // Salvar no Firestore
            await db.collection('alunos').doc(dados.numeroAluno).set(dados);
            
            // Mostrar confirmação com credenciais
            mostrarAlerta(
                '✅ Inscrição Concluída!',
                `Número do Aluno: ${dados.numeroAluno}\nSenha: ${dados.senha}\n\nGuarde estas informações para login!`,
                'sucesso'
            );
            
            // Limpar formulário
            form.reset();
            disciplinasDiv.innerHTML = '';
            
        } catch (error) {
            console.error('Erro ao salvar inscrição:', error);
            mostrarAlerta('Erro', 'Não foi possível concluir a inscrição. Tente novamente.', 'erro');
        }
    });
}

// ===== SISTEMA DE LOGIN =====
document.getElementById('formLogin').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    
    // Login do administrador (credenciais fixas)
    if (usuario === 'admin' && senha === 'admin123') {
        adminLogado = true;
        mostrarPagina('painelAdmin');
        mostrarAlerta('Bem-vindo!', 'Login como administrador realizado com sucesso!', 'sucesso');
        return;
    }
    
    try {
        // Buscar aluno pelo email ou número
        let alunoData = null;
        
        // Tentar buscar pelo email
        const queryByEmail = await db.collection('alunos')
            .where('email', '==', usuario)
            .limit(1)
            .get();
        
        if (!queryByEmail.empty) {
            alunoData = queryByEmail.docs[0].data();
        } else {
            // Tentar buscar pelo número do aluno
            const doc = await db.collection('alunos').doc(usuario).get();
            if (doc.exists) {
                alunoData = doc.data();
            }
        }
        
        // Verificar se aluno foi encontrado
        if (!alunoData) {
            throw new Error('Aluno não encontrado!');
        }
        
        // Verificar senha
        if (alunoData.senha !== senha) {
            throw new Error('Senha incorreta!');
        }
        
        // Verificar se aluno está ativo
        if (!alunoData.ativo) {
            throw new Error('Conta suspensa. Contacte a administração.');
        }
        
        // Login bem sucedido
        alunoLogado = alunoData;
        localStorage.setItem('alunoData', JSON.stringify(alunoData));
        mostrarPainelAluno(alunoData);
        
    } catch (error) {
        mostrarAlerta('Erro no Login', error.message, 'erro');
    }
});

// ===== PAINEL DO ALUNO =====
function mostrarPainelAluno(aluno) {
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
    
    // Carregar dados específicos
    carregarNotasAluno(aluno.numeroAluno);
    carregarExtratoAluno(aluno.numeroAluno);
    carregarDividasAluno(aluno.numeroAluno);
}

function configurarAbasAluno(aluno) {
    const botoesAbas = document.querySelectorAll('.aba-btn');
    
    botoesAbas.forEach(botao => {
        botao.addEventListener('click', function() {
            // Remover classe active de todos os botões
            botoesAbas.forEach(b => b.classList.remove('active'));
            // Adicionar classe active ao botão clicado
            this.classList.add('active');
            
            // Ocultar todas as abas
            document.querySelectorAll('.aba').forEach(aba => {
                aba.classList.remove('active');
            });
            
            // Mostrar aba correspondente
            const abaAlvo = this.dataset.aba;
            const abaElemento = document.getElementById('aba' + abaAlvo.charAt(0).toUpperCase() + abaAlvo.slice(1));
            if (abaElemento) {
                abaElemento.classList.add('active');
                
                // Verificar se é a aba de notas e aluno tem dívida
                if (abaAlvo === 'notas' && aluno.divida > 0) {
                    document.getElementById('avisoDivida').style.display = 'block';
                    document.getElementById('containerNotas').style.display = 'none';
                } else if (abaAlvo === 'notas') {
                    document.getElementById('avisoDivida').style.display = 'none';
                    document.getElementById('containerNotas').style.display = 'block';
                }
            }
        });
    });
}

async function carregarNotasAluno(numeroAluno) {
    try {
        const notasSnap = await db.collection('notas')
            .where('numeroAluno', '==', numeroAluno)
            .orderBy('disciplina')
            .orderBy('trimestre')
            .get();
        
        const tbody = document.querySelector('#tabelaNotas tbody');
        tbody.innerHTML = '';
        
        const notasPorDisciplina = {};
        
        // Organizar notas por disciplina e trimestre
        notasSnap.forEach(doc => {
            const nota = doc.data();
            const disciplina = nota.disciplina;
            const trimestre = nota.trimestre;
            
            if (!notasPorDisciplina[disciplina]) {
                notasPorDisciplina[disciplina] = {
                    1: { teste1: '-', teste2: '-', trabalho: '-', final: '-' },
                    2: { teste1: '-', teste2: '-', trabalho: '-', final: '-' },
                    3: { teste1: '-', teste2: '-', trabalho: '-', final: '-' }
                };
            }
            
            if (notasPorDisciplina[disciplina][trimestre]) {
                notasPorDisciplina[disciplina][trimestre][nota.tipo] = nota.nota;
            }
        });
        
        // Calcular médias e preencher tabela
        let somaTotal = 0;
        let contadorDisciplinas = 0;
        
        for (const [disciplina, trimestres] of Object.entries(notasPorDisciplina)) {
            for (const [trimestreNum, notas] of Object.entries(trimestres)) {
                const media = calcularMedia(notas);
                
                // Adicionar à tabela
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${disciplina}</td>
                    <td>${trimestreNum}º</td>
                    <td>${notas.teste1}</td>
                    <td>${notas.teste2}</td>
                    <td>${notas.trabalho}</td>
                    <td>${notas.final}</td>
                    <td><strong>${media}</strong></td>
                `;
                tbody.appendChild(tr);
                
                // Acumular para média final
                if (media > 0) {
                    somaTotal += parseFloat(media);
                    contadorDisciplinas++;
                }
            }
        }
        
        // Calcular e exibir média final
        const mediaFinal = contadorDisciplinas > 0 ? (somaTotal / contadorDisciplinas).toFixed(1) : '-';
        document.getElementById('mediaFinalAluno').textContent = mediaFinal;
        
        // Atualizar status acadêmico
        let statusAcademico = 'Regular';
        let corStatus = 'black';
        
        if (mediaFinal !== '-') {
            if (parseFloat(mediaFinal) >= 10) {
                statusAcademico = 'Aprovado';
                corStatus = 'green';
            } else {
                statusAcademico = 'Reprovado';
                corStatus = 'red';
            }
        }
        
        const statusElemento = document.getElementById('statusAcademicoAluno');
        statusElemento.textContent = statusAcademico;
        statusElemento.style.color = corStatus;
        
        // Atualizar no banco de dados
        await db.collection('alunos').doc(numeroAluno).update({
            statusAcademico: statusAcademico
        });
        
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
    }
}

async function carregarExtratoAluno(numeroAluno) {
    try {
        const extratoSnap = await db.collection('pagamentos')
            .where('numeroAluno', '==', numeroAluno)
            .orderBy('data', 'desc')
            .get();
        
        const lista = document.getElementById('listaExtrato');
        lista.innerHTML = '';
        
        if (extratoSnap.empty) {
            lista.innerHTML = '<li class="sem-dados">Nenhum pagamento registrado</li>';
            return;
        }
        
        extratoSnap.forEach(doc => {
            const pagamento = doc.data();
            const li = document.createElement('li');
            li.className = 'extrato-item';
            li.innerHTML = `
                <div class="extrato-data">${formatarData(pagamento.data)}</div>
                <div class="extrato-desc">${pagamento.descricao}</div>
                <div class="extrato-valor">${pagamento.valor} MZN</div>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar extrato:', error);
    }
}

async function carregarDividasAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        if (!aluno) return;
        
        // Atualizar resumo
        document.getElementById('totalDivida').textContent = `${aluno.divida || 0} MZN`;
        
        const statusDivida = aluno.divida > 0 ? 'Em Dívida' : 'Regular';
        const statusElemento = document.getElementById('statusDivida');
        statusElemento.textContent = statusDivida;
        statusElemento.className = aluno.divida > 0 ? 'status-divida negativa' : 'status-divida positiva';
        
        // Carregar lista de dívidas
        const dividasSnap = await db.collection('dividas')
            .where('numeroAluno', '==', numeroAluno)
            .orderBy('data', 'desc')
            .get();
        
        const lista = document.getElementById('listaDividas');
        lista.innerHTML = '';
        
        if (dividasSnap.empty) {
            lista.innerHTML = '<li class="sem-dados">Nenhuma dívida registrada</li>';
            return;
        }
        
        dividasSnap.forEach(doc => {
            const divida = doc.data();
            const li = document.createElement('li');
            li.className = 'divida-item';
            li.innerHTML = `
                <div class="divida-data">${formatarData(divida.data)}</div>
                <div class="divida-desc">${divida.descricao}</div>
                <div class="divida-valor">${divida.valor} MZN</div>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar dívidas:', error);
    }
}

// ===== PAINEL DO ADMINISTRADOR =====
async function carregarPainelAdmin() {
    try {
        // Carregar lista de alunos
        await carregarAlunosAdmin();
        
        // Carregar calendário
        await carregarCalendarioAdmin();
        
        // Configurar formulários do admin
        configurarFormulariosAdmin();
        
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
        const selects = ['notaAluno', 'dividaAluno', 'pagamentoAluno'];
        selects.forEach(id => {
            const select = document.getElementById(id);
            select.innerHTML = '<option value="">Selecione o aluno</option>';
        });
        
        if (alunosSnap.empty) {
            tbody.innerHTML = '<tr><td colspan="7">Nenhum aluno cadastrado</td></tr>';
            return;
        }
        
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
                <td>
                    <span class="status-badge ${aluno.ativo ? 'ativo' : 'inativo'}">
                        ${aluno.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>${aluno.divida || 0} MZN</td>
                <td>
                    <div class="acoes-admin">
                        <button onclick="verDetalhesAluno('${numeroAluno}')" class="btn-acao ver">👁️ Ver</button>
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
            selects.forEach(id => {
                const select = document.getElementById(id);
                const option = document.createElement('option');
                option.value = numeroAluno;
                option.textContent = `${aluno.nome} - ${numeroAluno}`;
                select.appendChild(option);
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        mostrarAlerta('Erro', 'Não foi possível carregar a lista de alunos', 'erro');
    }
}

function buscarAluno() {
    const termo = document.getElementById('buscaAluno').value.trim().toLowerCase();
    
    if (!termo) {
        carregarAlunosAdmin();
        return;
    }
    
    const linhas = document.querySelectorAll('#tabelaAlunos tbody tr');
    let encontrados = 0;
    
    linhas.forEach(linha => {
        const textoLinha = linha.textContent.toLowerCase();
        if (textoLinha.includes(termo)) {
            linha.style.display = '';
            encontrados++;
        } else {
            linha.style.display = 'none';
        }
    });
    
    if (encontrados === 0) {
        mostrarAlerta('Busca', 'Nenhum aluno encontrado', 'info');
    }
}

function limparBusca() {
    document.getElementById('buscaAluno').value = '';
    carregarAlunosAdmin();
}

function configurarFormulariosAdmin() {
    // Formulário de Lançar Notas
    document.getElementById('formNota').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const aluno = document.getElementById('notaAluno').value;
        const disciplina = document.getElementById('notaDisciplina').value;
        const trimestre = document.getElementById('notaTrimestre').value;
        const tipo = document.getElementById('notaTipo').value;
        const valor = parseFloat(document.getElementById('notaValor').value);
        
        if (!aluno || !disciplina) {
            mostrarAlerta('Erro', 'Selecione um aluno e uma disciplina', 'erro');
            return;
        }
        
        try {
            const notaData = {
                numeroAluno: aluno,
                disciplina: disciplina,
                trimestre: parseInt(trimestre),
                tipo: tipo,
                nota: valor,
                data: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('notas').add(notaData);
            
            mostrarAlerta('Sucesso', 'Nota lançada com sucesso!', 'sucesso');
            this.reset();
            
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
    
    // Formulário de Dívidas
    document.getElementById('formDivida').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const aluno = document.getElementById('dividaAluno').value;
        const valor = parseFloat(document.getElementById('dividaValor').value);
        const descricao = document.getElementById('dividaDescricao').value;
        
        if (!aluno || !valor || !descricao) {
            mostrarAlerta('Erro', 'Preencha todos os campos', 'erro');
            return;
        }
        
        try {
            // Registrar dívida no histórico
            await db.collection('dividas').add({
                numeroAluno: aluno,
                valor: valor,
                descricao: descricao,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Atualizar dívida total do aluno
            const alunoDoc = await db.collection('alunos').doc(aluno).get();
            const dividaAtual = alunoDoc.data().divida || 0;
            const novaDivida = dividaAtual + valor;
            
            await db.collection('alunos').doc(aluno).update({
                divida: novaDivida
            });
            
            mostrarAlerta('Sucesso', `Dívida de ${valor} MZN registrada para o aluno`, 'sucesso');
            this.reset();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível registrar a dívida', 'erro');
        }
    });
    
    // Formulário de Pagamentos
    document.getElementById('formPagamento').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const aluno = document.getElementById('pagamentoAluno').value;
        const valor = parseFloat(document.getElementById('pagamentoValor').value);
        const mes = document.getElementById('pagamentoMes').value;
        
        if (!aluno || !valor || !mes) {
            mostrarAlerta('Erro', 'Preencha todos os campos', 'erro');
            return;
        }
        
        try {
            // Registrar pagamento
            await db.collection('pagamentos').add({
                numeroAluno: aluno,
                valor: valor,
                descricao: `Pagamento - ${mes}`,
                data: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Reduzir dívida do aluno
            const alunoDoc = await db.collection('alunos').doc(aluno).get();
            const dividaAtual = alunoDoc.data().divida || 0;
            const novaDivida = Math.max(0, dividaAtual - valor);
            
            await db.collection('alunos').doc(aluno).update({
                divida: novaDivida
            });
            
            mostrarAlerta('Sucesso', `Pagamento de ${valor} MZN registrado`, 'sucesso');
            this.reset();
            carregarAlunosAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível registrar o pagamento', 'erro');
        }
    });
    
    // Formulário de Eventos
    document.getElementById('formEvento').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = document.getElementById('eventoData').value;
        const descricao = document.getElementById('eventoDesc').value;
        
        if (!data || !descricao) {
            mostrarAlerta('Erro', 'Preencha todos os campos', 'erro');
            return;
        }
        
        try {
            await db.collection('calendario').add({
                data: data,
                evento: descricao,
                criadoEm: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            mostrarAlerta('Sucesso', 'Evento adicionado ao calendário', 'sucesso');
            this.reset();
            carregarCalendarioAdmin();
            
        } catch (error) {
            mostrarAlerta('Erro', 'Não foi possível adicionar o evento', 'erro');
        }
    });
}

async function carregarCalendarioAdmin() {
    try {
        const calendarioSnap = await db.collection('calendario')
            .orderBy('data')
            .get();
        
        const lista = document.getElementById('adminCalendario');
        lista.innerHTML = '';
        
        if (calendarioSnap.empty) {
            lista.innerHTML = '<li>Nenhum evento no calendário</li>';
            return;
        }
        
        calendarioSnap.forEach(doc => {
            const evento = doc.data();
            const li = document.createElement('li');
            li.className = 'evento-item';
            li.innerHTML = `
                <strong>${formatarData(evento.data)}</strong>
                <span>${evento.evento}</span>
                <button onclick="removerEvento('${doc.id}')" class="btn-remover">Remover</button>
            `;
            lista.appendChild(li);
        });
        
    } catch (error) {
        console.error('Erro ao carregar calendário:', error);
    }
     }

// ===== FUNÇÕES DO ADMINISTRADOR =====
async function verDetalhesAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        if (!aluno) {
            mostrarAlerta('Erro', 'Aluno não encontrado', 'erro');
            return;
        }
        
        let mensagem = `
            Nome: ${aluno.nome} ${aluno.apelido}
            Número: ${aluno.numeroAluno}
            Classe: ${aluno.classe}ª
            Turma: ${aluno.turma}
            Curso: ${aluno.curso}
            Email: ${aluno.email}
            Telefone: ${aluno.telefone}
            Status: ${aluno.ativo ? 'Ativo' : 'Inativo'}
            Dívida: ${aluno.divida || 0} MZN
            Disciplinas: ${aluno.disciplinas?.join(', ') || 'Nenhuma'}
        `;
        
        mostrarAlerta('Detalhes do Aluno', mensagem, 'info');
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível carregar detalhes do aluno', 'erro');
    }
}

async function editarAluno(numeroAluno) {
    try {
        const alunoDoc = await db.collection('alunos').doc(numeroAluno).get();
        const aluno = alunoDoc.data();
        
        if (!aluno) {
            mostrarAlerta('Erro', 'Aluno não encontrado', 'erro');
            return;
        }
        
        const novoNome = prompt('Novo nome:', aluno.nome);
        const novoEmail = prompt('Novo email:', aluno.email);
        const novoTelefone = prompt('Novo telefone:', aluno.telefone);
        
        if (novoNome && novoEmail && novoTelefone) {
            await db.collection('alunos').doc(numeroAluno).update({
                nome: novoNome,
                email: novoEmail,
                telefone: novoTelefone
            });
            
            mostrarAlerta('Sucesso', 'Aluno atualizado com sucesso!', 'sucesso');
            carregarAlunosAdmin();
        }
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível editar o aluno', 'erro');
    }
}

async function suspenderAluno(numeroAluno, atualmenteAtivo) {
    try {
        await db.collection('alunos').doc(numeroAluno).update({
            ativo: !atualmenteAtivo
        });
        
        const acao = atualmenteAtivo ? 'suspenso' : 'ativado';
        mostrarAlerta('Sucesso', `Aluno ${acao} com sucesso!`, 'sucesso');
        carregarAlunosAdmin();
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível alterar o status do aluno', 'erro');
    }
}

async function excluirAluno(numeroAluno) {
    if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        await db.collection('alunos').doc(numeroAluno).delete();
        mostrarAlerta('Sucesso', 'Aluno excluído com sucesso!', 'sucesso');
        carregarAlunosAdmin();
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível excluir o aluno', 'erro');
    }
}

async function removerEvento(idEvento) {
    try {
        await db.collection('calendario').doc(idEvento).delete();
        carregarCalendarioAdmin();
        mostrarAlerta('Sucesso', 'Evento removido do calendário', 'sucesso');
        
    } catch (error) {
        mostrarAlerta('Erro', 'Não foi possível remover o evento', 'erro');
    }
}

function atualizarTabelaAlunos() {
    carregarAlunosAdmin();
    mostrarAlerta('Atualizado', 'Lista de alunos atualizada', 'info');
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se há aluno logado
    const alunoSalvo = localStorage.getItem('alunoData');
    if (alunoSalvo) {
        alunoLogado = JSON.parse(alunoSalvo);
        mostrarPainelAluno(alunoLogado);
    } else {
        mostrarPagina('home');
    }
    
    // Adicionar efeito de digitação no título
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

// ===== INICIALIZAR FORMULÁRIO DE INSCRIÇÃO =====
if (document.getElementById('inscricao')) {
    inicializarFormInscricao();
  }
