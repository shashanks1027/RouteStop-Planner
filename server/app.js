// Express app (no listen here, so tests can import it).
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use('/api/plans', require('./routes/plans'));
app.use(express.static(path.join(__dirname, '../client/dist'))); // built React app (after `npm run build`)

app.use((req, res) => res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } }));

// Central error handler: every error leaves as { error: { message } }.
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  if (err.type === 'entity.parse.failed') message = 'Request body is not valid JSON';
  if (err.name === 'ValidationError') status = 400;
  if (err.name === 'MongooseServerSelectionError') [status, message] = [503, 'Database is not available'];
  if (status === 500) {
    console.error(err);
    message = 'Internal server error';
  }
  res.status(status).json({ error: { message } });
});

module.exports = app;
