const API_BASE_URL = 'http://localhost:3000/api';

const div_campo_config_curso = document.querySelector('.campo_config_curso');
const div_campo_config_periodo = document.querySelector('.campo_config_periodo');
const tipo_curso = document.getElementById('escolha_formacao');
const nome_curso = document.getElementById('escolha_curso');
const escolha_qtd_periodos = document.getElementById('escolha_tempo');
const botao_prox_etapa = document.getElementById('botao_prox_etapa1');
const botao_confirmar = document.getElementById('confirmar_ppc');
const botao_voltar = document.getElementById('voltar_etapa1');
const botoes_confirmar_vizuPDF = document.querySelector('.botoes');

let ppcData = {
    name: '',
    nature: '',
    total_periods: 0,
    periods: []
};

let disciplinesMap = new Map();

async function validarAutenticacao() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
        window.location.href = '../index.html';
        return false;
    }

    try {
        const resposta = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            localStorage.removeItem('auth_token');
            window.location.href = '../index.html';
            return false;
        }

        return true;
    } catch (erro) {
        console.error('Erro ao validar autenticacao:', erro);
        localStorage.removeItem('auth_token');
        window.location.href = '../index.html';
        return false;
    }
}

escolha_qtd_periodos.disabled = true;

tipo_curso.addEventListener('change', () => {
    escolha_qtd_periodos.disabled = false;

    if (tipo_curso.value === 'bacharelado') {
        escolha_qtd_periodos.min = '8';
        escolha_qtd_periodos.max = '12';
    } else if (tipo_curso.value === 'tecnologo') {
        escolha_qtd_periodos.min = '5';
        escolha_qtd_periodos.max = '8';
    } else if (tipo_curso.value === 'licenciatura') {
        escolha_qtd_periodos.min = '8';
        escolha_qtd_periodos.max = '10';
    }
});

botao_prox_etapa.addEventListener('click', (evento) => {
    evento.preventDefault();

    if (!tipo_curso.value || !nome_curso.value || !escolha_qtd_periodos.value) {
        alert('Por favor, preencha todos os campos da Etapa 1');
        return;
    }

    ppcData.name = nome_curso.value;
    ppcData.nature = tipo_curso.value;
    ppcData.total_periods = Number(escolha_qtd_periodos.value);
    ppcData.periods = [];
    disciplinesMap.clear();

    div_campo_config_curso.style.display = 'none';
    div_campo_config_periodo.style.display = 'flex';

    gerarCamposPeriodos();
});

if (botao_voltar) {
    botao_voltar.addEventListener('click', () => {
        div_campo_config_periodo.style.display = 'none';
        div_campo_config_curso.style.display = 'flex';
    });
}

function coletarDisciplinasAnteriores(numeroPeriodo) {
    const disciplinas = [];
    const periodoFinal = numeroPeriodo === 0 ? ppcData.total_periods : numeroPeriodo - 1;

    for (let p = 1; p <= periodoFinal; p++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${p}`);
        if (!containerDisciplinas) continue;

        const linhas = containerDisciplinas.querySelectorAll('.div_linha_periodo');
        linhas.forEach(linha => {
            const nomeDisciplina = linha.querySelector('.escolha_disciplina').value.trim();
            const horas = linha.querySelector('.escolha_qtd_horas').value;

            if (nomeDisciplina && horas) {
                disciplinas.push({
                    period_number: p,
                    name: nomeDisciplina
                });
            }
        });
    }

    return disciplinas;
}

// Alteracao PPC: cria um select multiplo com texto amigavel de contagem de pre-requisitos.
function criarCampoPrerequisito() {
    const wrapperPrerequisito = document.createElement('div');
    wrapperPrerequisito.className = 'wrapper_prerequisito';

    const campoPrerequisito = document.createElement('select');
    campoPrerequisito.className = 'escolha_prerequisito';
    campoPrerequisito.multiple = true;
    campoPrerequisito.size = 1;
    campoPrerequisito.title = 'Segure Ctrl para selecionar mais de um prerequisito';

    const textoContagem = document.createElement('span');
    textoContagem.className = 'texto_contagem_prerequisito';

    wrapperPrerequisito.appendChild(campoPrerequisito);
    wrapperPrerequisito.appendChild(textoContagem);
    campoPrerequisito.wrapperPrerequisito = wrapperPrerequisito;
    campoPrerequisito.addEventListener('change', () => atualizarTextoContagemPrerequisito(campoPrerequisito));
    atualizarTextoContagemPrerequisito(campoPrerequisito);

    return campoPrerequisito;
}

function removerCampoPrerequisito(campoPrerequisito) {
    const wrapperPrerequisito = campoPrerequisito.closest('.wrapper_prerequisito');
    if (wrapperPrerequisito) {
        wrapperPrerequisito.remove();
    } else {
        campoPrerequisito.remove();
    }
}

function inserirCampoPrerequisito(linha, botaoRemover) {
    const campoPrerequisito = criarCampoPrerequisito();
    linha.insertBefore(campoPrerequisito.wrapperPrerequisito, botaoRemover);
    return campoPrerequisito;
}

function atualizarTextoContagemPrerequisito(campoPrerequisito) {
    const totalSelecionados = Array.from(campoPrerequisito.selectedOptions).length;
    const textoContagem = campoPrerequisito.closest('.wrapper_prerequisito')?.querySelector('.texto_contagem_prerequisito');
    const texto = totalSelecionados === 1
        ? '1 pr\u00e9-requisito selecionado'
        : `${totalSelecionados} pr\u00e9-requisitos selecionados`;

    if (textoContagem) {
        textoContagem.innerText = texto;
    }

    campoPrerequisito.title = `${texto}. Segure Ctrl para selecionar mais de um pr\u00e9-requisito`;
}

function atualizarOpcoesPrerequisito(linha, numeroPeriodo) {
    const botaoRemover = linha.querySelector('.botao_remover_disciplina');
    let campoPrerequisito = linha.querySelector('.escolha_prerequisito');
    const disciplinasAnteriores = coletarDisciplinasAnteriores(numeroPeriodo);

    if ((numeroPeriodo === 1 || disciplinasAnteriores.length === 0) && numeroPeriodo !== 0) {
        if (campoPrerequisito) removerCampoPrerequisito(campoPrerequisito);
        return;
    }

    if (numeroPeriodo === 0 && disciplinasAnteriores.length === 0) {
        if (campoPrerequisito) removerCampoPrerequisito(campoPrerequisito);
        return;
    }

    if (!campoPrerequisito) {
        campoPrerequisito = inserirCampoPrerequisito(linha, botaoRemover);
    }

    const selecionados = Array.from(campoPrerequisito.selectedOptions).map(option => option.value);
    campoPrerequisito.innerHTML = '';

    const periodoFinal = numeroPeriodo === 0 ? ppcData.total_periods : numeroPeriodo - 1;
    for (let p = 1; p <= periodoFinal; p++) {
        const disciplinasDoPeriodo = disciplinasAnteriores.filter(disc => disc.period_number === p);
        if (disciplinasDoPeriodo.length === 0) continue;

        const optgroup = document.createElement('optgroup');
        optgroup.label = `${p}º Período`;

        disciplinasDoPeriodo.forEach(disc => {
            const option = document.createElement('option');
            option.value = disc.name;
            option.innerText = disc.name;
            option.selected = selecionados.includes(disc.name);
            optgroup.appendChild(option);
        });

        campoPrerequisito.appendChild(optgroup);
    }

    atualizarTextoContagemPrerequisito(campoPrerequisito);
}

// Alteracao PPC: atualiza todos os selects quando disciplinas anteriores sao editadas ou removidas.
function atualizarTodosPrerequisitos() {
    for (let i = 1; i <= ppcData.total_periods; i++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${i}`);
        if (!containerDisciplinas) continue;

        const linhas = containerDisciplinas.querySelectorAll('.div_linha_periodo');
        linhas.forEach(linha => atualizarOpcoesPrerequisito(linha, i));
    }

    const containerOptativas = document.getElementById('disciplinas_periodo_0');
    if (containerOptativas) {
        const linhas = containerOptativas.querySelectorAll('.div_linha_periodo');
        linhas.forEach(linha => atualizarOpcoesPrerequisito(linha, 0));
    }
}

function gerarCamposPeriodos() {
    const periodosExistentes = div_campo_config_periodo.querySelectorAll('.periodo_container');
    periodosExistentes.forEach(p => p.remove());

    for (let i = 0; i < ppcData.total_periods; i++) {
        const numeroPeriodo = i + 1;
        const divPeriodo = document.createElement('div');
        divPeriodo.className = 'periodo_container';
        divPeriodo.id = `periodo_${numeroPeriodo}`;

        const nomePeriodo = document.createElement('h3');
        nomePeriodo.innerText = `${numeroPeriodo}º Período`;
        divPeriodo.appendChild(nomePeriodo);

        const containerDisciplinas = document.createElement('div');
        containerDisciplinas.className = 'disciplinas_container';
        containerDisciplinas.id = `disciplinas_periodo_${numeroPeriodo}`;

        for (let j = 0; j < 3; j++) {
            adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo);
        }

        divPeriodo.appendChild(containerDisciplinas);

        const btnAdicionarDisciplina = document.createElement('button');
        btnAdicionarDisciplina.type = 'button';
        btnAdicionarDisciplina.className = 'botao_adicionar_disciplina';
        btnAdicionarDisciplina.innerText = '+ ADICIONAR DISCIPLINA';
        btnAdicionarDisciplina.addEventListener('click', () => {
            adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo);
            atualizarTodosPrerequisitos();
        });

        divPeriodo.appendChild(btnAdicionarDisciplina);
        div_campo_config_periodo.insertBefore(divPeriodo, botoes_confirmar_vizuPDF);
    }

    gerarCampoOptativas();
}

// Alteracao PPC: optativas ficam em period_number 0 para nao criar novo modelo/tabela no banco.
function gerarCampoOptativas() {
    const divPeriodo = document.createElement('div');
    divPeriodo.className = 'periodo_container';
    divPeriodo.id = 'periodo_0';

    const nomePeriodo = document.createElement('h3');
    nomePeriodo.innerText = 'Optativas';
    divPeriodo.appendChild(nomePeriodo);

    const containerDisciplinas = document.createElement('div');
    containerDisciplinas.className = 'disciplinas_container';
    containerDisciplinas.id = 'disciplinas_periodo_0';

    adicionarCampoDisciplina(containerDisciplinas, 0);
    divPeriodo.appendChild(containerDisciplinas);

    const btnAdicionarDisciplina = document.createElement('button');
    btnAdicionarDisciplina.type = 'button';
    btnAdicionarDisciplina.className = 'botao_adicionar_disciplina';
    btnAdicionarDisciplina.innerText = '+ ADICIONAR OPTATIVA';
    btnAdicionarDisciplina.addEventListener('click', () => {
        adicionarCampoDisciplina(containerDisciplinas, 0);
        atualizarTodosPrerequisitos();
    });

    divPeriodo.appendChild(btnAdicionarDisciplina);
    div_campo_config_periodo.insertBefore(divPeriodo, botoes_confirmar_vizuPDF);
}

function adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo) {
    const divLinhaPeriodo = document.createElement('div');
    divLinhaPeriodo.className = 'div_linha_periodo';

    const campoDisciplina = document.createElement('input');
    campoDisciplina.type = 'text';
    campoDisciplina.className = 'escolha_disciplina';
    campoDisciplina.placeholder = 'Nome da disciplina';
    campoDisciplina.addEventListener('input', atualizarTodosPrerequisitos);

    const campoHoras = document.createElement('input');
    campoHoras.type = 'number';
    campoHoras.className = 'escolha_qtd_horas';
    campoHoras.placeholder = 'Horas';
    campoHoras.min = '1';
    campoHoras.addEventListener('input', atualizarTodosPrerequisitos);

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'botao_remover_disciplina';
    btnRemover.innerText = 'X';
    btnRemover.addEventListener('click', () => {
        divLinhaPeriodo.remove();
        atualizarTodosPrerequisitos();
    });

    divLinhaPeriodo.appendChild(campoDisciplina);
    divLinhaPeriodo.appendChild(campoHoras);
    divLinhaPeriodo.appendChild(btnRemover);

    containerDisciplinas.appendChild(divLinhaPeriodo);
    atualizarOpcoesPrerequisito(divLinhaPeriodo, numeroPeriodo);
}

// Alteracao PPC: envia o PPC completo para o backend, incluindo periodos, optativas e pre-requisitos.
botao_confirmar.addEventListener('click', async (evento) => {
    evento.preventDefault();

    const validacaoPeriodos = validarPreenchimentoPeriodosObrigatorios();
    if (!validacaoPeriodos.valido) {
        alert(validacaoPeriodos.mensagem);
        if (validacaoPeriodos.campo) {
            validacaoPeriodos.campo.focus();
        }
        return;
    }

    coletarDadosPeriodos();

    let totalDisciplinas = 0;
    ppcData.periods.forEach(p => totalDisciplinas += p.disciplines.length);

    if (totalDisciplinas === 0) {
        alert('Por favor, adicione pelo menos uma disciplina');
        return;
    }

    try {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            localStorage.removeItem('auth_token');
            window.location.href = '../index.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/ppc`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ppcData)
        });

        if (!response.ok) {
            const error = await response.json();
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                alert('Sua sessao expirou. Faca login novamente.');
                window.location.href = '../index.html';
                return;
            }
            throw new Error(error.message || 'Erro ao criar PPC');
        }

        const ppcCriado = await response.json();
        alert('PPC criado com sucesso!');
        localStorage.setItem('ppc_criado_id', ppcCriado.id);
        window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao criar PPC: ${error.message}`);
    }
});

// Alteracao PPC: valida todas as linhas visiveis antes do envio; linhas nao usadas devem ser removidas no X.
function validarPreenchimentoPeriodosObrigatorios() {
    for (let i = 1; i <= ppcData.total_periods; i++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${i}`);
        const validacaoPeriodo = validarContainerDisciplinas(containerDisciplinas, i, true);

        if (!validacaoPeriodo.valido) {
            return validacaoPeriodo;
        }
    }

    const containerOptativas = document.getElementById('disciplinas_periodo_0');
    if (containerOptativas) {
        const validacaoOptativas = validarContainerDisciplinas(containerOptativas, 0, false, true);
        if (!validacaoOptativas.valido) {
            return validacaoOptativas;
        }
    }

    return { valido: true };
}

// Alteracao PPC: toda linha existente e obrigatoria; para nao cadastrar, o usuario remove no X.
function validarContainerDisciplinas(containerDisciplinas, numeroPeriodo, obrigatorio, exigirLinhasExistentes = false) {
    const linhas = containerDisciplinas.querySelectorAll('.div_linha_periodo');
    let possuiDisciplinaCompleta = false;

    for (const linha of linhas) {
        const campoNome = linha.querySelector('.escolha_disciplina');
        const campoHoras = linha.querySelector('.escolha_qtd_horas');
        const nomeDisciplina = campoNome.value.trim();
        const horas = campoHoras.value;
        const preencheuAlgumCampo = Boolean(nomeDisciplina || horas);
        const linhaObrigatoria = obrigatorio || exigirLinhasExistentes || preencheuAlgumCampo;
        const horasInvalidas = horas && Number(horas) <= 0;

        if (horasInvalidas) {
            return {
                valido: false,
                campo: campoHoras,
                mensagem: numeroPeriodo === 0
                    ? 'A carga horaria da optativa deve ser maior que zero.'
                    : `A carga horaria de uma disciplina do ${numeroPeriodo}º periodo deve ser maior que zero.`
            };
        }

        if (linhaObrigatoria && (!nomeDisciplina || !horas)) {
            return {
                valido: false,
                campo: !nomeDisciplina ? campoNome : campoHoras,
                mensagem: numeroPeriodo === 0
                    ? 'Complete nome e carga horaria de todas as optativas ou remova a linha no X.'
                    : `Complete nome e carga horaria de todas as linhas de disciplina do ${numeroPeriodo}º periodo ou remova a linha no X.`
            };
        }

        if (nomeDisciplina && horas) {
            possuiDisciplinaCompleta = true;
        }
    }

    if (obrigatorio && !possuiDisciplinaCompleta) {
        const primeiroCampoNome = containerDisciplinas.querySelector('.escolha_disciplina');
        return {
            valido: false,
            campo: primeiroCampoNome,
            mensagem: `Preencha pelo menos uma disciplina completa no ${numeroPeriodo}º periodo.`
        };
    }

    return { valido: true };
}

function coletarDisciplinasDoContainer(containerDisciplinas) {
    const disciplinas = [];
    const linhas = containerDisciplinas.querySelectorAll('.div_linha_periodo');

    linhas.forEach(linha => {
        const nomeDisciplina = linha.querySelector('.escolha_disciplina').value.trim();
        const horas = linha.querySelector('.escolha_qtd_horas').value;
        const campoPrerequisito = linha.querySelector('.escolha_prerequisito');
        const prerequisitos = campoPrerequisito
            ? Array.from(campoPrerequisito.selectedOptions).map(option => option.value).filter(Boolean)
            : [];

        if (nomeDisciplina && horas) {
            disciplinas.push({
                name: nomeDisciplina,
                hours: Number(horas),
                prerequisites: prerequisitos
            });
        }
    });

    return disciplinas;
}

function coletarDadosPeriodos() {
    ppcData.periods = [];

    for (let i = 1; i <= ppcData.total_periods; i++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${i}`);
        const disciplinas = coletarDisciplinasDoContainer(containerDisciplinas);

        if (disciplinas.length > 0) {
            ppcData.periods.push({
                period_number: i,
                disciplines: disciplinas
            });
        }
    }

    const containerOptativas = document.getElementById('disciplinas_periodo_0');
    if (containerOptativas) {
        const optativas = coletarDisciplinasDoContainer(containerOptativas);

        if (optativas.length > 0) {
            ppcData.periods.push({
                period_number: 0,
                disciplines: optativas
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', validarAutenticacao);
