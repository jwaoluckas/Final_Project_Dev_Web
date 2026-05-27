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

module.exports = {
  login,
  me
};
