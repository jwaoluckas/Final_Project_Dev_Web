const { pool } = require('../database/pool');

class CourseRepository {
  // Alteracao PPC: o curso mantem apenas os campos base da migration 002.
  // Cria um novo curso
  async create(courseData, client = pool) {
    const { name, nature, total_periods, user_id } = courseData;
    const query = `
      INSERT INTO courses (name, nature, total_periods, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [name, nature, total_periods, user_id];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  // Busca cursos do usuario autenticado
  async findAllByUserId(userId) {
    const query = 'SELECT * FROM courses WHERE user_id = $1 ORDER BY created_at DESC';
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }

  // Busca um curso por ID e usuario para impedir acesso a PPCs de terceiros.
  async findByIdAndUserId(id, userId) {
    const query = 'SELECT * FROM courses WHERE id = $1 AND user_id = $2';
    const { rows } = await pool.query(query, [id, userId]);
    return rows[0];
  }

  // Atualiza um curso
  async update(id, userId, courseData, client = pool) {
    const { name, nature, total_periods } = courseData;
    const query = `
      UPDATE courses
      SET name = $1, nature = $2, total_periods = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `;
    const values = [name, nature, total_periods, id, userId];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  // Deleta um curso
  async deleteByIdAndUserId(id, userId) {
    const query = 'DELETE FROM courses WHERE id = $1 AND user_id = $2';
    const { rowCount } = await pool.query(query, [id, userId]);
    return rowCount > 0;
  }
}

module.exports = new CourseRepository();
