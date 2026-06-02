const API_BASE_URL = 'http://localhost:3000/api';

const div_campo_config_periodo = document.querySelector('.campo_config_periodo');
const botao_salvar = document.getElementById('salvar_alteracoes');
const botao_cancelar = document.getElementById('cancelar_edicao');
const botoes_confirmar = document.querySelector('.botoes');

let ppcData = {
    id: '',
    name: '',
    nature: '',
    total_periods: 0,
    periods: []
};

async function validarAutenticacao() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

function obterPPCIdDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || localStorage.getItem('ppc_edit_id');
}

async function carregarPPC(ppcId) {
    try {
        const token = localStorage.getItem('auth_token');

        const resposta = await fetch(`${API_BASE_URL}/ppc/${ppcId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('PPC nao encontrado');
        }

        return await resposta.json();
    } catch (erro) {
        console.error('Erro ao carregar PPC:', erro);
        alert('Erro ao carregar PPC. Redirecionando...');
        window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
    }
}

function preencherInformacoesCurso(ppc) {
    document.getElementById('info_nome_curso').innerText = ppc.name;
    document.getElementById('info_natureza').innerText = ppc.nature;
    document.getElementById('info_periodos').innerText = ppc.total_periods;
}

function obterNomesPrerequisitos(prerequisitos) {
    return (prerequisitos || []).map(prerequisito => prerequisito.name || prerequisito);
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

function lerPrerequisitosSelecionados(linha, campoPrerequisito) {
    if (campoPrerequisito) {
        return Array.from(campoPrerequisito.selectedOptions).map(option => option.value);
    }

    try {
        return JSON.parse(linha.dataset.prerequisitosSelecionados || '[]');
    } catch (erro) {
        return [];
    }
}

function atualizarOpcoesPrerequisito(linha, numeroPeriodo) {
    const botaoRemover = linha.querySelector('.botao_remover_disciplina');
    let campoPrerequisito = linha.querySelector('.escolha_prerequisito');
    const disciplinasAnteriores = coletarDisciplinasAnteriores(numeroPeriodo);
    const selecionados = lerPrerequisitosSelecionados(linha, campoPrerequisito);

    linha.dataset.prerequisitosSelecionados = JSON.stringify(selecionados);

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

function preencherPeriodosEDisciplinas(ppc) {
    const periodosExistentes = div_campo_config_periodo.querySelectorAll('.periodo_container');
    periodosExistentes.forEach(p => p.remove());

    ppcData = { ...ppc };

    ppc.periods.filter(periodo => periodo.period_number !== 0).forEach(periodo => {
        const divPeriodo = document.createElement('div');
        divPeriodo.className = 'periodo_container';
        divPeriodo.id = `periodo_${periodo.period_number}`;

        const nomePeriodo = document.createElement('h3');
        nomePeriodo.innerText = `${periodo.period_number}º Período`;
        divPeriodo.appendChild(nomePeriodo);

        const containerDisciplinas = document.createElement('div');
        containerDisciplinas.className = 'disciplinas_container';
        containerDisciplinas.id = `disciplinas_periodo_${periodo.period_number}`;

        periodo.disciplines.forEach(disciplina => {
            adicionarCampoDisciplinaExistente(containerDisciplinas, periodo.period_number, disciplina);
        });

        divPeriodo.appendChild(containerDisciplinas);

        const btnAdicionarDisciplina = document.createElement('button');
        btnAdicionarDisciplina.type = 'button';
        btnAdicionarDisciplina.className = 'botao_adicionar_disciplina';
        btnAdicionarDisciplina.innerText = '+ ADICIONAR DISCIPLINA';
        btnAdicionarDisciplina.addEventListener('click', () => {
            adicionarCampoDisciplina(containerDisciplinas, periodo.period_number);
            atualizarTodosPrerequisitos();
        });

        divPeriodo.appendChild(btnAdicionarDisciplina);
        div_campo_config_periodo.insertBefore(divPeriodo, botoes_confirmar);
    });

    preencherOptativas(ppc);
    atualizarTodosPrerequisitos();
}

// Alteracao PPC: permite editar as optativas no bloco especial period_number 0.
function preencherOptativas(ppc) {
    const periodoOptativas = ppc.periods.find(periodo => periodo.period_number === 0);

    const divPeriodo = document.createElement('div');
    divPeriodo.className = 'periodo_container';
    divPeriodo.id = 'periodo_0';

    const nomePeriodo = document.createElement('h3');
    nomePeriodo.innerText = 'Optativas';
    divPeriodo.appendChild(nomePeriodo);

    const containerDisciplinas = document.createElement('div');
    containerDisciplinas.className = 'disciplinas_container';
    containerDisciplinas.id = 'disciplinas_periodo_0';

    if (periodoOptativas && periodoOptativas.disciplines.length > 0) {
        periodoOptativas.disciplines.forEach(disciplina => {
            adicionarCampoDisciplinaExistente(containerDisciplinas, 0, disciplina);
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
    div_campo_config_periodo.insertBefore(divPeriodo, botoes_confirmar);
}

function adicionarCampoDisciplinaExistente(containerDisciplinas, numeroPeriodo, disciplina) {
    const divLinhaPeriodo = document.createElement('div');
    divLinhaPeriodo.className = 'div_linha_periodo';
    divLinhaPeriodo.dataset.disciplinaId = disciplina.id;
    divLinhaPeriodo.dataset.prerequisitosSelecionados = JSON.stringify(obterNomesPrerequisitos(disciplina.prerequisites));

    const campoDisciplina = document.createElement('input');
    campoDisciplina.type = 'text';
    campoDisciplina.className = 'escolha_disciplina';
    campoDisciplina.placeholder = 'Nome da disciplina';
    campoDisciplina.value = disciplina.name;
    campoDisciplina.addEventListener('input', atualizarTodosPrerequisitos);

    const campoHoras = document.createElement('input');
    campoHoras.type = 'number';
    campoHoras.className = 'escolha_qtd_horas';
    campoHoras.placeholder = 'Horas';
    campoHoras.min = '1';
    campoHoras.value = disciplina.hours;
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

function adicionarCampoDisciplina(containerDisciplinas, numeroPeriodo) {
    const divLinhaPeriodo = document.createElement('div');
    divLinhaPeriodo.className = 'div_linha_periodo';
    divLinhaPeriodo.dataset.prerequisitosSelecionados = '[]';

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

botao_salvar.addEventListener('click', async (evento) => {
    evento.preventDefault();

    coletarDadosPeriodosAtualizado();

    let totalDisciplinas = 0;
    ppcData.periods.forEach(p => totalDisciplinas += p.disciplines.length);

    if (totalDisciplinas === 0) {
        alert('Por favor, adicione pelo menos uma disciplina');
        return;
    }

    try {
        const token = localStorage.getItem('auth_token');

        const response = await fetch(`${API_BASE_URL}/ppc/${ppcData.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ppcData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao atualizar PPC');
        }

        alert('PPC atualizado com sucesso!');
        window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
    } catch (error) {
        console.error('Erro:', error);
        alert(`Erro ao atualizar PPC: ${error.message}`);
    }
});

botao_cancelar.addEventListener('click', () => {
    window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
});

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

function coletarDadosPeriodosAtualizado() {
    ppcData.periods = [];

    for (let i = 1; i <= ppcData.total_periods; i++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${i}`);
        if (!containerDisciplinas) continue;

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

document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await validarAutenticacao();
    if (!autenticado) return;

    const ppcId = obterPPCIdDaURL();
    if (!ppcId) {
        alert('Nenhum PPC selecionado para edição');
        window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
        return;
    }

    const ppc = await carregarPPC(ppcId);
    if (ppc) {
        preencherInformacoesCurso(ppc);
        preencherPeriodosEDisciplinas(ppc);
    }
});
