const jwt = require('jsonwebtoken');

const { config } = require('../config/env');
const userRepository = require('../repositories/userRepository');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticacao ausente.' });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Token de autenticacao invalido.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token de autenticacao invalido.' });
  }
}

module.exports = { authenticate };
