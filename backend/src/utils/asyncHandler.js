/**
 * Wraps an async express route handler to catch errors and pass them to next().
 * Eliminates the need for repetitive try/catch blocks in controllers.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
