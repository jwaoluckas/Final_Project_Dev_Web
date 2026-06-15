// ========== CONFIGURACAO INICIAL ==========
const API_BASE_URL = 'http://localhost:3000/api'; 

const titulo_ppc = document.getElementById('titulo_ppc');
const area_fluxograma = document.getElementById('area_fluxograma');
const area_tabela = document.getElementById('area_tabela');
const btn_download_pdf = document.getElementById('btn_download_pdf');

let ppcData = null;

// ========== VALIDACAO E CARREGAMENTO ==========

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
    return params.get('id') || localStorage.getItem('ppc_view_id');
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

// ========== PREENCHIMENTO DA INTERFACE ==========

function preencherTitulo(ppc) {
    titulo_ppc.innerText = `${ppc.name} - ${ppc.nature.charAt(0).toUpperCase() + ppc.nature.slice(1)}`;
}

// ========== GERACAO DO FLUXOGRAMA VISIVEL ==========

function obterPeriodosRegulares(ppc) {
    return ppc.periods
        .filter(periodo => periodo.period_number !== 0)
        .sort((a, b) => a.period_number - b.period_number);
}

function obterPeriodoOptativas(ppc) {
    return ppc.periods.find(periodo => periodo.period_number === 0);
}

//aceita pre-requisito vindo como objeto ou texto, mantendo compatibilidade com o backend.
function obterNomePrerequisito(prerequisito) {
    return prerequisito && typeof prerequisito === 'object' ? prerequisito.name : prerequisito;
}

function criarBlocoDisciplinaFluxograma(disciplina) {
    const blocoDisciplina = document.createElement('div');
    blocoDisciplina.className = 'bloco_disciplina';

    const nomeDisciplina = document.createElement('p');
    nomeDisciplina.className = 'nome_disciplina';
    nomeDisciplina.innerText = disciplina.name;

    const horasDisciplina = document.createElement('p');
    horasDisciplina.className = 'horas_disciplina';
    horasDisciplina.innerText = `${disciplina.hours || 0}h`;

    blocoDisciplina.appendChild(nomeDisciplina);
    blocoDisciplina.appendChild(horasDisciplina);

    if (disciplina.prerequisites && disciplina.prerequisites.length > 0) {
        const prerequisitos = document.createElement('p');
        prerequisitos.className = 'prerequisitos';
        const nomes = disciplina.prerequisites.map(p => p.name || p).join(', ');
        prerequisitos.innerText = `Pré-req: ${nomes}`;
        blocoDisciplina.appendChild(prerequisitos);
    }

    return blocoDisciplina;
}

function gerarFluxograma(ppc) {
    area_fluxograma.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'fluxograma_container';

    const cabecalho = document.createElement('div');
    cabecalho.className = 'fluxograma_cabecalho';
    cabecalho.innerText = 'FLUXOGRAMA';
    container.appendChild(cabecalho);

    const matriz = document.createElement('div');
    matriz.className = 'fluxograma_matriz';

    obterPeriodosRegulares(ppc).forEach(periodo => {
        const blocoPeriodo = document.createElement('div');
        blocoPeriodo.className = 'bloco_periodo';

        const tituloPeriodo = document.createElement('h3');
        tituloPeriodo.innerText = `${periodo.period_number}\u00ba Per\u00edodo`;
        blocoPeriodo.appendChild(tituloPeriodo);

        periodo.disciplines.forEach(disciplina => {
            blocoPeriodo.appendChild(criarBlocoDisciplinaFluxograma(disciplina));
        });

        matriz.appendChild(blocoPeriodo);
    });

    container.appendChild(matriz);

    const periodoOptativas = obterPeriodoOptativas(ppc);
    if (periodoOptativas && periodoOptativas.disciplines.length > 0) {
        const blocoOptativas = document.createElement('div');
        blocoOptativas.className = 'bloco_periodo bloco_optativas';

        const tituloOptativas = document.createElement('h3');
        tituloOptativas.innerText = 'Optativas';
        blocoOptativas.appendChild(tituloOptativas);

        periodoOptativas.disciplines.forEach(disciplina => {
            blocoOptativas.appendChild(criarBlocoDisciplinaFluxograma(disciplina));
        });

        container.appendChild(blocoOptativas);
    }

    const totais = document.createElement('div');
    totais.className = 'fluxograma_totais';
    obterPeriodosRegulares(ppc).forEach(periodo => {
        const total = periodo.disciplines.reduce((soma, disciplina) => soma + Number(disciplina.hours || 0), 0);
        const item = document.createElement('span');
        item.innerText = `${periodo.period_number}\u00ba: ${total}h`;
        totais.appendChild(item);
    });
    container.appendChild(totais);

    //exibe a carga horaria total no final da pagina.
    const cargaTotal = ppc.periods.reduce((somaPeriodo, periodo) => {
        return somaPeriodo + periodo.disciplines.reduce((somaDisciplina, disciplina) => {
            return somaDisciplina + Number(disciplina.hours || 0);
        }, 0);
    }, 0);

    const totalGeral = document.createElement('div');
    totalGeral.className = 'fluxograma_total_geral';
    totalGeral.innerText = `Carga hor\u00e1ria total: ${cargaTotal}h`;
    container.appendChild(totalGeral);

    area_fluxograma.appendChild(container);
}

// ========== GERACAO DO FLUXOGRAMA TECNICO PARA PDF ==========


function criarBlocoDisciplinaPdf(disciplina) {
    const blocoDisciplina = document.createElement('div');
    blocoDisciplina.className = 'pdf_bloco_disciplina';

    const nomeDisciplina = document.createElement('p');
    nomeDisciplina.className = 'pdf_nome_disciplina';
    nomeDisciplina.innerText = disciplina.name;

    const horasDisciplina = document.createElement('p');
    horasDisciplina.className = 'pdf_horas_disciplina';
    horasDisciplina.innerText = `${disciplina.hours || 0}h`;

    blocoDisciplina.appendChild(nomeDisciplina);
    blocoDisciplina.appendChild(horasDisciplina);

    //os pre-requisitos exibidos no card do PDF de Disciplina.
    if (disciplina.prerequisites && disciplina.prerequisites.length > 0) {
        const prerequisitos = document.createElement('p');
        prerequisitos.className = 'pdf_prerequisitos_disciplina';
        const nomes = disciplina.prerequisites.map(obterNomePrerequisito).filter(Boolean).join(', ');
        prerequisitos.innerText = `Pré-req: ${nomes}`;
        blocoDisciplina.appendChild(prerequisitos);
    }

    return blocoDisciplina;
}

//documento temporario no formato de fluxograma das disciplinas.
function criarDocumentoFluxogramaPdf(ppc) {
    const documento = document.createElement('div');
    documento.className = 'pdf_fluxograma_documento';
    const totalPeriodos = obterPeriodosRegulares(ppc).length || 1;
    documento.style.setProperty('--total-periodos', totalPeriodos);
    documento.style.setProperty('--largura-pdf', `${Math.max(1120, 150 + totalPeriodos * 132)}px`);

    const faixaLateral = document.createElement('div');
    faixaLateral.className = 'pdf_fluxograma_faixa_lateral';
    const textoFaixaLateral = document.createElement('span');
    textoFaixaLateral.innerText = ppc.name;
    faixaLateral.appendChild(textoFaixaLateral);
    documento.appendChild(faixaLateral);

    const conteudo = document.createElement('div');
    conteudo.className = 'pdf_fluxograma_conteudo';

    const titulo = document.createElement('div');
    titulo.className = 'pdf_fluxograma_titulo';
    titulo.innerText = 'FLUXOGRAMA';
    conteudo.appendChild(titulo);

    const grafico = document.createElement('div');
    grafico.className = 'pdf_fluxograma_grafico';

    const matriz = document.createElement('div');
    matriz.className = 'pdf_fluxograma_matriz';
    matriz.style.setProperty('--total-periodos', totalPeriodos);

    obterPeriodosRegulares(ppc).forEach(periodo => {
        const blocoPeriodo = document.createElement('div');
        blocoPeriodo.className = 'pdf_bloco_periodo';

        const tituloPeriodo = document.createElement('h3');
        tituloPeriodo.innerText = `${periodo.period_number} PERÍODO`;
        blocoPeriodo.appendChild(tituloPeriodo);

        periodo.disciplines.forEach(disciplina => {
            blocoPeriodo.appendChild(criarBlocoDisciplinaPdf(disciplina));
        });

        matriz.appendChild(blocoPeriodo);
    });

    grafico.appendChild(matriz);
    conteudo.appendChild(grafico);

    const periodoOptativas = obterPeriodoOptativas(ppc);
    if (periodoOptativas && periodoOptativas.disciplines.length > 0) {
        const blocoOptativas = document.createElement('div');
        blocoOptativas.className = 'pdf_bloco_optativas';

        const tituloOptativas = document.createElement('h3');
        tituloOptativas.innerText = 'OPTATIVAS';
        blocoOptativas.appendChild(tituloOptativas);

        periodoOptativas.disciplines.forEach(disciplina => {
            blocoOptativas.appendChild(criarBlocoDisciplinaPdf(disciplina));
        });

        conteudo.appendChild(blocoOptativas);
    }

    const totais = document.createElement('div');
    totais.className = 'pdf_fluxograma_totais';
    totais.style.setProperty('--total-periodos', totalPeriodos);
    obterPeriodosRegulares(ppc).forEach(periodo => {
        const total = periodo.disciplines.reduce((soma, disciplina) => soma + Number(disciplina.hours || 0), 0);
        const item = document.createElement('span');
        item.innerText = `Total: ${total}h`;
        totais.appendChild(item);
    });
    conteudo.appendChild(totais);

    //mostra a carga horaria total com a soma dos periodos.
    const cargaTotal = ppc.periods.reduce((somaPeriodo, periodo) => {
        return somaPeriodo + periodo.disciplines.reduce((somaDisciplina, disciplina) => {
            return somaDisciplina + Number(disciplina.hours || 0);
        }, 0);
    }, 0);

    const totalGeral = document.createElement('div');
    totalGeral.className = 'pdf_fluxograma_total_geral';
    totalGeral.innerText = `Carga hor\u00e1ria total: ${cargaTotal}h`;
    conteudo.appendChild(totalGeral);

    documento.appendChild(conteudo);
    return documento;
}

// ========== GERACAO DA TABELA ==========

function gerarTabela(ppc) {
    area_tabela.innerHTML = '';

    const titulo = document.createElement('h2');
    titulo.innerText = 'Matriz Curricular Completa';
    area_tabela.appendChild(titulo);

    const periodosTabela = obterPeriodosRegulares(ppc);
    const periodoOptativas = obterPeriodoOptativas(ppc);
    if (periodoOptativas && periodoOptativas.disciplines.length > 0) {
        periodosTabela.push(periodoOptativas);
    }

    periodosTabela.forEach(periodo => {
        const secaoPeriodo = document.createElement('div');
        secaoPeriodo.className = 'secao_periodo';

        const tituloPeriodo = document.createElement('h3');
        tituloPeriodo.innerText = periodo.period_number === 0 ? 'Optativas' : `${periodo.period_number}\u00ba Per\u00edodo`;
        secaoPeriodo.appendChild(tituloPeriodo);

        const tabela = document.createElement('table');
        tabela.className = 'tabela_disciplinas';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const thDisciplina = document.createElement('th');
        thDisciplina.innerText = 'Disciplina';

        const thHoras = document.createElement('th');
        thHoras.innerText = 'Horas';

        const thPrerequisito = document.createElement('th');
        thPrerequisito.innerText = 'Pre-requisito';

        headerRow.appendChild(thDisciplina);
        headerRow.appendChild(thHoras);
        headerRow.appendChild(thPrerequisito);
        thead.appendChild(headerRow);
        tabela.appendChild(thead);

        const tbody = document.createElement('tbody');

        periodo.disciplines.forEach(disciplina => {
            const row = document.createElement('tr');

            const tdDisciplina = document.createElement('td');
            tdDisciplina.innerText = disciplina.name;

            const tdHoras = document.createElement('td');
            tdHoras.innerText = `${disciplina.hours || 0}h`;

            const tdPrerequisito = document.createElement('td');
            if (disciplina.prerequisites && disciplina.prerequisites.length > 0) {
                const nomes = disciplina.prerequisites.map(p => p.name || p).join(', ');
                tdPrerequisito.innerText = nomes;
            } else {
                tdPrerequisito.innerText = 'Nenhum';
            }

            row.appendChild(tdDisciplina);
            row.appendChild(tdHoras);
            row.appendChild(tdPrerequisito);
            tbody.appendChild(row);
        });

        tabela.appendChild(tbody);
        secaoPeriodo.appendChild(tabela);
        area_tabela.appendChild(secaoPeriodo);
    });
}

// ========== DOWNLOAD DE PDF ==========


async function salvarFluxogramaComoPdf(elemento, nomeArquivo) {
    if (typeof html2canvas === 'undefined') {
        throw new Error('Biblioteca html2canvas nao disponivel.');
    }

    const JsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!JsPDF) {
        throw new Error('Biblioteca jsPDF nao disponivel.');
    }

    const canvas = await html2canvas(elemento, {
        scale: 2,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: Math.max(elemento.scrollWidth, document.documentElement.clientWidth),
        windowHeight: Math.max(elemento.scrollHeight, document.documentElement.clientHeight)
    });

    const pdf = new JsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const margem = 6;
    const larguraPagina = pdf.internal.pageSize.getWidth();
    const alturaPagina = pdf.internal.pageSize.getHeight();
    const larguraUtil = larguraPagina - margem * 2;
    const alturaUtil = alturaPagina - margem * 2;
    const alturaFatiaPx = Math.floor((alturaUtil * canvas.width) / larguraUtil);

    let posicaoY = 0;
    let primeiraPagina = true;

    while (posicaoY < canvas.height) {
        const alturaAtualPx = Math.min(alturaFatiaPx, canvas.height - posicaoY);
        const canvasPagina = document.createElement('canvas');
        canvasPagina.width = canvas.width;
        canvasPagina.height = alturaAtualPx;

        const contexto = canvasPagina.getContext('2d');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, canvasPagina.width, canvasPagina.height);
        contexto.drawImage(canvas, 0, posicaoY, canvas.width, alturaAtualPx, 0, 0, canvas.width, alturaAtualPx);

        if (!primeiraPagina) {
            pdf.addPage('a4', 'landscape');
        }

        const alturaImagemMm = (alturaAtualPx * larguraUtil) / canvas.width;
        pdf.addImage(canvasPagina.toDataURL('image/jpeg', 0.98), 'JPEG', margem, margem, larguraUtil, alturaImagemMm);

        posicaoY += alturaAtualPx;
        primeiraPagina = false;
    }

    pdf.save(nomeArquivo);
}

btn_download_pdf.addEventListener('click', async () => {
    let elemento = null;
    let areaExportacao = null;

    try {
        elemento = criarDocumentoFluxogramaPdf(ppcData);
        areaExportacao = document.createElement('div');
        areaExportacao.className = 'pdf_area_exportacao';
        areaExportacao.appendChild(elemento);
        document.body.appendChild(areaExportacao);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        //captura somente as caixas com texto de pre-requisito.
        areaExportacao.style.width = `${elemento.scrollWidth}px`;
        areaExportacao.style.height = `${elemento.scrollHeight}px`;

        await salvarFluxogramaComoPdf(areaExportacao, `${ppcData.name.replace(/\s+/g, '_')}_Fluxograma.pdf`);

    } catch (erro) {
        console.error('Erro ao gerar PDF:', erro);
        alert('Erro ao gerar PDF');
    } finally {
        if (areaExportacao) {
            areaExportacao.remove();
        }
    }
});

// ========== INICIALIZACAO ==========

document.addEventListener('DOMContentLoaded', async () => {
    const autenticado = await validarAutenticacao();
    if (!autenticado) return;

    const ppcId = obterPPCIdDaURL();
    if (!ppcId) {
        alert('Nenhum PPC selecionado para visualizaÃ§Ã£o');
        window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
        return;
    }

    ppcData = await carregarPPC(ppcId);
    if (ppcData) {
        preencherTitulo(ppcData);
        gerarFluxograma(ppcData);
        gerarTabela(ppcData);

        area_fluxograma.style.display = 'block';
        area_tabela.style.display = 'none';
        btn_download_pdf.style.backgroundColor = '#2F9E41';
    }
});
