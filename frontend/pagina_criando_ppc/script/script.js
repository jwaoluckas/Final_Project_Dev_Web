const div_campo_config_curso = document.querySelector('.campo_config_curso');
const tipo_curso = document.getElementById('escolha_formacao');
const escolha_qtd_periodos = document.getElementById('escolha_tempo');
escolha_qtd_periodos.disabled = true;

tipo_curso.addEventListener('change', async () =>{
    escolha_qtd_periodos.disabled = false;
    
   if(tipo_curso.value === 'bacharelado'){
        escolha_qtd_periodos.min = '8';
        escolha_qtd_periodos.max = '12';
    }

    else if(tipo_curso.value === 'tecnologo'){
        escolha_qtd_periodos.min = '5';
        escolha_qtd_periodos.max = '8';
    }

    else if(tipo_curso.value === 'licenciatura'){
        escolha_qtd_periodos.min = '8';
        escolha_qtd_periodos.max = '10';
    }
    
    // ESTRUTURA PARA O BACK-END (Preenchimento dos Cursos)
    // A equipa de Back-End vai usar este bloco para pedir à API 
    // a lista de cursos com base no 'tipo_curso' escolhido acima.
    
    /*
    try {
        // Envia o tipo (ex: 'bacharelado') na URL para o Back-End filtrar
        const resposta = await fetch(`URL_DA_API/cursos?tipo=${tipo_curso.value}`);
        const cursos_do_banco = await resposta.json();

        // 1. Limpa as opções antigas sempre que o utilizador troca a natureza do curso
        escolha_curso.innerHTML = '<option value="" disabled selected>Selecione</option>';

        // 2. Cria as novas opções (<option>) que vieram da base de dados
        cursos_do_banco.forEach(curso => {
            const nova_opcao = document.createElement('option');
            nova_opcao.value = curso.id; // O ID real do banco
            nova_opcao.innerText = curso.nome; // O nome do curso (ex: Eng. de Software)
            escolha_curso.appendChild(nova_opcao);
        });

    } catch (erro) {
        console.error("Erro ao buscar a lista de cursos:", erro);
    }
    */
});

const div_campo_config_periodo = document.querySelector('.campo_config_periodo');
const botao_prox_etapa = document.getElementById('botao_prox_etapa1');
const botoes_confirmar_vizuPDF = document.querySelector('.botoes');

// ESTRUTURA PARA O BACK-END (Preenchimento das Disciplinas)
// O Back-End vai descomentar esta função e colocar a URL da API.
// Ela recebe o <select> recém-criado e o número do período atual para buscar as disciplinas corretas.

/*
async function carregarDisciplinas(elementoSelect, numeroPeriodo) {
    try {
        // Exemplo: O Back-End pode pegar o ID do curso que o usuário escolheu lá em cima
        const idCurso = document.getElementById('escolha_curso').value;
        
        // Vai ao banco de dados buscar as disciplinas do Curso X para o Período Y
        const resposta = await fetch(`URL_DA_API/disciplinas?curso=${idCurso}&periodo=${numeroPeriodo}`);
        const disciplinas_do_banco = await resposta.json();

        // Adiciona cada disciplina que veio do banco de dados dentro do <select>
        disciplinas_do_banco.forEach(disciplina => {
            const nova_opcao = document.createElement('option');
            nova_opcao.value = disciplina.id; // O ID real do banco (ex: 45)
            nova_opcao.innerText = disciplina.nome; // O nome legível (ex: Cálculo I)
            elementoSelect.appendChild(nova_opcao);
        });
    } catch (erro) {
        console.error(`Erro ao buscar disciplinas do ${numeroPeriodo}º período:`, erro);
    }
}
*/

botao_prox_etapa.addEventListener('click', (evento) =>{
    evento.preventDefault();

    div_campo_config_periodo.style.display = 'flex';

    for(i = 0; i < Number(escolha_qtd_periodos.value); i++){
        const div_periodo_atual = document.createElement('div');
        div_periodo_atual.className = `periodo_${i+1}`;

        const nome_periodo = document.createElement('label');
        nome_periodo.for = 'escolha_disciplina';
        nome_periodo.innerText = `${i+1}° Período`;

        div_periodo_atual.appendChild(nome_periodo);

       for(let n = 0; n < 3; n++){
        const campo_escolha_disciplina = document.createElement('select');
        campo_escolha_disciplina.id = 'escolha_disciplina';
        campo_escolha_disciplina.name = 'escolha_disciplina';

        const opcao_nula = document.createElement('option');
        opcao_nula.value = '';
        opcao_nula.innerText = 'Selecione';

        campo_escolha_disciplina.appendChild(opcao_nula);
        div_periodo_atual.appendChild(campo_escolha_disciplina);
       }

        const adicionar_disciplina = document.createElement('button');
        adicionar_disciplina.type = 'submit';
        adicionar_disciplina.id = 'botao_adicionar_disciplina';
        adicionar_disciplina.innerText = 'ADICIONAR DISCIPLINA';

        div_periodo_atual.appendChild(adicionar_disciplina);

        adicionar_disciplina.addEventListener('click', (evento_add_disciplina) =>{
            evento_add_disciplina.preventDefault();

            const campo_escolha_disciplina = document.createElement('select');
            campo_escolha_disciplina.id = 'escolha_disciplina';
            campo_escolha_disciplina.name = 'escolha_disciplina';

            const opcao_nula = document.createElement('option');
            opcao_nula.value = '';
            opcao_nula.innerText = 'Selecione';

            campo_escolha_disciplina.appendChild(opcao_nula);
            div_periodo_atual.insertBefore(campo_escolha_disciplina, adicionar_disciplina);       
       });

       div_campo_config_periodo.insertBefore(div_periodo_atual, botoes_confirmar_vizuPDF);
    }
});

const botao_confirmar = document.getElementById('confirmar_ppc');
const botao_vizualizar_pdf = document.getElementById('vizualizar_pdf');

botao_confirmar.addEventListener('click', (evento) =>{
    evento.preventDefault();

    const formacao_escolhida = document.getElementById('escolha_formacao');
    const nome_curso = formacao_escolhida.options[formacao_escolhida.selectedIndex].text;
    const qtd_periodos = document.getElementById('escolha_tempo').value;

    const dados_ppc = {
        natureza: nome_curso,
        periodos: qtd_periodos,
        data: new Date().toLocaleDateString('pt-BR')
    };

    localStorage.setItem('ppc_temporario', JSON.stringify(dados_ppc));

    window.location.href = '../pagina_criar_editar_ppcs/criar_editar_ppcs.html';
});

botao_vizualizar_pdf.addEventListener('click', async (evento) =>{
    evento.preventDefault();

    const formacao_escolhida = document.getElementById('escolha_formacao');
    const nome_curso = formacao_escolhida.options[formacao_escolhida.selectedIndex].text;
    const qtd_periodos = document.getElementById('escolha_tempo').value;

    const dados_para_pdf = {
        natureza: nome_curso,
        periodos: qtd_periodos,
        // O Back-End precisará também da lista de disciplinas escolhidas (a implementar depois)
    };

    // ESTRUTURA PARA O BACK-END (Geração de PDF)
    // O Back-End vai usar este bloco para receber os dados do formulário,
    // montar o PDF no servidor e devolver o arquivo binário (Blob) para o navegador.
    
    /*
    try {
        // Muda o texto do botão para dar um feedback visual de carregamento
        botao_vizualizar_pdf.innerText = 'GERANDO PDF...';
        botao_vizualizar_pdf.disabled = true;

        const resposta = await fetch('URL_DA_API/gerar-pdf-ppc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados_para_pdf)
        });

        // Transforma a resposta do servidor num "Blob" (um pacote de arquivo bruto)
        const arquivo_pdf = await resposta.blob();

        // Cria uma URL local e temporária no navegador para esse pacote
        const url_do_pdf = URL.createObjectURL(arquivo_pdf);

        // Abre essa URL numa nova aba! (O navegador entende que é um PDF e mostra o visualizador nativo)
        window.open(url_do_pdf, '_blank');

    } catch (erro) {
        console.error("Erro ao gerar o PDF:", erro);
        alert("Ocorreu um erro ao tentar gerar o documento. Tente novamente.");
    } finally {
        // Devolve o botão ao estado normal
        botao_vizualizar_pdf.innerText = 'VIZUALIZAR PDF';
        botao_vizualizar_pdf.disabled = false;
    }
    */
});