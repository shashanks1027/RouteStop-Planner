// Add/edit a stop. The browser checks required/range rules; the server's field errors show under each field.
import { useEffect, useRef, useState } from 'react';

const DEFAULTS = { name: '', location: '', opensAt: '09:00', closesAt: '18:00', priority: 'medium', travelMins: 15, visitMins: 15, items: [], completed: false };
const PRIORITIES = ['high', 'medium', 'low'];

export default function StopForm({ initial = DEFAULTS, onSubmit, onCancel }) {
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const isNew = initial === DEFAULTS;

  // A new stop's form opens at the bottom of the list: bring it into view.
  useEffect(() => {
    if (isNew) formRef.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [isNew]);

  async function submit(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    // One item per line; an edited list keeps the ticks of lines that didn't change.
    const items = f.items.split('\n').map((t) => t.trim()).filter(Boolean)
      .map((text) => ({ text, done: initial.items.some((it) => it.text === text && it.done) }));
    setSaving(true);
    try {
      await onSubmit({ ...f, items, travelMins: Number(f.travelMins), visitMins: Number(f.visitMins), completed: initial.completed });
    } catch (err) {
      const details = err.details || [];
      setErrors(Object.fromEntries(details.map((d) => [d.field.split('[')[0], d.message])));
      setFormError(details.length ? 'Check the highlighted fields.' : err.message);
      setSaving(false);
    }
  }

  const field = (label, name, props) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <input name={name} defaultValue={initial[name]} required aria-invalid={errors[name] ? true : undefined} {...props} />
      {errors[name] && <span className="field-error">{errors[name]}</span>}
    </label>
  );

  return (
    <form ref={formRef} className="stop-form" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <h3 className="form-title">{isNew ? 'New stop' : `Edit ${initial.name}`}</h3>
      <div className="row">
        {field('Stop name', 'name', { maxLength: 80, placeholder: 'e.g. Post office', autoFocus: true, autoComplete: 'off' })}
        {field('Location', 'location', { maxLength: 150, placeholder: 'e.g. MG Road branch', autoComplete: 'off' })}
      </div>

      <fieldset className="segmented">
        <legend className="field-label">Priority</legend>
        <div className="segmented-options">
          {PRIORITIES.map((p) => (
            <label key={p}>
              <input type="radio" name="priority" value={p} defaultChecked={initial.priority === p} />
              <span>{p[0].toUpperCase() + p.slice(1)}</span>
            </label>
          ))}
        </div>
        {errors.priority && <span className="field-error">{errors.priority}</span>}
      </fieldset>

      <div className="row">
        {field('Opens at', 'opensAt', { type: 'time' })}
        {field('Closes at', 'closesAt', { type: 'time' })}
      </div>
      <div className="row">
        {field('Travel from last stop (min)', 'travelMins', { type: 'number', min: 0, max: 600, inputMode: 'numeric' })}
        {field('Time needed here (min)', 'visitMins', { type: 'number', min: 1, max: 600, inputMode: 'numeric' })}
      </div>

      <label className="field">
        <span className="field-label">Things to bring or do <span className="field-hint">one per line</span></span>
        <textarea name="items" rows={3} defaultValue={initial.items.map((i) => i.text).join('\n')} placeholder={'Passbook\nAadhaar card'} />
        {errors.items && <span className="field-error">{errors.items}</span>}
      </label>

      {formError && <p className="form-error" role="alert">{formError}</p>}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Add stop' : 'Save stop'}</button>
      </div>
    </form>
  );
}
