function errorHandler(error, req, res, next) {
  console.error(error.message);
  return res.status(500).json({ message: 'Erro interno no servidor.' });
}

module.exports = { errorHandler };
