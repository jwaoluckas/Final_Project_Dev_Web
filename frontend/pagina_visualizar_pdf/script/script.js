// ========== CONFIGURACAO INICIAL ==========
const API_BASE_URL = 'http://localhost:3000/api'; // Mantem a mesma API usada no login.

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

// Alteracao: normaliza nomes para localizar as disciplinas no fluxograma tecnico do PDF.
function normalizarNomeDisciplina(valor) {
    return String(valor || '').trim().toLowerCase();
}

// Alteracao: aceita pre-requisito vindo como objeto ou texto, mantendo compatibilidade com o backend atual.
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
        prerequisitos.innerText = `Pre-req: ${nomes}`;
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

    // Alteracao: exibe a carga horaria total tambem no final da visualizacao da pagina.
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

// Alteracao: bloco usado apenas no PDF para evitar mudar o visual da tela.
function criarBlocoDisciplinaPdf(disciplina) {
    const blocoDisciplina = document.createElement('div');
    blocoDisciplina.className = 'pdf_bloco_disciplina';
    blocoDisciplina.dataset.disciplineName = normalizarNomeDisciplina(disciplina.name);

    const nomeDisciplina = document.createElement('p');
    nomeDisciplina.className = 'pdf_nome_disciplina';
    nomeDisciplina.innerText = disciplina.name;

    const horasDisciplina = document.createElement('p');
    horasDisciplina.className = 'pdf_horas_disciplina';
    horasDisciplina.innerText = `${disciplina.hours || 0}h`;

    blocoDisciplina.appendChild(nomeDisciplina);
    blocoDisciplina.appendChild(horasDisciplina);

    return blocoDisciplina;
}

// Alteracao: cria um documento temporario no formato de fluxograma oficial para baixar em A4 paisagem.
function criarDocumentoFluxogramaPdf(ppc) {
    const documento = document.createElement('div');
    documento.className = 'pdf_fluxograma_documento';
    const totalPeriodos = obterPeriodosRegulares(ppc).length || 1;
    documento.style.setProperty('--total-periodos', totalPeriodos);
    documento.style.setProperty('--largura-pdf', `${Math.max(1120, 140 + totalPeriodos * 118)}px`);

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

    const svgSetas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgSetas.classList.add('pdf_fluxograma_setas');
    grafico.appendChild(svgSetas);

    const matriz = document.createElement('div');
    matriz.className = 'pdf_fluxograma_matriz';
    matriz.style.setProperty('--total-periodos', totalPeriodos);

    obterPeriodosRegulares(ppc).forEach(periodo => {
        const blocoPeriodo = document.createElement('div');
        blocoPeriodo.className = 'pdf_bloco_periodo';

        const tituloPeriodo = document.createElement('h3');
        tituloPeriodo.innerText = `${periodo.period_number} PERIODO`;
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

    // Alteracao: mostra a carga horaria total somando os periodos e as optativas cadastradas.
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

// Alteracao: desenha setas de pre-requisito apenas dentro do documento temporario do PDF.
function desenharSetasPrerequisitosPdf(ppc, documento) {
    const grafico = documento.querySelector('.pdf_fluxograma_grafico');
    const svg = documento.querySelector('.pdf_fluxograma_setas');
    if (!grafico || !svg) return;

    const largura = grafico.scrollWidth;
    const altura = grafico.scrollHeight;
    svg.setAttribute('width', largura);
    svg.setAttribute('height', altura);
    svg.setAttribute('viewBox', `0 0 ${largura} ${altura}`);
    svg.innerHTML = `
        <defs>
            <marker id="seta-fluxograma-pdf" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 8 4 L 0 8 z" fill="#222"></path>
            </marker>
        </defs>
    `;

    const origem = grafico.getBoundingClientRect();
    const disciplinas = new Map();
    grafico.querySelectorAll('.pdf_bloco_disciplina').forEach(bloco => {
        disciplinas.set(bloco.dataset.disciplineName, bloco);
    });

    obterPeriodosRegulares(ppc).forEach(periodo => {
        periodo.disciplines.forEach(disciplina => {
            const destino = disciplinas.get(normalizarNomeDisciplina(disciplina.name));
            if (!destino || !disciplina.prerequisites || disciplina.prerequisites.length === 0) return;

            disciplina.prerequisites.forEach(prerequisito => {
                const fonte = disciplinas.get(normalizarNomeDisciplina(obterNomePrerequisito(prerequisito)));
                if (!fonte || fonte === destino) return;

                const fonteRect = fonte.getBoundingClientRect();
                const destinoRect = destino.getBoundingClientRect();
                const x1 = fonteRect.right - origem.left + grafico.scrollLeft;
                const y1 = fonteRect.top + fonteRect.height / 2 - origem.top + grafico.scrollTop;
                const x2 = destinoRect.left - origem.left + grafico.scrollLeft;
                const y2 = destinoRect.top + destinoRect.height / 2 - origem.top + grafico.scrollTop;
                const meioX = x1 + Math.max(18, (x2 - x1) / 2);

                const caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                caminho.setAttribute('d', `M ${x1} ${y1} H ${meioX} V ${y2} H ${x2}`);
                caminho.setAttribute('class', 'pdf_linha_prerequisito');
                caminho.setAttribute('marker-end', 'url(#seta-fluxograma-pdf)');
                svg.appendChild(caminho);
            });
        });
    });
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

// Alteracao: gera o PDF manualmente para evitar corte lateral; a largura sempre encaixa no A4 paisagem.
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
        // Alteracao: usa uma area estatica e capturavel para evitar PDF em branco no html2canvas.
        elemento = criarDocumentoFluxogramaPdf(ppcData);
        areaExportacao = document.createElement('div');
        areaExportacao.className = 'pdf_area_exportacao';
        areaExportacao.appendChild(elemento);
        document.body.appendChild(areaExportacao);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        desenharSetasPrerequisitosPdf(ppcData, elemento);
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
