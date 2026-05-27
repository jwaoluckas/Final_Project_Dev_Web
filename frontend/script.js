const form = document.querySelector('.campo_login_senha');
const link_senha = document.getElementById('esqueceu_a_senha');

link_senha.addEventListener('click', (evento) =>{
    evento.preventDefault();

    if(!document.getElementById("campo_aviso")){
        const aviso = document.createElement('div');
        aviso.id = 'campo_aviso'
        aviso.innerText = 'ATENÇÃO: Para redefinir sua senha, envie um e-mail solicitando a troca para coordgeral@sec.ifpe.edu.br';

        form.appendChild(aviso);
    }
});

form.addEventListener('submit', async (evento) =>{
    evento.preventDefault();

    const email_digitado = document.querySelector('input[name="email_usuario"]').value;
    const senha_digitada = document.querySelector('input[name="senha_usuario"]').value;

    // Autenticacao implementada via back-end: envia e-mail e senha para a API e salva o JWT retornado.
    try {
        const resposta = await fetch('http://localhost:3000/api/auth/login', {
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
