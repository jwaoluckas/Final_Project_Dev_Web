const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use(errorHandler);

module.exports = app;
