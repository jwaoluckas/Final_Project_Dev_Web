const { Router } = require('express');

const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = Router();

router.post('/login', authController.login);
// Envia link de recuperacão de senha por SMTP/Mailtrap.
router.post('/forgot-password', authController.forgotPassword);
// Recebe token do e-mail e grava a nova senha no banco.
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
