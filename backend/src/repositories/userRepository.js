const { pool } = require('../database/pool');

async function findByEmail(email) {
  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1 LIMIT 1',
    [email]
  );

  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, email FROM users WHERE id = $1 LIMIT 1',
    [id]
  );

  return result.rows[0] || null;
}

async function createUser({ email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email`,
    [email, passwordHash]
  );

  return result.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  createUser
};
