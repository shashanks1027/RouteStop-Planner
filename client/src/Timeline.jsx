// The day at a glance: one row per stop, in visiting order. Each row shows the opening hours as a band,
// then travel, any wait, and the visit itself. A visit that runs past closing turns red.
import { motion } from 'motion/react';

// "13:05" or "00:30 (+1d)" -> minutes from midnight of the start day
function toMin(t) {
  const [hm, day] = t.split(' (+');
  return Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5)) + (day ? parseInt(day, 10) * 1440 : 0);
}
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
// A clock time with a "+1d" marker once the plan runs past midnight.
const Clock = ({ m }) => <>{hhmm(m)}{m >= 1440 && <sup className="day">+{Math.floor(m / 1440)}d</sup>}</>;
// The smallest hour step that keeps the axis to six or seven labels, however long the day runs.
const STEPS = [60, 120, 180, 240, 360, 480, 720, 1440];

export default function Timeline({ plan }) {
  const rows = plan.stops.map((s) => {
    const arrive = toMin(s.arrival);
    const leave = toMin(s.departure);
    return { s, open: toMin(s.opensAt), close: toMin(s.closesAt), arrive, leave, visitFrom: leave - s.visitMins, travelFrom: arrive - s.travelMins };
  });

  const lo = Math.floor(Math.min(toMin(plan.startTime), ...rows.map((r) => r.open)) / 60) * 60;
  const hi = Math.ceil(Math.max(toMin(plan.endTime), ...rows.map((r) => r.close)) / 60) * 60;
  const span = Math.max(hi - lo, 60);
  const step = STEPS.find((s) => span / s <= 6) ?? 1440;
  const ticks = [];
  for (let m = lo; m <= hi; m += step) ticks.push(m);

  const pct = (m) => `${((m - lo) / span) * 100}%`;
  const bar = (from, to) => ({ left: pct(from), width: `${(Math.max(to - from, 0) / span) * 100}%` });
  const align = (m) => { const p = (m - lo) / span; return p < 0.22 ? 'start' : p > 0.78 ? 'end' : 'center'; };

  return (
    <section className="panel timeline" aria-labelledby="timeline-heading">
      <div className="section-head">
        <h3 id="timeline-heading" className="panel-title">Timeline</h3>
        <span className="hint mono"><Clock m={lo} />–<Clock m={hi} /></span>
      </div>

      <div className="tl" style={{ '--tick': `${(step / span) * 100}%` }}>
        <div className="tl-axis" aria-hidden="true">
          <span />
          <div className="tl-ticks">
            {ticks.map((m, k) => (
              <span key={m} style={{ left: pct(m) }} data-edge={k === 0 ? 'start' : m + step > hi ? 'end' : undefined}><Clock m={m} /></span>
            ))}
          </div>
        </div>

        <ol className="tl-rows">
          {rows.map(({ s, open, close, arrive, leave, visitFrom, travelFrom }, i) => {
            const level = s.flag?.level;
            const summary = `${s.name}: arrive ${s.arrival}, leave ${s.departure}, open ${s.opensAt} to ${s.closesAt}${s.flag ? `. ${s.flag.message}` : ''}`;
            return (
              <motion.li key={s._id} layout="position" className="tl-row" data-flag={level} data-done={s.completed || undefined}
                tabIndex={0} aria-label={summary}>
                <span className="tl-label"><span className="tl-num mono">{i + 1}</span><span className="tl-name">{s.name}</span></span>
                <div className="tl-track">
                  <span className="tl-open" style={bar(open, close)} />
                  {s.travelMins > 0 && <span className="tl-travel" style={bar(travelFrom, arrive)} />}
                  {visitFrom > arrive && <span className="tl-wait" style={bar(arrive, visitFrom)} />}
                  <span className="tl-visit" style={bar(visitFrom, leave)} />
                  {close < leave && <span className="tl-close" style={{ left: pct(close) }} />}
                  <span className="tl-tip" data-align={align((visitFrom + leave) / 2)} style={{ left: pct((visitFrom + leave) / 2) }} aria-hidden="true">
                    <strong>{s.name}</strong>
                    <span className="mono">{s.arrival} → {s.departure}</span>
                    <span>Open <span className="mono">{s.opensAt}–{s.closesAt}</span></span>
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <ul className="tl-legend" aria-label="Legend">
        <li><span className="key key-open" />Opening hours</li>
        <li><span className="key key-travel" />Travel</li>
        <li><span className="key key-wait" />Waiting for it to open</li>
        <li><span className="key key-visit" />Your visit</li>
        <li><span className="key key-crit" />Runs past closing</li>
      </ul>
    </section>
  );
}
