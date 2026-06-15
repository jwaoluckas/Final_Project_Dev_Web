const { config } = require('../config/env');

function getNodemailer() {
  try {
    return require('nodemailer');
  } catch (error) {
    throw new Error('Dependencia nodemailer nao instalada. Rode npm install no backend.');
  }
}

// Garante que as credenciais SMTP foram configuradas antes de tentar enviar e-mail.
function validarConfigSmtp() {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    throw new Error('SMTP_HOST, SMTP_USER e SMTP_PASS devem estar configurados para enviar recuperacao de senha.');
  }
}

async function sendPasswordResetEmail({ to, resetLink }) {
  validarConfigSmtp();

  // Usa modelo SMTP genérico no desenvolvimento atual das credenciais no Mailtrap.
  const nodemailer = getNodemailer();
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    },
    tls: {
      rejectUnauthorized: config.smtpRejectUnauthorized
    }
  });

  await transporter.sendMail({
    from: config.smtpFrom,
    to,
    subject: 'Redefinicao de senha - Gerador de PPCs',
    text: [
      'Voce solicitou a redefinicao de senha do Gerador de PPCs.',
      '',
      'Acesse o link abaixo para criar uma nova senha:',
      resetLink,
      '',
      'Se voce nao solicitou esta alteracao, ignore este e-mail.'
    ].join('\n')
  });
}

module.exports = {
  sendPasswordResetEmail
};
