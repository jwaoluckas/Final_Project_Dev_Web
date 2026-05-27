const bcrypt = require('bcryptjs');

const { config } = require('../config/env');
const { pool } = require('../database/pool');
const userRepository = require('../repositories/userRepository');

async function createAdminUser() {
  if (!config.adminEmail || !config.adminPassword) {
    throw new Error('ADMIN_EMAIL e ADMIN_PASSWORD devem estar configurados no .env para executar o seed.');
  }

  const existingUser = await userRepository.findByEmail(config.adminEmail);

  if (existingUser) {
    console.log(`Usuario inicial ja existe: ${config.adminEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(config.adminPassword, 12);
  const user = await userRepository.createUser({
    email: config.adminEmail,
    passwordHash
  });

  console.log(`Usuario inicial criado: ${user.email}`);
}

createAdminUser()
  .catch((error) => {
    console.error('Erro ao criar usuario inicial:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
