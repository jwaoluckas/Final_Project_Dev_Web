const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const ppcRoutes = require('./routes/ppcRoutes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

// Alteracao PPC: registra as rotas de criar, listar, editar, visualizar e deletar PPCs.
app.use('/api/ppc', ppcRoutes);
app.use(errorHandler);

module.exports = app;
