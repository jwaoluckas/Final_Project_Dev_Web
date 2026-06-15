const express = require('express');
const ppcController = require('../controllers/ppcController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas de PPC exigem autenticação do usuário.
router.use(authenticate);

//CRUD DE ROTAS:
// Rota para criar um novo PPC.
router.post('/', ppcController.create);

// Rota para listar todos os PPCs.
router.get('/', ppcController.getAll);

// Rota para buscar um PPC específico por ID.
router.get('/:id', ppcController.getById);

// Rota para Editar PPC.
router.put('/:id', ppcController.update);

// Rota para deletar um PPC.
router.delete('/:id', ppcController.delete);

module.exports = router;
