const { pool } = require('../database/pool');

class DisciplineRepository {
  // Alteracao PPC: disciplina continua usando nome e horas; pre-requisitos ficam em tabela separada.
  // Cria uma nova disciplina
  async create(disciplineData, client = pool) {
    const { period_id, name, hours } = disciplineData;
    const query = `
      INSERT INTO disciplines (period_id, name, hours)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [period_id, name, hours];
    const { rows } = await client.query(query, values);
    return rows[0];
  }

  // Busca disciplinas por período
  async findByPeriodId(periodId) {
    const query = 'SELECT * FROM disciplines WHERE period_id = $1 ORDER BY name ASC';
    const { rows } = await pool.query(query, [periodId]);
    return rows;
  }

  // Busca disciplinas por curso (através dos períodos)
  async findByCourseId(courseId) {
    const query = `
      SELECT d.*, p.period_number 
      FROM disciplines d
      JOIN periods p ON d.period_id = p.id
      WHERE p.course_id = $1
      ORDER BY p.period_number, d.name
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }

  // Adiciona pré-requisito
  // Alteracao PPC: grava cada pre-requisito como uma linha na tabela discipline_prerequisites.
  async addPrerequisite(disciplineId, prerequisiteId, client = pool) {
    const query = `
      INSERT INTO discipline_prerequisites (discipline_id, prerequisite_discipline_id)
      VALUES ($1, $2)
    `;
    await client.query(query, [disciplineId, prerequisiteId]);
  }

  // Busca pré-requisitos de uma disciplina
  async findPrerequisites(disciplineId) {
    const query = `
      SELECT d.* 
      FROM disciplines d
      JOIN discipline_prerequisites dp ON d.id = dp.prerequisite_discipline_id
      WHERE dp.discipline_id = $1
    `;
    const { rows } = await pool.query(query, [disciplineId]);
    return rows;
  }
}

module.exports = new DisciplineRepository();
