// Walks the stops in the user's order and estimates arrival/departure from the
// user's own travel and visit minutes. Flags time-window conflicts. No routing.

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

function toHHMM(min) {
  const day = Math.floor(min / 1440);
  const t = `${String(Math.floor((min % 1440) / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  return day ? `${t} (+${day}d)` : t;
}

function buildSchedule(startTime, stops) {
  let clock = toMin(startTime);

  const out = stops.map((stop) => {
    const arrival = clock + stop.travelMins;
    const wait = Math.max(0, toMin(stop.opensAt) - arrival);
    const departure = arrival + wait + stop.visitMins;
    const closes = toMin(stop.closesAt);
    clock = departure;

    let flag = null;
    if (arrival >= closes) {
      flag = { level: 'conflict', message: `Arrives at ${toHHMM(arrival)}, but it closes at ${stop.closesAt}.` };
    } else if (departure > closes) {
      flag = { level: 'conflict', message: `Needs until ${toHHMM(departure)}, but it closes at ${stop.closesAt}.` };
    } else if (wait > 0) {
      flag = { level: 'warning', message: `Arrives ${wait} min before it opens. You will wait.` };
    }
    return { arrival: toHHMM(arrival), departure: toHHMM(departure), flag };
  });

  return {
    stops: out,
    endTime: toHHMM(clock),
    conflicts: out.filter((s) => s.flag?.level === 'conflict').length,
    warnings: out.filter((s) => s.flag?.level === 'warning').length,
  };
}

module.exports = { buildSchedule, toMin };
