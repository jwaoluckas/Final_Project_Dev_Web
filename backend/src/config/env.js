const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env')
});

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${envName}`);
  }
}

const config = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'Gerador de PPCs <no-reply@gerador-ppcs.local>',
  smtpRejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
  passwordResetBaseUrl: process.env.PASSWORD_RESET_BASE_URL || 'http://127.0.0.1:5500/frontend'
};

module.exports = { config };
