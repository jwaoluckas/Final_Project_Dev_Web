const { pool } = require('../database/pool');

class CourseRepository {
  // Alteracao PPC: o curso mantem apenas os campos base da migration 002.
  // Cria um novo curso
  async create(courseData, client = pool) {
    const { name, nature, total_periods } = courseData;
    const query = `
      INSERT INTO courses (name, nature, total_periods)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [name, nature, total_periods];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  // Busca todos os cursos
  async findAll() {
    const query = 'SELECT * FROM courses ORDER BY created_at DESC';
    const { rows } = await pool.query(query);
    return rows;
  }

  // Busca um curso por ID
  async findById(id) {
    const query = 'SELECT * FROM courses WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // Atualiza um curso
  async update(id, courseData, client = pool) {
    const { name, nature, total_periods } = courseData;
    const query = `
      UPDATE courses
      SET name = $1, nature = $2, total_periods = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const values = [name, nature, total_periods, id];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  // Deleta um curso
  async delete(id) {
    const query = 'DELETE FROM courses WHERE id = $1';
    await pool.query(query, [id]);
  }
}

module.exports = new CourseRepository();
