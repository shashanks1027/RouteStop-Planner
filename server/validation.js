// Input validation at the API boundary (express-validator).
const { body, param, validationResult } = require('express-validator');
const { toMin } = require('./schedule');

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const time = (f) => body(f).matches(TIME).withMessage('Use HH:MM (24-hour) time');
const text = (f, max) =>
  body(f).isString().trim().notEmpty().withMessage('Required').isLength({ max }).withMessage(`Max ${max} characters`);

// Sends 400 with field errors, or continues to the handler.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  res.status(400).json({
    error: { message: 'Validation failed', details: errors.array().map((e) => ({ field: e.path, message: e.msg })) },
  });
}

const id = (name) => param(name).isMongoId().withMessage(`Invalid ${name}`);

module.exports = {
  validate,
  planId: [id('id')],
  stopId: [id('id'), id('stopId')],
  plan: [text('title', 80), time('startTime')],
  stop: [
    text('name', 80),
    text('location', 150),
    time('opensAt'),
    time('closesAt').custom((v, { req }) => {
      if (TIME.test(req.body.opensAt) && toMin(v) <= toMin(req.body.opensAt)) {
        throw new Error('Closing time must be after opening time');
      }
      return true;
    }),
    body('priority').isIn(['high', 'medium', 'low']).withMessage('Priority must be high, medium or low'),
    body('travelMins').isInt({ min: 0, max: 600 }).withMessage('0 to 600 minutes').toInt(),
    body('visitMins').isInt({ min: 1, max: 600 }).withMessage('1 to 600 minutes').toInt(),
    body('items').optional().isArray({ max: 30 }).withMessage('Max 30 items'),
    text('items.*.text', 100),
    body('items.*.done').optional().isBoolean({ strict: true }),
    body('completed').optional().isBoolean({ strict: true }),
  ],
  reorder: [body('order').isArray({ min: 1 }).withMessage('order must be a list of stop ids'), body('order.*').isMongoId()],
};
