const ppcService = require('../services/ppcService');

class PPCController {
  // Criar um novo PPC
  async create(req, res, next) {
    try {
      const ppc = await ppcService.createPPC(req.body, req.user.id);
      res.status(201).json(ppc);
    } catch (error) {
      next(error);
    }
  }

  // Listar todos os PPCs
  async getAll(req, res, next) {
    try {
      const ppcs = await ppcService.listAllPPCs(req.user.id);
      res.json(ppcs);
    } catch (error) {
      next(error);
    }
  }

  // Buscar um PPC por ID
  async getById(req, res, next) {
    try {
      const ppc = await ppcService.getPPCById(req.params.id, req.user.id);
      if (!ppc) {
        return res.status(404).json({ message: 'PPC não encontrado' });
      }
      res.json(ppc);
    } catch (error) {
      next(error);
    }
  }

  // Atualizar um PPC
  async update(req, res, next) {
    try {
      const ppc = await ppcService.updatePPC(req.params.id, req.body, req.user.id);
      if (!ppc) {
        return res.status(404).json({ message: 'PPC nao encontrado' });
      }
      res.json(ppc);
    } catch (error) {
      next(error);
    }
  }

  // Deletar um PPC
  async delete(req, res, next) {
    try {
      const deleted = await ppcService.deletePPC(req.params.id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: 'PPC nao encontrado' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PPCController();
