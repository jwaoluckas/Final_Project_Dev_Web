const app = require('./app');
const { config } = require('./config/env');

app.listen(config.port, () => {
  console.log(`Servidor rodando em http://localhost:${config.port}`);
});
