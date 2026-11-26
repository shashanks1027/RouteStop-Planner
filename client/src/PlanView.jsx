// One plan: summary, ordered stops (move up/down, tick items, done), add/edit stops.
import { useEffect, useState } from 'react';
import { api } from './api';
import StopForm from './StopForm';

// Body for PUT: the stop's own fields, without _id and calculated schedule fields.
const toBody = ({ name, location, opensAt, closesAt, priority, travelMins, visitMins, items, completed }) => ({
  name, location, opensAt, closesAt, priority, travelMins, visitMins, completed,
  items: items.map(({ text, done }) => ({ text, done })),
});

export default function PlanView({ id, onChange, onDelete }) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // stop id, 'new', or null

  useEffect(() => { api.getPlan(id).then(setPlan, (e) => setError(e.message)); }, [id]);

  async function save(call) {
    setBusy(true);
    try {
      setPlan(await call());
      setError('');
      onChange();
    } catch (err) {
      setError(err.message);
      throw err; // lets StopForm show field errors
    } finally {
      setBusy(false);
    }
  }
  const run = (call) => save(call).catch(() => {}); // error already shown in the banner

  function move(i, dir) {
    const ids = plan.stops.map((s) => s._id);
    [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
    run(() => api.reorder(id, ids));
  }

  async function deletePlan() {
    if (!confirm(`Delete "${plan.title}"?`)) return;
    try {
      await api.deletePlan(id);
      onDelete();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!plan) return error ? <p className="error">⚠️ {error}</p> : <p className="muted">Loading…</p>;

  return (
    <section>
      <div className="plan-head">
        <h2>{plan.title}</h2>
        <label className="inline">
          Start
          <input type="time" value={plan.startTime} disabled={busy}
            onChange={(e) => e.target.value && run(() => api.updatePlan(id, { title: plan.title, startTime: e.target.value }))} />
        </label>
        <button className="btn danger" onClick={deletePlan}>Delete plan</button>
      </div>

      <p className="summary">
        {plan.stops.length} stops · est. finish <strong>{plan.endTime}</strong> ·{' '}
        <span className={plan.conflicts ? 'text-conflict' : ''}>{plan.conflicts} conflicts</span> ·{' '}
        <span className={plan.warnings ? 'text-warning' : ''}>{plan.warnings} warnings</span>
      </p>
      <p className="note">ℹ️ Times use <strong>your own estimates</strong>. This app does not calculate routes or pick the best order.</p>
      {error && <p className="error" role="alert">⚠️ {error}</p>}

      <ol className="stops">
        {plan.stops.map((s, i) =>
          editing === s._id ? (
            <li key={s._id}>
              <StopForm initial={s} onCancel={() => setEditing(null)}
                onSubmit={(body) => save(() => api.updateStop(id, s._id, body)).then(() => setEditing(null))} />
            </li>
          ) : (
            <li key={s._id} className={`card stop ${s.flag?.level || ''} ${s.completed ? 'done' : ''}`}>
              <div className="stop-head">
                <span className="num">{i + 1}</span>
                <h3>{s.name}</h3>
                <span className={`badge ${s.priority}`}>{s.priority}</span>
                <label className="inline">
                  <input type="checkbox" checked={s.completed} disabled={busy}
                    onChange={() => run(() => api.updateStop(id, s._id, { ...toBody(s), completed: !s.completed }))} />
                  Done
                </label>
              </div>
              <p className="muted">📍 {s.location}</p>
              <p>
                Open {s.opensAt}–{s.closesAt} · arrive <strong>{s.arrival}</strong> · leave <strong>{s.departure}</strong>
                <span className="muted"> (travel {s.travelMins}m, stay {s.visitMins}m)</span>
              </p>
              {s.flag && <p className={`flag ${s.flag.level}`}>{s.flag.level === 'conflict' ? 'Conflict' : 'Warning'}: {s.flag.message}</p>}
              {s.items.length > 0 && (
                <ul className="items">
                  {s.items.map((item, j) => (
                    <li key={item._id}>
                      <label className={item.done ? 'checked' : ''}>
                        <input type="checkbox" checked={item.done} disabled={busy}
                          onChange={() => run(() => api.updateStop(id, s._id, {
                            ...toBody(s),
                            items: s.items.map((it, k) => ({ text: it.text, done: k === j ? !it.done : it.done })),
                          }))} />
                        {item.text}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              <div className="actions">
                <button className="btn" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label="Move up">↑</button>
                <button className="btn" onClick={() => move(i, 1)} disabled={busy || i === plan.stops.length - 1} aria-label="Move down">↓</button>
                <button className="btn" onClick={() => setEditing(s._id)}>Edit</button>
                <button className="btn danger" disabled={busy}
                  onClick={() => confirm(`Delete "${s.name}"?`) && run(() => api.deleteStop(id, s._id))}>Delete</button>
              </div>
            </li>
          )
        )}
      </ol>

      {editing === 'new' ? (
        <StopForm onCancel={() => setEditing(null)}
          onSubmit={(body) => save(() => api.addStop(id, body)).then(() => setEditing(null))} />
      ) : (
        <button className="btn primary wide" onClick={() => setEditing('new')}>+ Add stop</button>
      )}
    </section>
  );
}
