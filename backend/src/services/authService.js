const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { config } = require('../config/env');
const userRepository = require('../repositories/userRepository');

async function login({ email, senha }) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(senha, user.password_hash);

  if (!passwordMatches) {
    return null;
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email
    }
  };
}

module.exports = { login };
