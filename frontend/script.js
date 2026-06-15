const form = document.querySelector('.campo_login_senha');
const link_senha = document.getElementById('esqueceu_a_senha');
const checkbox_mostrar_senha = document.getElementById('mostrar_senha');
const API_BASE_URL = 'http://localhost:3000/api';

//remove o bloco dinamico de recuperacao para nao duplicar mensagens na tela.
function removerAvisoSenha() {
    const avisoExistente = document.getElementById('campo_aviso');
    if (avisoExistente) {
        avisoExistente.remove();
    }
}

//campos de senha do fluxo de redefinicao pelo token.
function criarCampoSenha({ placeholder }) {
    const input = document.createElement('input');
    input.type = 'password';
    input.required = true;
    input.placeholder = placeholder;
    return input;
}

//solicita ao backend o envio do link de redefinicao pelo SMTP configurado.
function mostrarFluxoSolicitarReset() {
    removerAvisoSenha();

    const aviso = document.createElement('div');
    aviso.id = 'campo_aviso';

    const texto = document.createElement('p');
    texto.innerText = 'Informe seu e-mail para receber o link de redefinicao de senha.';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.required = true;
    emailInput.placeholder = 'Seu e-mail';
    emailInput.value = document.querySelector('input[name="email_usuario"]').value;

    const botaoEnviar = document.createElement('button');
    botaoEnviar.type = 'button';
    botaoEnviar.innerText = 'ENVIAR LINK';

    botaoEnviar.addEventListener('click', async () => {
        if (!emailInput.value) {
            alert('Informe seu e-mail.');
            return;
        }

        try {
            const resposta = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(dados.message || 'Nao foi possivel solicitar a redefinicao.');
                return;
            }

            alert(dados.message);
        } catch (erro) {
            console.error('Erro ao solicitar redefinicao:', erro);
            alert('Nao foi possivel conectar ao servidor.');
        }
    });

    aviso.appendChild(texto);
    aviso.appendChild(emailInput);
    aviso.appendChild(botaoEnviar);
    form.appendChild(aviso);
}

//ao validar o token, mostra os campos para cadastrar nova senha.
function mostrarFluxoRedefinirSenha(token) {
    removerAvisoSenha();

    const aviso = document.createElement('div');
    aviso.id = 'campo_aviso';

    const texto = document.createElement('p');
    texto.innerText = 'Digite sua nova senha.';

    const novaSenhaInput = criarCampoSenha({ placeholder: 'Nova senha' });
    const confirmarSenhaInput = criarCampoSenha({ placeholder: 'Confirmar nova senha' });

    const botaoRedefinir = document.createElement('button');
    botaoRedefinir.type = 'button';
    botaoRedefinir.innerText = 'REDEFINIR SENHA';

    botaoRedefinir.addEventListener('click', async () => {
        if (novaSenhaInput.value !== confirmarSenhaInput.value) {
            alert('As senhas nao conferem.');
            return;
        }

        try {
            const resposta = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha: novaSenhaInput.value })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(dados.message || 'Nao foi possivel redefinir a senha.');
                return;
            }

            alert(dados.message);
            window.history.replaceState({}, document.title, window.location.pathname);
            removerAvisoSenha();
        } catch (erro) {
            console.error('Erro ao redefinir senha:', erro);
            alert('Nao foi possivel conectar ao servidor.');
        }
    });

    aviso.appendChild(texto);
    aviso.appendChild(novaSenhaInput);
    aviso.appendChild(confirmarSenhaInput);
    aviso.appendChild(botaoRedefinir);
    form.appendChild(aviso);
}

//troca o aviso antigo pelo fluxo de envio de link de recuperacao.
link_senha.addEventListener('click', (evento) =>{
    evento.preventDefault();
    mostrarFluxoSolicitarReset();
});

//checkbox para visualizar a senha digitada.
checkbox_mostrar_senha.addEventListener('change', () => {
    const campoSenha = document.querySelector('input[name="senha_usuario"]');
    campoSenha.type = checkbox_mostrar_senha.checked ? 'text' : 'password';
});

form.addEventListener('submit', async (evento) =>{
    evento.preventDefault();

    const email_digitado = document.querySelector('input[name="email_usuario"]').value;
    const senha_digitada = document.querySelector('input[name="senha_usuario"]').value;

    //envia o e-mail e senha para a API e salva o JWT retornado.
    try {
        const resposta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email_digitado, senha: senha_digitada })
        });

        const dados = await resposta.json();

        if(!resposta.ok){
            alert(dados.message || 'E-mail ou senha invalidos.');
            return;
        }

        localStorage.setItem('auth_token', dados.token);
        window.location.href = 'pagina_criar_editar_ppcs/criar_editar_ppcs.html';
    } catch (erro) {
        console.error('Erro ao conectar com o back-end:', erro);
        alert('Nao foi possivel conectar ao servidor. Verifique se o back-end esta rodando.');
    }
});

//abre o formulario de nova senha quando o usuario vem pelo link do e-mail.
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('reset_token');

    if (resetToken) {
        mostrarFluxoRedefinirSenha(resetToken);
    }
});
