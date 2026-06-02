const express = require('express');
const ppcController = require('../controllers/ppcController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas de PPC exigem autenticaÃ§Ã£o
// Alteracao PPC: protege as rotas de PPC com o mesmo middleware de autenticacao do sistema.
router.use(authenticate);

// Rota para criar um novo PPC
router.post('/', ppcController.create);

// Rota para listar todos os PPCs
router.get('/', ppcController.getAll);

// Rota para buscar um PPC especÃ­fico
router.get('/:id', ppcController.getById);

// Alteracao PPC: endpoint de edicao usado pela tela pagina_editar_ppc.
router.put('/:id', ppcController.update);

// Rota para deletar um PPC
router.delete('/:id', ppcController.delete);

module.exports = router;
