require('dotenv').config();

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
  adminPassword: process.env.ADMIN_PASSWORD
};

module.exports = { config };
