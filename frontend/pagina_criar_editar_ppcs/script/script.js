const main = document.querySelector('main');
const espaco_cards_ppcs = document.querySelector('.espaco_cards_ppcs');
const botao_criar_ppc = document.querySelector('.criar_ppc');
const link_sair = document.querySelector('header a');

// Protecao da pagina: valida o JWT no back-end antes de permitir o uso da area interna.
async function validar_autenticacao() {
    const token = localStorage.getItem('auth_token');

    if(!token){
        window.location.href = '../index.html';
        return false;
    }

    try {
        const resposta = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if(!resposta.ok){
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

// Logout implementado: remove o JWT salvo no navegador antes de voltar para a tela de login.
link_sair.addEventListener('click', (evento) =>{
    evento.preventDefault();
    localStorage.removeItem('auth_token');
    window.location.href = '../index.html';
});

document.addEventListener('DOMContentLoaded', async () =>{
    const usuario_autenticado = await validar_autenticacao();

    if(!usuario_autenticado){
        return;
    }

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

        const div_botoes = document.createElement('div');
        div_botoes.id = 'div_botoes';

        const botao_editar = document.createElement('button');
        botao_editar.id = 'botao_editar';
        botao_editar.type = 'submit';
        botao_editar.innerText = 'EDITAR';

        const botao_visualizarpdf = document.createElement('button');
        botao_visualizarpdf.id = 'botao_visualizarpdf';
        botao_visualizarpdf.type = 'submit';
        botao_visualizarpdf.innerText = 'VISUALIZAR PDF';


        div_botoes.appendChild(botao_editar);
        div_botoes.appendChild(botao_visualizarpdf)
        card_ppc.appendChild(div_botoes);
        espaco_cards_ppcs.appendChild(card_ppc);
        main.insertBefore(espaco_cards_ppcs, botao_criar_ppc);

        botao_editar.addEventListener('click', (evento) =>{
            evento.preventDefault();

            // Simulacao mantida: futuramente este ponto buscara o PPC no back-end antes de editar.
            alert("Simulacao: Aqui o sistema carregaria os dados do banco e levaria voce para a tela de edicao com as caixas ja preenchidas!");
        });
    }
});
