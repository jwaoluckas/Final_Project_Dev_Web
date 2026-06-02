const { pool } = require('../database/pool');

class PeriodRepository {
  // Alteracao PPC: period_number 0 e usado pelo frontend como bloco especial de optativas.
  // Cria um novo perÃ­odo
  async create(periodData, client = pool) {
    const { course_id, period_number } = periodData;
    const query = `
      INSERT INTO periods (course_id, period_number)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [course_id, period_number];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  // Busca perÃ­odos por curso
  async findByCourseId(courseId) {
    const query = 'SELECT * FROM periods WHERE course_id = $1 ORDER BY period_number ASC';
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }

  // Deleta perÃ­odos por curso (usado em atualizaÃ§Ãµes completas)
  async deleteByCourseId(courseId, client = pool) {
    const query = 'DELETE FROM periods WHERE course_id = $1';
    await client.query(query, [courseId]);
  }
}

module.exports = new PeriodRepository();
