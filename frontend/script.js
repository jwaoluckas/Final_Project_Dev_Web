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

    // ESTRUTURA PARA O BACK-END (O que os caras do BD vão usar)
    // Quando o Back-End estiver pronto, eles vão descomentar o código abaixo 
    // e trocar a 'URL_DA_API' pelo endereço real do servidor deles.
    
    /*
    try {
        const resposta = await fetch('URL_DA_API/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailDigitado, senha: senhaDigitada })
        });

        const dados = await resposta.json();

        if(dados.autorizado === true) {
            // Se o BD disser que a senha está certa, redireciona:
            window.location.href = "pagina_principal.html"; 
        } else {
            alert("Email ou senha incorretos!");
        }
    } catch (erro) {
        console.error("Erro ao conectar com o banco de dados:", erro);
    }
    */

    // SIMULAÇÃO FRONT-END
    // Enquanto o Back-End não está pronto, você usa este "if" falso 
    // apenas para testar se o seu redirecionamento está funcionando!

    if((email_digitado === 'admin@ifpe.edu.br') && (senha_digitada === '123')){
        window.location.href = 'pagina_criar_editar_ppcs/criar_editar_ppcs.html';
    }

    else{
        alert('ERRO NA SIMULAÇÃO, CREDENCIAIS INVÁLIDAS! Tente admin@ifpe.edu.br e 123');
    }
});