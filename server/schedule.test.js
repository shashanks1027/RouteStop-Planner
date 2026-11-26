const { buildSchedule } = require('./schedule');

const stop = (o = {}) => ({ opensAt: '09:00', closesAt: '17:00', travelMins: 10, visitMins: 20, ...o });
const level = (s) => s.flag?.level;

test('stops that fit their window have no flags', () => {
  const s = buildSchedule('10:00', [stop(), stop()]);
  expect(s.stops.map((x) => [x.arrival, x.departure, x.flag])).toEqual([['10:10', '10:30', null], ['10:40', '11:00', null]]);
  expect(s.endTime).toBe('11:00');
});

test('arriving early waits and pushes later stops back', () => {
  const s = buildSchedule('08:00', [stop({ travelMins: 15 }), stop({ travelMins: 5 })]);
  expect(level(s.stops[0])).toBe('warning');
  expect(s.stops[1].arrival).toBe('09:25');
});

test('arriving after closing or leaving after closing is a conflict; leaving at closing is fine', () => {
  expect(level(buildSchedule('17:30', [stop()]).stops[0])).toBe('conflict');
  expect(level(buildSchedule('16:45', [stop({ travelMins: 0, visitMins: 30 })]).stops[0])).toBe('conflict');
  expect(buildSchedule('16:30', [stop({ travelMins: 0, visitMins: 30 })]).stops[0].flag).toBeNull();
});

test('reordering the same stops changes the conflicts', () => {
  const bank = stop({ opensAt: '10:00', closesAt: '14:00', travelMins: 20, visitMins: 30 });
  const market = stop({ opensAt: '07:00', closesAt: '22:00', travelMins: 20, visitMins: 180 });
  expect(buildSchedule('10:00', [market, bank]).conflicts).toBe(1);
  expect(buildSchedule('10:00', [bank, market]).conflicts).toBe(0);
});

test('past midnight is shown as next day', () => {
  expect(buildSchedule('23:30', [stop({ opensAt: '00:00', closesAt: '23:59', travelMins: 0, visitMins: 60 })]).endTime).toBe('00:30 (+1d)');
});
