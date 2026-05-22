const main = document.querySelector('main');
const espaco_cards_ppcs = document.querySelector('.espaco_cards_ppcs');
const botao_criar_ppc = document.querySelector('.criar_ppc');

document.addEventListener('DOMContentLoaded', () =>{
    const ppc_salvo = localStorage.getItem('ppc_temporario');

    if(ppc_salvo){
        const dados_ppc = JSON.parse(ppc_salvo);

        const card_ppc = document.createElement('div');
        card_ppc.id = 'card_ppc';
        card_ppc.innerHTML = `
        <h2>PPC de ${dados_ppc.natureza}</h2>
        <p>Duração: ${dados_ppc.periodos} períodos</p>
        <p>Criado em ${dados_ppc.data}</p>
        `;

        const botao_editar = document.createElement('button');
        botao_editar.id = 'botao_editar';
        botao_editar.type = 'submit';
        botao_editar.innerText = 'EDITAR';

        card_ppc.appendChild(botao_editar);
        espaco_cards_ppcs.appendChild(card_ppc);
        main.insertBefore(espaco_cards_ppcs, botao_criar_ppc);

        botao_editar.addEventListener('click', (evento) =>{
            evento.preventDefault();

            // ESTRUTURA PARA O BACK-END (Carregar PPC existente)
            // O Back-End vai usar este bloco para buscar os dados de um PPC 
            // específico no banco de dados antes de abrir a tela de edição.
            
            /*
            try {
                // 1. O Front-End precisa saber qual é o ID do PPC que o utilizador clicou.
                // Geralmente, guardamos esse ID num atributo invisível no próprio HTML do card (ex: data-id="45")
                const id_do_ppc_clicado = 45; // Exemplo fixo, mas será dinâmico!
                
                // 2. Pedimos à API para nos devolver os dados apenas desse PPC
                const resposta = await fetch(`URL_DA_API/ppcs/${id_do_ppc_clicado}`);
                const dados_do_ppc_banco = await resposta.json();

                // 3. Salvamos esses dados no localStorage para a página de edição conseguir ler e preencher as caixas
                localStorage.setItem('ppc_em_edicao', JSON.stringify(dados_do_ppc_banco));

                // 4. Redirecionamos para a tela de criar/editar (onde o código de lá vai ler o localStorage e preencher os selects)
                window.location.href = '../pagina_criando_ppc/criando_ppc.html';

            } catch (erro) {
                console.error("Erro ao buscar os dados do PPC para edição:", erro);
                alert("Não foi possível carregar este PPC no momento.");
            }
            */

            // SIMULAÇÃO FRONT-END (Para você testar agora)
            
            alert("Simulação: Aqui o sistema carregaria os dados do banco e levaria você para a tela de edição com as caixas já preenchidas!");
            
            // Se quiser simular o redirecionamento:
            // window.location.href = '../pagina_criando_ppc/criando_ppc.html';
        });
    }
});