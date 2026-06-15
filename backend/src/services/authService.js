const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { config } = require('../config/env');
const mailService = require('./mailService');
const passwordResetTokenRepository = require('../repositories/passwordResetTokenRepository');
const userRepository = require('../repositories/userRepository');

const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// Salva apenas o hash do token de reset, nunca o token em texto puro com a senha.
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Gera o link que o usuario recebe pelo Mailtrap para abrir o frontend com reset_token.
function buildPasswordResetLink(token) {
  const baseUrl = config.passwordResetBaseUrl.replace(/\/$/, '');
  return `${baseUrl}/index.html?reset_token=${encodeURIComponent(token)}`;
}

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

async function requestPasswordReset({ email }) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    // Não revela se o e-mail existe para evitar evitar ataques de ataques de força bruta por lista.
    return;
  }

  // Token temporário de uso único para redefinir senha com criptografia.
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

  await passwordResetTokenRepository.invalidateOpenTokensByUserId(user.id);
  await passwordResetTokenRepository.createToken({
    userId: user.id,
    tokenHash,
    expiresAt
  });

  await mailService.sendPasswordResetEmail({
    to: user.email,
    resetLink: buildPasswordResetLink(token)
  });
}

async function resetPassword({ token, novaSenha }) {
  const tokenHash = hashResetToken(token);
  const resetToken = await passwordResetTokenRepository.findValidByHash(tokenHash);

  if (!resetToken) {
    return false;
  }

  // Salva o hash da nova senha no banco de dados.
  const passwordHash = await bcrypt.hash(novaSenha, 12);
  await userRepository.updatePasswordHash(resetToken.user_id, passwordHash);
  await passwordResetTokenRepository.markAsUsed(resetToken.id);
  await passwordResetTokenRepository.invalidateOpenTokensByUserId(resetToken.user_id);

  return true;
}

module.exports = {
  login,
  requestPasswordReset,
  resetPassword
};
