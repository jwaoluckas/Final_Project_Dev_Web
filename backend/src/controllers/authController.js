const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'E-mail e senha sao obrigatorios.' });
    }

    const authData = await authService.login({ email, senha });

    if (!authData) {
      return res.status(401).json({ message: 'E-mail ou senha invalidos.' });
    }

    return res.json(authData);
  } catch (error) {
    return next(error);
  }
}

async function me(req, res) {
  return res.json({ user: req.user });
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'E-mail e obrigatorio.' });
    }

    // Alteracao auth: dispara o fluxo de e-mail sem retornar dados sensiveis para o frontend.
    await authService.requestPasswordReset({ email });

    return res.json({
      message: 'Se o e-mail estiver cadastrado, enviaremos um link de redefinicao de senha.'
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ message: 'Token e nova senha sao obrigatorios.' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    // Alteracao auth: valida o token recebido por e-mail e troca o hash da senha no banco.
    const passwordChanged = await authService.resetPassword({ token, novaSenha });

    if (!passwordChanged) {
      return res.status(400).json({ message: 'Token invalido ou expirado.' });
    }

    return res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  me,
  forgotPassword,
  resetPassword
};
