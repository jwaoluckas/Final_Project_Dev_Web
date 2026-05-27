const { Router } = require('express');

const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
