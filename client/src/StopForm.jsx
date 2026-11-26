// Add/edit a stop. The browser checks required/range rules; the server's field errors show under each field.
import { useState } from 'react';

const DEFAULTS = { name: '', location: '', opensAt: '09:00', closesAt: '18:00', priority: 'medium', travelMins: 15, visitMins: 15, items: [], completed: false };

export default function StopForm({ initial = DEFAULTS, onSubmit, onCancel }) {
  const [errors, setErrors] = useState({});

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    // One item per line; an edited list keeps the ticks of lines that didn't change.
    const items = f.items.split('\n').map((t) => t.trim()).filter(Boolean)
      .map((text) => ({ text, done: initial.items.some((it) => it.text === text && it.done) }));
    try {
      await onSubmit({ ...f, items, travelMins: Number(f.travelMins), visitMins: Number(f.visitMins), completed: initial.completed });
    } catch (err) {
      setErrors(Object.fromEntries((err.details || []).map((d) => [d.field.split('[')[0], d.message])));
    }
  }

  const field = (label, name, props) => (
    <label>
      {label}
      <input name={name} defaultValue={initial[name]} required {...props} />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </label>
  );

  return (
    <form className="card form" onSubmit={submit}>
      <div className="row">
        {field('Stop name', 'name', { maxLength: 80, placeholder: 'e.g. Post office' })}
        <label>
          Priority
          <select name="priority" defaultValue={initial.priority}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
      {field('Location', 'location', { maxLength: 150, placeholder: 'e.g. MG Road branch' })}
      <div className="row">
        {field('Opens at', 'opensAt', { type: 'time' })}
        {field('Closes at', 'closesAt', { type: 'time' })}
      </div>
      <div className="row">
        {field('Travel from previous stop (min)', 'travelMins', { type: 'number', min: 0, max: 600 })}
        {field('Time needed here (min)', 'visitMins', { type: 'number', min: 1, max: 600 })}
      </div>
      <label>
        Things to bring / do (one per line)
        <textarea name="items" rows={3} defaultValue={initial.items.map((i) => i.text).join('\n')} />
        {errors.items && <span className="field-error">{errors.items}</span>}
      </label>
      <div className="actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn primary">{initial === DEFAULTS ? 'Add stop' : 'Save'}</button>
      </div>
    </form>
  );
}
