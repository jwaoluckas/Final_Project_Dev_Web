const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const API_BASE_URL = isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://api-gerador-ppcs.onrender.com/api';

const div_campo_config_periodo = document.querySelector('.campo_config_periodo');
const botao_salvar = document.getElementById('salvar_alteracoes');
const botao_cancelar = document.getElementById('cancelar_edicao');
const botoes_confirmar = document.querySelector('.botoes');
const campo_nome_curso = document.getElementById('info_nome_curso');
const campo_natureza = document.getElementById('info_natureza');
const campo_total_periodos = document.getElementById('info_periodos');

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
    // Campos gerais do curso também ficam editáveis na tela de edição.
    campo_nome_curso.value = ppc.name;
    campo_natureza.value = ppc.nature;
    campo_total_periodos.value = ppc.total_periods;
    atualizarLimitesTotalPeriodos();
}

function atualizarLimitesTotalPeriodos() {
    if (campo_natureza.value === 'bacharelado') {
        campo_total_periodos.min = '8';
        campo_total_periodos.max = '12';
    } else if (campo_natureza.value === 'tecnologo') {
        campo_total_periodos.min = '5';
        campo_total_periodos.max = '8';
    } else if (campo_natureza.value === 'licenciatura') {
        campo_total_periodos.min = '8';
        campo_total_periodos.max = '10';
    }

    validarFaixaTotalPeriodosEditavel(false);
}

function validarFaixaTotalPeriodosEditavel(exibirAlerta = true) {
    if (!campo_natureza.value || !campo_total_periodos.value) {
        return true;
    }

    const totalPeriodos = Number(campo_total_periodos.value);
    const minimoPeriodos = Number(campo_total_periodos.min);
    const maximoPeriodos = Number(campo_total_periodos.max);

    if (totalPeriodos < minimoPeriodos || totalPeriodos > maximoPeriodos) {
        if (exibirAlerta) {
            alert(`Para ${campo_natureza.value}, informe uma quantidade de períodos entre ${minimoPeriodos} e ${maximoPeriodos}.`);
        }

        campo_total_periodos.value = ppcData.total_periods || '';
        campo_total_periodos.focus();
        return false;
    }

    return true;
}

function validarInformacoesCursoEditaveis() {
    const nomeCurso = campo_nome_curso.value.trim();
    const natureza = campo_natureza.value;
    const totalPeriodos = Number(campo_total_periodos.value);
    const minimoPeriodos = Number(campo_total_periodos.min);
    const maximoPeriodos = Number(campo_total_periodos.max);

    if (!nomeCurso || !natureza || !campo_total_periodos.value) {
        alert('Preencha nome, natureza e total de períodos do curso.');
        return false;
    }

    if (!validarFaixaTotalPeriodosEditavel(true)) {
        return false;
    }

    ppcData.name = nomeCurso;
    ppcData.nature = natureza;
    return true;
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

// Cria um select múltiplo com texto de pré-requisitos.
function criarCampoPrerequisito() {
    const wrapperPrerequisito = document.createElement('div');
    wrapperPrerequisito.className = 'wrapper_prerequisito';

    const campoPrerequisito = document.createElement('select');
    campoPrerequisito.className = 'escolha_prerequisito';
    campoPrerequisito.multiple = true;
    campoPrerequisito.title = 'Selecione um ou mais prerequisitos';

    const botaoPrerequisito = document.createElement('button');
    botaoPrerequisito.type = 'button';
    botaoPrerequisito.className = 'botao_prerequisito';

    const textoContagem = document.createElement('span');
    textoContagem.className = 'texto_contagem_prerequisito';

    const iconeDropdown = document.createElement('span');
    iconeDropdown.className = 'icone_prerequisito';
    iconeDropdown.innerText = '▼';

    const painelPrerequisito = document.createElement('div');
    painelPrerequisito.className = 'painel_prerequisito';

    botaoPrerequisito.appendChild(textoContagem);
    botaoPrerequisito.appendChild(iconeDropdown);

    botaoPrerequisito.addEventListener('click', (evento) => {
        evento.preventDefault();
        evento.stopPropagation();

        const expandido = wrapperPrerequisito.classList.contains('expandido');
        document.querySelectorAll('.wrapper_prerequisito.expandido').forEach(wrapper => {
            if (wrapper !== wrapperPrerequisito) {
                wrapper.classList.remove('expandido');
            }
        });

        wrapperPrerequisito.classList.toggle('expandido', !expandido);
    });

    painelPrerequisito.addEventListener('click', (evento) => {
        evento.stopPropagation();
    });

    wrapperPrerequisito.appendChild(campoPrerequisito);
    wrapperPrerequisito.appendChild(botaoPrerequisito);
    wrapperPrerequisito.appendChild(painelPrerequisito);
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

function renderizarPainelPrerequisito(campoPrerequisito, linha) {
    const wrapperPrerequisito = campoPrerequisito.closest('.wrapper_prerequisito');
    const painelPrerequisito = wrapperPrerequisito?.querySelector('.painel_prerequisito');

    if (!painelPrerequisito) {
        return;
    }

    painelPrerequisito.innerHTML = '';
    const grupos = Array.from(campoPrerequisito.querySelectorAll('optgroup'));

    grupos.forEach(grupo => {
        const tituloGrupo = document.createElement('div');
        tituloGrupo.className = 'grupo_prerequisito_titulo';
        tituloGrupo.innerText = grupo.label;
        painelPrerequisito.appendChild(tituloGrupo);

        Array.from(grupo.querySelectorAll('option')).forEach(option => {
            const itemPrerequisito = document.createElement('label');
            itemPrerequisito.className = 'item_prerequisito';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = option.selected;
            checkbox.addEventListener('change', () => {
                option.selected = checkbox.checked;
                linha.dataset.prerequisitosSelecionados = JSON.stringify(
                    Array.from(campoPrerequisito.selectedOptions).map(item => item.value)
                );
                campoPrerequisito.dispatchEvent(new Event('change'));
            });

            const textoItem = document.createElement('span');
            textoItem.innerText = option.innerText;

            itemPrerequisito.appendChild(checkbox);
            itemPrerequisito.appendChild(textoItem);
            painelPrerequisito.appendChild(itemPrerequisito);
        });
    });
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

    renderizarPainelPrerequisito(campoPrerequisito, linha);
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

// Cria períodos vazios quando o total de períodos é aumentado na edição.
function criarPeriodoVazioEditavel(numeroPeriodo) {
    const divPeriodo = document.createElement('div');
    divPeriodo.className = 'periodo_container';
    divPeriodo.id = `periodo_${numeroPeriodo}`;

    const nomePeriodo = document.createElement('h3');
    nomePeriodo.innerText = `${numeroPeriodo}º Período`;
    divPeriodo.appendChild(nomePeriodo);

    const containerDisciplinas = document.createElement('div');
    containerDisciplinas.className = 'disciplinas_container';
    containerDisciplinas.id = `disciplinas_periodo_${numeroPeriodo}`;

    for (let i = 0; i < 3; i++) {
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
    div_campo_config_periodo.insertBefore(divPeriodo, botoes_confirmar);
}

function ajustarPeriodosPeloTotalEditavel(novoTotalPeriodos) {
    const totalAtual = ppcData.total_periods;
    if (novoTotalPeriodos === totalAtual) return true;

    if (novoTotalPeriodos < totalAtual) {
        const periodosRemovidos = [];
        for (let i = novoTotalPeriodos + 1; i <= totalAtual; i++) {
            const container = document.getElementById(`disciplinas_periodo_${i}`);
            const possuiDados = container && Array.from(container.querySelectorAll('.div_linha_periodo')).some(linha => {
                return linha.querySelector('.escolha_disciplina').value.trim() || linha.querySelector('.escolha_qtd_horas').value;
            });
            if (possuiDados) {
                periodosRemovidos.push(i);
            }
        }

        if (periodosRemovidos.length > 0) {
            const confirmar = confirm(`Reduzir para ${novoTotalPeriodos} periodos removera as disciplinas dos periodos: ${periodosRemovidos.join(', ')}. Deseja continuar?`);
            if (!confirmar) {
                campo_total_periodos.value = totalAtual;
                return false;
            }
        }

        for (let i = novoTotalPeriodos + 1; i <= totalAtual; i++) {
            document.getElementById(`periodo_${i}`)?.remove();
        }
    } else {
        for (let i = totalAtual + 1; i <= novoTotalPeriodos; i++) {
            criarPeriodoVazioEditavel(i);
        }
    }

    ppcData.total_periods = novoTotalPeriodos;
    atualizarTodosPrerequisitos();
    return true;
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

// Permite editar as optativas.
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

    if (!validarInformacoesCursoEditaveis()) {
        return;
    }

    if (!ajustarPeriodosPeloTotalEditavel(Number(campo_total_periodos.value))) {
        return;
    }

    const validacaoPeriodos = validarPreenchimentoPeriodosEdicao();
    if (!validacaoPeriodos.valido) {
        alert(validacaoPeriodos.mensagem);
        if (validacaoPeriodos.campo) {
            validacaoPeriodos.campo.focus();
        }
        return;
    }

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

campo_natureza.addEventListener('change', atualizarLimitesTotalPeriodos);

campo_total_periodos.addEventListener('change', () => {
    if (!validarFaixaTotalPeriodosEditavel(true)) {
        return;
    }

    const novoTotalPeriodos = Number(campo_total_periodos.value);
    if (!novoTotalPeriodos) return;
    ajustarPeriodosPeloTotalEditavel(novoTotalPeriodos);
});

// Toda linha visível de campo deve ser preenchida ou removida.
function validarPreenchimentoPeriodosEdicao() {
    for (let i = 1; i <= ppcData.total_periods; i++) {
        const containerDisciplinas = document.getElementById(`disciplinas_periodo_${i}`);
        if (!containerDisciplinas) continue;

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

function validarContainerDisciplinas(containerDisciplinas, numeroPeriodo, obrigatorio, exigirLinhasExistentes = false) {
    const linhas = containerDisciplinas.querySelectorAll('.div_linha_periodo');
    let possuiDisciplinaCompleta = false;

    for (const linha of linhas) {
        const campoNome = linha.querySelector('.escolha_disciplina');
        const campoHoras = linha.querySelector('.escolha_qtd_horas');
        const nomeDisciplina = campoNome.value.trim();
        const horas = campoHoras.value;
        const linhaObrigatoria = obrigatorio || exigirLinhasExistentes || Boolean(nomeDisciplina || horas);
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

document.addEventListener('click', () => {
    document.querySelectorAll('.wrapper_prerequisito.expandido').forEach(wrapper => {
        wrapper.classList.remove('expandido');
    });
});
