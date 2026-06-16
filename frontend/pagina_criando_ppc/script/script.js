const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://api-gerador-ppcs.onrender.com/api';

const div_campo_config_curso = document.querySelector('.campo_config_curso');
const div_campo_config_periodo = document.querySelector('.campo_config_periodo');
const tipo_curso = document.getElementById('escolha_formacao');
const nome_curso = document.getElementById('escolha_curso');
const escolha_qtd_periodos = document.getElementById('escolha_tempo');
const botao_prox_etapa = document.getElementById('botao_prox_etapa1');
const botao_confirmar = document.getElementById('confirmar_ppc');
const botao_voltar = document.getElementById('voltar_etapa1');
const botoes_confirmar_vizuPDF = document.querySelector('.botoes');
let periodosRenderizados = false;

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

    validarFaixaQuantidadePeriodos(false);
});

escolha_qtd_periodos.addEventListener('change', () => {
    validarFaixaQuantidadePeriodos(true);
});

function validarFaixaQuantidadePeriodos(exibirAlerta = true) {
    if (!tipo_curso.value || !escolha_qtd_periodos.value) {
        return true;
    }

    const totalPeriodos = Number(escolha_qtd_periodos.value);
    const minimoPeriodos = Number(escolha_qtd_periodos.min);
    const maximoPeriodos = Number(escolha_qtd_periodos.max);

    if (totalPeriodos < minimoPeriodos || totalPeriodos > maximoPeriodos) {
        if (exibirAlerta) {
            alert(`Para ${tipo_curso.value}, informe uma quantidade de períodos entre ${minimoPeriodos} e ${maximoPeriodos}.`);
        }

        escolha_qtd_periodos.value = '';
        escolha_qtd_periodos.focus();
        return false;
    }

    return true;
}

botao_prox_etapa.addEventListener('click', (evento) => {
    evento.preventDefault();

    if (!tipo_curso.value || !nome_curso.value || !escolha_qtd_periodos.value) {
        alert('Por favor, preencha todos os campos da Etapa 1');
        return;
    }

    if (!validarFaixaQuantidadePeriodos(true)) {
        return;
    }

    const novoTotalPeriodos = Number(escolha_qtd_periodos.value);
    const estadoAtualPeriodos = capturarEstadoAtualPeriodos();

    if (periodosRenderizados && novoTotalPeriodos < ppcData.total_periods) {
        const periodosComDados = [];

        for (let i = novoTotalPeriodos + 1; i <= ppcData.total_periods; i++) {
            const disciplinasPeriodo = estadoAtualPeriodos.get(i) || [];
            const possuiDados = disciplinasPeriodo.some(disciplina => disciplina.name || disciplina.hours);

            if (possuiDados) {
                periodosComDados.push(i);
            }
        }

        if (periodosComDados.length > 0) {
            const confirmar = confirm(`Reduzir para ${novoTotalPeriodos} períodos removerá as disciplinas dos períodos: ${periodosComDados.join(', ')}. Deseja continuar?`);

            if (!confirmar) {
                escolha_qtd_periodos.value = ppcData.total_periods;
                return;
            }
        }
    }

    ppcData.name = nome_curso.value;
    ppcData.nature = tipo_curso.value;
    ppcData.total_periods = novoTotalPeriodos;
    ppcData.periods = [];
    disciplinesMap.clear();

    div_campo_config_periodo.style.display = 'flex';

    gerarCamposPeriodos(estadoAtualPeriodos);
    periodosRenderizados = true;
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

// Cria um select múltiplo para escolher os pré-requisitos.
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

// Atualiza todos os selects quando disciplinas anteriores são editadas ou removidas.
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

function capturarEstadoAtualPeriodos() {
    const estadoPeriodos = new Map();

    if (!periodosRenderizados) {
        return estadoPeriodos;
    }

    for (let i = 1; i <= ppcData.total_periods; i++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${i}`);
        if (!containerDisciplinas) continue;

        estadoPeriodos.set(i, capturarDisciplinasVisiveis(containerDisciplinas));
    }

    const containerOptativas = document.getElementById('disciplinas_periodo_0');
    if (containerOptativas) {
        estadoPeriodos.set(0, capturarDisciplinasVisiveis(containerOptativas));
    }

    return estadoPeriodos;
}

function capturarDisciplinasVisiveis(containerDisciplinas) {
    const linhas = containerDisciplinas.querySelectorAll('.div_linha_periodo');

    return Array.from(linhas).map(linha => {
        const campoPrerequisito = linha.querySelector('.escolha_prerequisito');

        return {
            name: linha.querySelector('.escolha_disciplina').value,
            hours: linha.querySelector('.escolha_qtd_horas').value,
            prerequisites: campoPrerequisito
                ? Array.from(campoPrerequisito.selectedOptions).map(option => option.value)
                : []
        };
    });
}

function gerarCamposPeriodos(estadoAtualPeriodos = new Map()) {
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

        const disciplinasSalvas = estadoAtualPeriodos.get(numeroPeriodo) || [];

        if (disciplinasSalvas.length > 0) {
            disciplinasSalvas.forEach(disciplina => {
                adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo, disciplina);
            });
        } else {
            for (let j = 0; j < 3; j++) {
                adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo);
            }
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

    gerarCampoOptativas(estadoAtualPeriodos);
    atualizarTodosPrerequisitos();
}

function sincronizarDadosCursoEditaveis() {
    ppcData.name = nome_curso.value.trim();
    ppcData.nature = tipo_curso.value;
}

// Cria campo optativas como opcional.
function gerarCampoOptativas(estadoAtualPeriodos = new Map()) {
    const divPeriodo = document.createElement('div');
    divPeriodo.className = 'periodo_container';
    divPeriodo.id = 'periodo_0';

    const nomePeriodo = document.createElement('h3');
    nomePeriodo.innerText = 'Optativas';
    divPeriodo.appendChild(nomePeriodo);

    const containerDisciplinas = document.createElement('div');
    containerDisciplinas.className = 'disciplinas_container';
    containerDisciplinas.id = 'disciplinas_periodo_0';

    const optativasSalvas = estadoAtualPeriodos.get(0) || [];

    if (optativasSalvas.length > 0) {
        optativasSalvas.forEach(disciplina => {
            adicionarCampoDisciplina(containerDisciplinas, 0, disciplina);
        });
    } else {
        adicionarCampoDisciplina(containerDisciplinas, 0);
    }

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

function adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo, disciplina = null) {
    const divLinhaPeriodo = document.createElement('div');
    divLinhaPeriodo.className = 'div_linha_periodo';

    const campoDisciplina = document.createElement('input');
    campoDisciplina.type = 'text';
    campoDisciplina.className = 'escolha_disciplina';
    campoDisciplina.placeholder = 'Nome da disciplina';
    campoDisciplina.value = disciplina?.name || '';
    campoDisciplina.addEventListener('input', atualizarTodosPrerequisitos);

    const campoHoras = document.createElement('input');
    campoHoras.type = 'number';
    campoHoras.className = 'escolha_qtd_horas';
    campoHoras.placeholder = 'Horas';
    campoHoras.min = '1';
    campoHoras.value = disciplina?.hours || '';
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

    if (disciplina?.prerequisites?.length) {
        const campoPrerequisito = divLinhaPeriodo.querySelector('.escolha_prerequisito');
        if (campoPrerequisito) {
            Array.from(campoPrerequisito.options).forEach(option => {
                option.selected = disciplina.prerequisites.includes(option.value);
            });
            atualizarTextoContagemPrerequisito(campoPrerequisito);
        }
    }
}

// Envia o PPC completo para o backend ao clicar, incluindo periodos, optativas e pré-requisitos.
botao_confirmar.addEventListener('click', async (evento) => {
    evento.preventDefault();

    if (!periodosRenderizados) {
        alert('Clique em PRÓXIMA ETAPA para gerar os períodos antes de confirmar.');
        return;
    }

    if (!tipo_curso.value || !nome_curso.value.trim() || !escolha_qtd_periodos.value) {
        alert('Por favor, preencha todos os campos da Etapa 1');
        return;
    }

    if (Number(escolha_qtd_periodos.value) !== ppcData.total_periods) {
        alert('A quantidade de períodos foi alterada. Clique em PRÓXIMA ETAPA novamente para atualizar os períodos.');
        escolha_qtd_periodos.focus();
        return;
    }

    sincronizarDadosCursoEditaveis();

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

// Valida todas as linhas visíveis antes do envio; campos não usados devem ser removidos.
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

// Toda linha existente e obrigatória, para evitar que o usuário deixe algum campo em branco.
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
