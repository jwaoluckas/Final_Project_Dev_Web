const fs = require('fs');
const path = require('path');

const { pool } = require('./pool');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log(`Migration executada: ${file}`);
  }
}

runMigrations()
  .then(() => {
    console.log('Migrations finalizadas.');
  })
  .catch((error) => {
    console.error('Erro ao executar migrations:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
