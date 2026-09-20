/** 404 for any route the app doesn't know. */
export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler — logs, then responds. Last middleware registered. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);

  // Mongo errors (timeouts, "not connected") → 503, not a generic 500.
  const status = err.serverSelectionError || err.code === "ENOENT" ? 503 : err.statusCode || 500;

  res.status(status).json({
    error: status === 500 ? "Internal server error" : err.message,
  });
}
