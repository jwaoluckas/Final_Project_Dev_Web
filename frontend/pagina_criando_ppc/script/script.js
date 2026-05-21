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

botao_prox_etapa.addEventListener('click', (evento) =>{
    evento.preventDefault();

    for(i = 0; i < Number(escolha_qtd_periodos.value); i++){
        const nome_periodo = document.createElement('label');
        nome_periodo.for = 'escolha_disciplina';
        nome_periodo.innerText = `${i+1}° Período`;

        div_campo_config_periodo.appendChild(nome_periodo);

       for(let n = 0; n < 3; n++){
        const campo_escolha_disciplina = document.createElement('select');
        campo_escolha_disciplina.id = 'escolha_disciplina';
        campo_escolha_disciplina.name = 'escolha_disciplina';

        const opcao_nula = document.createElement('option');
        opcao_nula.value = '';
        opcao_nula.innerText = 'Selecione';

        campo_escolha_disciplina.appendChild(opcao_nula);
        div_campo_config_periodo.appendChild(campo_escolha_disciplina);
       }

        const adicionar_disciplina = document.createElement('button');
        adicionar_disciplina.type = 'submit';
        adicionar_disciplina.id = 'botao_adicionar_disciplina';
        adicionar_disciplina.innerText = 'ADICIONAR DISCIPLINA';

       div_campo_config_periodo.appendChild(adicionar_disciplina);

       adicionar_disciplina.addEventListener('click', (evento_add_disciplina) =>{
            evento_add_disciplina.preventDefault();

            const campo_escolha_disciplina = document.createElement('select');
            campo_escolha_disciplina.id = 'escolha_disciplina';
            campo_escolha_disciplina.name = 'escolha_disciplina';

            const opcao_nula = document.createElement('option');
            opcao_nula.value = '';
            opcao_nula.innerText = 'Selecione';

            campo_escolha_disciplina.appendChild(opcao_nula);
            div_campo_config_periodo.appendChild(campo_escolha_disciplina);       
       });
    }
});