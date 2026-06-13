const { pool } = require('../database/pool');

// Alteracao auth: cria token hasheado e com expiracao para recuperar senha.
async function createToken({ userId, tokenHash, expiresAt }) {
  const result = await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, tokenHash, expiresAt]
  );

  return result.rows[0];
}

// Alteracao auth: so aceita token que exista, nao tenha sido usado e ainda nao tenha expirado.
async function findValidByHash(tokenHash) {
  const result = await pool.query(
    `SELECT id, user_id, expires_at
     FROM password_reset_tokens
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] || null;
}

// Alteracao auth: marca o token como usado para impedir reutilizacao do link.
async function markAsUsed(id) {
  await pool.query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
    [id]
  );
}

// Alteracao auth: invalida links antigos quando um novo token e gerado ou a senha e trocada.
async function invalidateOpenTokensByUserId(userId) {
  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1
       AND used_at IS NULL`,
    [userId]
  );
}

module.exports = {
  createToken,
  findValidByHash,
  markAsUsed,
  invalidateOpenTokensByUserId
};
