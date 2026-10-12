const { ZodError } = require('zod');

/**
 * Validates req.body against a Zod schema.
 * Calls next() on success, returns 400 with field errors on failure.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = (err.issues || err.errors || []).map(e => ({ field: e.path.join('.'), message: e.message }));
        return res.status(400).json({ error: 'Validation failed', details: errors });
      }
      next(err);
    }
  };
}

module.exports = { validate };
