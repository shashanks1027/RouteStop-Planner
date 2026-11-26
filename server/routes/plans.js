// REST routes for plans and their stops. Express 5 forwards async errors to the error handler.
const router = require('express').Router();
const { matchedData } = require('express-validator');
const Plan = require('../models/Plan');
const { buildSchedule } = require('../schedule');
const v = require('../validation');

const httpError = (status, message) => Object.assign(new Error(message), { status });
const data = (req) => matchedData(req, { locations: ['body'] }); // only validated fields get saved

// Plan + calculated schedule (never stored, so it always matches the current order).
function withSchedule(plan) {
  const obj = plan.toObject();
  const s = buildSchedule(obj.startTime, obj.stops);
  obj.stops = obj.stops.map((stop, i) => ({ ...stop, ...s.stops[i] }));
  return { ...obj, endTime: s.endTime, conflicts: s.conflicts, warnings: s.warnings };
}

async function findPlan(id) {
  const plan = await Plan.findById(id);
  if (!plan) throw httpError(404, 'Plan not found');
  return plan;
}

function findStop(plan, stopId) {
  const stop = plan.stops.id(stopId);
  if (!stop) throw httpError(404, 'Stop not found');
  return stop;
}

router.get('/', async (req, res) => {
  const plans = await Plan.find();
  res.json(plans.map((p) => {
    const { _id, title, startTime, stops, conflicts } = withSchedule(p);
    return { _id, title, startTime, stopCount: stops.length, conflicts };
  }));
});

router.post('/', v.plan, v.validate, async (req, res) => {
  res.status(201).json(withSchedule(await Plan.create(data(req))));
});

router.get('/:id', v.planId, v.validate, async (req, res) => {
  res.json(withSchedule(await findPlan(req.params.id)));
});

router.put('/:id', v.planId, v.plan, v.validate, async (req, res) => {
  const plan = await findPlan(req.params.id);
  plan.set(data(req));
  res.json(withSchedule(await plan.save()));
});

router.delete('/:id', v.planId, v.validate, async (req, res) => {
  await (await findPlan(req.params.id)).deleteOne();
  res.status(204).end();
});

router.post('/:id/stops', v.planId, v.stop, v.validate, async (req, res) => {
  const plan = await findPlan(req.params.id);
  plan.stops.push(data(req));
  res.status(201).json(withSchedule(await plan.save()));
});

router.put('/:id/stops/:stopId', v.stopId, v.stop, v.validate, async (req, res) => {
  const plan = await findPlan(req.params.id);
  findStop(plan, req.params.stopId).set(data(req));
  res.json(withSchedule(await plan.save()));
});

router.delete('/:id/stops/:stopId', v.stopId, v.validate, async (req, res) => {
  const plan = await findPlan(req.params.id);
  findStop(plan, req.params.stopId).deleteOne();
  res.json(withSchedule(await plan.save()));
});

// Body: { order: [stopId, ...] } listing every stop exactly once.
router.patch('/:id/stops/reorder', v.planId, v.reorder, v.validate, async (req, res) => {
  const plan = await findPlan(req.params.id);
  const { order } = req.body;
  const current = plan.stops.map((s) => s.id);
  if (order.length !== current.length || new Set(order).size !== order.length || !order.every((id) => current.includes(id))) {
    throw httpError(400, 'order must list every stop in this plan exactly once');
  }
  plan.stops = order.map((id) => plan.stops.id(id).toObject());
  res.json(withSchedule(await plan.save()));
});

module.exports = router;
