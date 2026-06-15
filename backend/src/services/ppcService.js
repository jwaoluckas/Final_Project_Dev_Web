const { pool } = require('../database/pool');
const courseRepository = require('../repositories/courseRepository');
const periodRepository = require('../repositories/periodRepository');
const disciplineRepository = require('../repositories/disciplineRepository');

class PPCService {
  async createPPC(ppcData, userId) {
    const client = await pool.connect();
    try {
      // Salva curso, períodos, disciplinas e pré-requisitos em uma única transação executada.
      await client.query('BEGIN');

      const course = await courseRepository.create({
        name: ppcData.name,
        nature: ppcData.nature,
        total_periods: ppcData.total_periods,
        user_id: userId
      }, client);

      const disciplineMap = new Map();

      // Primeiro cria todas as disciplinas para depois conseguir ligar com pré-requisitos por nome selecionado(s).
      for (const periodData of ppcData.periods) {
        const period = await periodRepository.create({
          course_id: course.id,
          period_number: periodData.period_number
        }, client);

        for (const discData of periodData.disciplines) {
          const discipline = await disciplineRepository.create({
            period_id: period.id,
            name: discData.name,
            hours: discData.hours
          }, client);

          disciplineMap.set(discData.name, discipline.id);
          discData.temp_prerequisites = discData.prerequisites || [];
        }
      }

      // pré-requisitos múltiplos são permitidos na tabela de relacionamento.
      for (const periodData of ppcData.periods) {
        for (const discData of periodData.disciplines) {
          const disciplineId = disciplineMap.get(discData.name);
          for (const preReqName of discData.temp_prerequisites) {
            const preReqId = disciplineMap.get(preReqName);
            if (preReqId) {
              await disciplineRepository.addPrerequisite(disciplineId, preReqId, client);
            }
          }
        }
      }

      await client.query('COMMIT');
      return this.getPPCById(course.id, userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePPC(courseId, ppcData, userId) {
    const client = await pool.connect();
    try {
      // A edição recria a matriz do curso dentro de transação para manter consistência.
      await client.query('BEGIN');

      const existingCourse = await courseRepository.findByIdAndUserId(courseId, userId);
      if (!existingCourse) {
        await client.query('ROLLBACK');
        return null;
      }

      await courseRepository.update(courseId, userId, {
        name: ppcData.name,
        nature: ppcData.nature,
        total_periods: ppcData.total_periods
      }, client);

      await periodRepository.deleteByCourseId(courseId, client);

      const disciplineMap = new Map();

      // Depois de limpar os periodos antigos, recria a matriz enviada pelo frontend.
      for (const periodData of ppcData.periods) {
        const period = await periodRepository.create({
          course_id: courseId,
          period_number: periodData.period_number
        }, client);

        for (const discData of periodData.disciplines) {
          const discipline = await disciplineRepository.create({
            period_id: period.id,
            name: discData.name,
            hours: discData.hours
          }, client);

          disciplineMap.set(discData.name, discipline.id);
          discData.temp_prerequisites = discData.prerequisites || [];
        }
      }

      // Mantém os pré-requisitos após todas as disciplinas editadas existirem no banco de dados.
      for (const periodData of ppcData.periods) {
        for (const discData of periodData.disciplines) {
          const disciplineId = disciplineMap.get(discData.name);
          for (const preReqName of discData.temp_prerequisites) {
            const preReqId = disciplineMap.get(preReqName);
            if (preReqId) {
              await disciplineRepository.addPrerequisite(disciplineId, preReqId, client);
            }
          }
        }
      }

      await client.query('COMMIT');
      return this.getPPCById(courseId, userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPPCById(courseId, userId) {
    const course = await courseRepository.findByIdAndUserId(courseId, userId);
    if (!course) return null;

    const periods = await periodRepository.findByCourseId(courseId);
    const fullPPC = { ...course, periods: [] };

    for (const period of periods) {
      const disciplines = await disciplineRepository.findByPeriodId(period.id);
      const disciplinesWithPreReqs = [];

      for (const disc of disciplines) {
        const prerequisites = await disciplineRepository.findPrerequisites(disc.id);
        disciplinesWithPreReqs.push({ ...disc, prerequisites });
      }

      fullPPC.periods.push({ ...period, disciplines: disciplinesWithPreReqs });
    }

    return fullPPC;
  }

  async listAllPPCs(userId) {
    return await courseRepository.findAllByUserId(userId);
  }

  async deletePPC(courseId, userId) {
    return await courseRepository.deleteByIdAndUserId(courseId, userId);
  }
}

module.exports = new PPCService();
