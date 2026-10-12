/**
 * Centralized error handler. Must be the LAST middleware registered.
 * Never exposes stack traces in production.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error('[ERROR]', err);
  
  if (err.name === 'ZodError') {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ error: message, details: err.errors });
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (status < 500 ? err.message : 'Internal server error')
    : err.message;
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
