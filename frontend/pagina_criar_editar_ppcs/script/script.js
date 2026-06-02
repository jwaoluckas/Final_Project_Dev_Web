// ========== CONFIGURAÇÃO INICIAL ==========
const API_BASE_URL = 'http://localhost:3000/api'; // Mantem a mesma API usada no login.

const main = document.querySelector('main');
const espaco_cards_ppcs = document.querySelector('.espaco_cards_ppcs');
const botao_criar_ppc = document.querySelector('.criar_ppc');
const link_sair = document.querySelector('header a');

// ========== VALIDAÇÃO DE AUTENTICAÇÃO ==========

// Proteção da página: valida o JWT no back-end antes de permitir o uso da área interna.
async function validar_autenticacao() {
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
        console.error('Erro ao validar autenticação:', erro);
        localStorage.removeItem('auth_token');
        window.location.href = '../index.html';
        return false;
    }
}

// ========== LOGOUT ==========

// Logout implementado: remove o JWT salvo no navegador antes de voltar para a tela de login.
link_sair.addEventListener('click', (evento) => {
    evento.preventDefault();
    localStorage.removeItem('auth_token');
    window.location.href = '../index.html';
});

// ========== CARREGAMENTO DE PPCs ==========

async function carregarPPCs() {
    try {
        const token = localStorage.getItem('auth_token');
        
        const resposta = await fetch(`${API_BASE_URL}/ppc`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao buscar PPCs');
        }

        const ppcs = await resposta.json();
        
        // Limpar cards antigos
        espaco_cards_ppcs.innerHTML = '';

        if (ppcs.length === 0) {
            const mensagem = document.createElement('p');
            mensagem.style.textAlign = 'center';
            mensagem.style.color = '#999';
            mensagem.innerText = 'Nenhum PPC criado ainda. Clique em "CRIAR PPC" para começar.';
            espaco_cards_ppcs.appendChild(mensagem);
            return;
        }

        // Criar card para cada PPC
        ppcs.forEach(ppc => {
            criarCardPPC(ppc);
        });

    } catch (erro) {
        console.error('Erro ao carregar PPCs:', erro);
        const mensagem = document.createElement('p');
        mensagem.style.color = 'red';
        mensagem.innerText = 'Erro ao carregar PPCs. Tente novamente.';
        espaco_cards_ppcs.appendChild(mensagem);
    }
}

// Alteracao PPC: cada card passa a representar um PPC salvo no backend, com acoes de editar, PDF e deletar.
function criarCardPPC(ppc) {
    const card_ppc = document.createElement('div');
    card_ppc.id = 'card_ppc';
    card_ppc.dataset.ppcId = ppc.id;
    
    const dataFormatada = new Date(ppc.created_at).toLocaleDateString('pt-BR');
    
    card_ppc.innerHTML = `
        <h2>${ppc.name}</h2>
        <p><strong>Natureza:</strong> ${ppc.nature}</p>
        <p><strong>Períodos:</strong> ${ppc.total_periods}</p>
        <p><strong>Criado em:</strong> ${dataFormatada}</p>
    `;

    const div_botoes = document.createElement('div');
    div_botoes.id = 'div_botoes';

    // Botão Editar
    const botao_editar = document.createElement('button');
    botao_editar.id = 'botao_editar';
    botao_editar.type = 'button';
    botao_editar.innerText = 'EDITAR';
    botao_editar.addEventListener('click', () => {
        editarPPC(ppc.id);
    });

    // Botão Visualizar PDF
    const botao_visualizarpdf = document.createElement('button');
    botao_visualizarpdf.id = 'botao_visualizarpdf';
    botao_visualizarpdf.type = 'button';
    botao_visualizarpdf.innerText = 'VISUALIZAR PDF';
    botao_visualizarpdf.addEventListener('click', () => {
        visualizarPDFFluxograma(ppc.id);
    });

    // Botão Deletar
    const botao_deletar = document.createElement('button');
    botao_deletar.id = 'botao_deletar';
    botao_deletar.type = 'button';
    botao_deletar.innerText = 'DELETAR';
    botao_deletar.style.backgroundColor = '#dc3545';
    botao_deletar.addEventListener('click', () => {
        deletarPPC(ppc.id, card_ppc);
    });

    div_botoes.appendChild(botao_editar);
    div_botoes.appendChild(botao_visualizarpdf);
    div_botoes.appendChild(botao_deletar);
    
    card_ppc.appendChild(div_botoes);
    espaco_cards_ppcs.appendChild(card_ppc);
}

// ========== EDIÇÃO DE PPC ==========

function editarPPC(ppcId) {
    // Armazenar o ID do PPC a ser editado
    localStorage.setItem('ppc_edit_id', ppcId);
    
    // Redirecionar para a página de edição
    window.location.href = '../pagina_editar_ppc/editar_ppc.html?id=' + ppcId;
}

// ========== VISUALIZAÇÃO EM PDF ==========

function visualizarPDFFluxograma(ppcId) {
    // Armazenar o ID do PPC para visualização
    localStorage.setItem('ppc_view_id', ppcId);
    
    // Redirecionar para a página de visualização em PDF
    window.location.href = '../pagina_visualizar_pdf/visualizar_pdf.html?id=' + ppcId;
}

// ========== DELEÇÃO DE PPC ==========

async function deletarPPC(ppcId, cardElement) {
    if (!confirm('Tem certeza que deseja deletar este PPC? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const token = localStorage.getItem('auth_token');
        
        const resposta = await fetch(`${API_BASE_URL}/ppc/${ppcId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao deletar PPC');
        }

        // Remover o card da interface
        cardElement.remove();
        alert('PPC deletado com sucesso!');

    } catch (erro) {
        console.error('Erro ao deletar PPC:', erro);
        alert('Erro ao deletar PPC. Tente novamente.');
    }
}

// ========== INICIALIZAÇÃO ==========

document.addEventListener('DOMContentLoaded', async () => {
    const usuario_autenticado = await validar_autenticacao();

    if (!usuario_autenticado) {
        return;
    }

    // Carregar PPCs do backend
    await carregarPPCs();

    // Se houver um PPC recém-criado no localStorage, remover após carregar
    const ppc_criado_id = localStorage.getItem('ppc_criado_id');
    if (ppc_criado_id) {
        localStorage.removeItem('ppc_criado_id');
    }
});
