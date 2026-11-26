// One plan: summary, timeline, ordered stops (drag or move up/down, tick items, done), add/edit stops.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { toast } from 'sonner';
import { api } from './api';
import StopForm from './StopForm';
import Timeline from './Timeline';
import HoldButton from './HoldButton';
import {
  ArrowDownIcon, ArrowUpIcon, BagIcon, CheckIcon, ClockIcon, ConflictIcon, FlagIcon, GripIcon,
  InfoIcon, PencilIcon, PinIcon, PlusIcon, TrashIcon, WarningIcon,
} from './Icons';

// Body for PUT: the stop's own fields, without _id and calculated schedule fields.
const toBody = ({ name, location, opensAt, closesAt, priority, travelMins, visitMins, items, completed }) => ({
  name, location, opensAt, closesAt, priority, travelMins, visitMins, completed,
  items: items.map(({ text, done }) => ({ text, done })),
});

const ids = (stops) => stops.map((s) => s._id).join();

// "00:30 (+1d)" -> ["00:30", "+1d"]
const splitDay = (t = '') => {
  const [time, day] = t.split(' (');
  return [time, day && day.replace(')', '')];
};
const Time = ({ value }) => {
  const [time, day] = splitDay(value);
  return <>{time}{day && <sup className="day">{day}</sup>}</>;
};

export default function PlanView({ id, onChange, onDelete }) {
  const [plan, setPlanState] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // stop id, 'new', or null
  const [renaming, setRenaming] = useState(false);
  const planRef = useRef(null);
  const queue = useRef(Promise.resolve());
  const pending = useRef(0);
  const dragging = useRef(null); // order before the drag started

  const setPlan = (p) => { planRef.current = p; setPlanState(p); };

  useEffect(() => { api.getPlan(id).then(setPlan, (e) => setError(e.message)); }, [id]);

  // Saves run one at a time, in order. The screen changes at once; the server's answer
  // (fresh times and flags) replaces it when the last queued save is back.
  function sync(optimistic, call) {
    if (optimistic) setPlan(optimistic);
    pending.current++;
    const job = queue.current.then(call).then(
      (fresh) => {
        pending.current--;
        if (!pending.current && fresh && !dragging.current) setPlan(fresh);
        setError('');
        onChange();
        return fresh;
      },
      async (err) => {
        pending.current--;
        toast.error(err.message);
        try { setPlan(await api.getPlan(id)); } catch { /* the banner below covers it */ }
        throw err;
      }
    );
    queue.current = job.catch(() => {});
    return job;
  }

  // Forms wait their turn too, but their errors go back to the form (field messages).
  async function submit(call) {
    const job = queue.current.then(call);
    queue.current = job.catch(() => {});
    const fresh = await job;
    setPlan(fresh);
    setEditing(null);
    onChange();
  }

  const current = () => planRef.current;
  const withStops = (stops) => ({ ...current(), stops });

  function updateStop(stopId, changes) {
    const stop = { ...current().stops.find((s) => s._id === stopId), ...changes };
    sync(withStops(current().stops.map((s) => (s._id === stopId ? stop : s))), () => api.updateStop(id, stopId, toBody(stop)));
  }

  function toggleItem(stopId, j) {
    const stop = current().stops.find((s) => s._id === stopId);
    updateStop(stopId, { items: stop.items.map((it, k) => (k === j ? { ...it, done: !it.done } : it)) });
  }

  function saveOrder(stops) {
    sync(withStops(stops), () => api.reorder(id, stops.map((s) => s._id)));
  }

  function move(i, dir) {
    const stops = [...current().stops];
    if (!stops[i + dir]) return;
    [stops[i], stops[i + dir]] = [stops[i + dir], stops[i]];
    saveOrder(stops);
  }

  function deleteStop(stop) {
    const index = current().stops.findIndex((s) => s._id === stop._id);
    sync(withStops(current().stops.filter((s) => s._id !== stop._id)), () => api.deleteStop(id, stop._id)).catch(() => {});
    toast(`Removed "${stop.name}"`, { duration: 8000, action: { label: 'Undo', onClick: () => restoreStop(stop, index) } });
  }

  // Undo: add the stop again (it lands last), then put it back where it was.
  function restoreStop(stop, index) {
    sync(null, async () => {
      const added = await api.addStop(id, toBody(stop));
      const order = added.stops.map((s) => s._id);
      const newId = order.pop();
      order.splice(Math.min(index, order.length), 0, newId);
      return api.reorder(id, order);
    }).catch(() => {});
  }

  function setStart(startTime) {
    if (!startTime) return;
    sync({ ...current(), startTime }, () => api.updatePlan(id, { title: current().title, startTime }));
  }

  function rename(title) {
    setRenaming(false);
    title = title.trim();
    if (!title || title === current().title) return;
    sync({ ...current(), title }, () => api.updatePlan(id, { title, startTime: current().startTime }));
  }

  async function deletePlan() {
    const { title } = current();
    try {
      await queue.current;
      await api.deletePlan(id);
      toast(`Deleted "${title}"`);
      onDelete();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!plan) {
    return error ? <div className="banner" role="alert"><ConflictIcon /><span>{error}</span></div> : <PlanSkeleton />;
  }

  const done = plan.stops.filter((s) => s.completed).length;

  return (
    <section className="plan" aria-labelledby="plan-title">
      <header className="plan-head">
        <div className="plan-name">
          <p className="eyebrow">Plan</p>
          {renaming ? (
            <input className="title-input" defaultValue={plan.title} maxLength={80} autoFocus aria-label="Plan name"
              onBlur={(e) => rename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setRenaming(false);
              }} />
          ) : (
            <div className="title-row">
              <h2 id="plan-title" className="plan-heading">{plan.title}</h2>
              <button className="icon-btn" onClick={() => setRenaming(true)} aria-label="Rename plan"><PencilIcon /></button>
            </div>
          )}
        </div>
        <div className="plan-controls">
          <label className="field field-inline">
            <span className="field-label">Start</span>
            <input type="time" value={plan.startTime} onChange={(e) => setStart(e.target.value)} />
          </label>
          <HoldButton onComplete={deletePlan} hint="Hold the button to delete this plan">
            <TrashIcon size={16} /> Hold to delete
          </HoldButton>
        </div>
      </header>

      <dl className="stats">
        <div className="stat">
          <dt>Stops</dt>
          <dd><span className="stat-value" key={plan.stops.length}>{plan.stops.length}</span><span className="stat-sub">{done} done</span></dd>
        </div>
        <div className="stat">
          <dt>Est. finish</dt>
          <dd><span className="stat-value" key={plan.endTime}><Time value={plan.endTime} /></span></dd>
        </div>
        <div className={`stat ${plan.conflicts ? 'is-crit' : ''}`}>
          <dt>{plan.conflicts > 0 && <ConflictIcon size={15} />}Conflicts</dt>
          <dd><span className="stat-value" key={plan.conflicts}>{plan.conflicts}</span></dd>
        </div>
        <div className={`stat ${plan.warnings ? 'is-warn' : ''}`}>
          <dt>{plan.warnings > 0 && <WarningIcon size={15} />}Warnings</dt>
          <dd><span className="stat-value" key={plan.warnings}>{plan.warnings}</span></dd>
        </div>
      </dl>

      <p className="note"><InfoIcon size={16} /><span>Times use <strong>your own estimates</strong>. RouteStop doesn&rsquo;t calculate routes or pick the best order.</span></p>
      {error && <div className="banner" role="alert"><ConflictIcon /><span>{error}</span></div>}

      {plan.stops.length > 0 && <Timeline plan={plan} />}

      <div className="route">
        <div className="route-cap">
          <span className="cap-node" aria-hidden="true" />
          <span>Start <span className="mono">{plan.startTime}</span></span>
        </div>

        <Reorder.Group as="ol" axis="y" className="stops" values={plan.stops}
          onReorder={(stops) => setPlan(withStops(stops))}>
          <AnimatePresence initial={false} mode="popLayout">
            {plan.stops.map((s, i) => (
              <StopItem key={s._id} stop={s} index={i} count={plan.stops.length} editing={editing === s._id}
                onEdit={() => setEditing(s._id)} onCancel={() => setEditing(null)}
                onSave={(body) => submit(() => api.updateStop(id, s._id, body))}
                onMove={(dir) => move(i, dir)}
                onToggleDone={() => updateStop(s._id, { completed: !s.completed })}
                onToggleItem={(j) => toggleItem(s._id, j)}
                onDelete={() => deleteStop(s)}
                onDragStart={() => { dragging.current = ids(current().stops); }}
                onDragEnd={() => {
                  const before = dragging.current;
                  dragging.current = null;
                  if (before !== ids(current().stops)) saveOrder(current().stops);
                }} />
            ))}
          </AnimatePresence>
        </Reorder.Group>

        <div className="route-cap">
          <span className="cap-node cap-finish" aria-hidden="true" />
          <span>Finish <span className="mono"><Time value={plan.endTime} /></span></span>
        </div>
      </div>

      {editing === 'new' ? (
        <StopForm onCancel={() => setEditing(null)} onSubmit={(body) => submit(() => api.addStop(id, body))} />
      ) : (
        <button className="btn btn-add" onClick={() => setEditing('new')}><PlusIcon /> Add stop</button>
      )}
    </section>
  );
}

function StopItem({ ref, stop, index, count, editing, onEdit, onCancel, onSave, onMove, onToggleDone, onToggleItem, onDelete, onDragStart, onDragEnd }) {
  const controls = useDragControls();
  const [lifted, setLifted] = useState(false);
  const level = stop.flag?.level;
  const packed = stop.items.filter((it) => it.done).length;

  return (
    <Reorder.Item ref={ref} as="li" value={stop} className={`stop-item ${lifted ? 'is-dragging' : ''}`}
      dragListener={false} dragControls={controls}
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.16, ease: [0.23, 1, 0.32, 1] } }}
      whileDrag={{ scale: 1.015 }}
      onDragStart={() => { setLifted(true); onDragStart(); }}
      onDragEnd={() => { setLifted(false); onDragEnd(); }}>
      <div className="leg">
        <span />
        <span className="leg-label"><span className="mono">{stop.travelMins} min</span> {index === 0 ? 'from start' : 'travel'}</span>
      </div>

      <div className="stop-row">
        <div className="rail">
          <span className={`node ${stop.completed ? 'node-done' : level ? `node-${level}` : ''}`}>
            {stop.completed ? <CheckIcon size={16} /> : index + 1}
          </span>
        </div>

        {editing ? (
          <StopForm initial={stop} onCancel={onCancel} onSubmit={onSave} />
        ) : (
          <article className="stop" data-flag={level} data-done={stop.completed || undefined} aria-label={`Stop ${index + 1}: ${stop.name}`}>
            <div className="stop-head">
              <div className="stop-titles">
                <h3 className="stop-name">{stop.name}</h3>
                <p className="stop-loc"><PinIcon size={15} /><span>{stop.location}</span></p>
              </div>
              <span className={`priority priority-${stop.priority}`}>
                {stop.priority === 'high' && <FlagIcon size={13} />}
                {stop.priority[0].toUpperCase() + stop.priority.slice(1)}
              </span>
              <button className="handle" aria-label={`Reorder ${stop.name}. Arrow keys move it.`}
                onPointerDown={(e) => { e.preventDefault(); controls.start(e); }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && index > 0) { e.preventDefault(); onMove(-1); }
                  if (e.key === 'ArrowDown' && index < count - 1) { e.preventDefault(); onMove(1); }
                }}>
                <GripIcon />
              </button>
            </div>

            <div className="stop-times">
              <div className="time-pair">
                <div className="time-block"><span className="time-label">Arrive</span><span className="time mono"><Time value={stop.arrival} /></span></div>
                <svg className="time-arrow" width="28" height="10" viewBox="0 0 28 10" aria-hidden="true"><path d="M1 5h25M22 1l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <div className="time-block"><span className="time-label">Leave</span><span className="time mono"><Time value={stop.departure} /></span></div>
              </div>
              <div className="chips">
                <span className="chip"><ClockIcon size={14} />Open <span className="mono">{stop.opensAt}–{stop.closesAt}</span></span>
                <span className="chip"><span className="mono">{stop.visitMins} min</span> there</span>
              </div>
            </div>

            {stop.flag && (
              <p className={`flag flag-${level}`}>
                {level === 'conflict' ? <ConflictIcon size={17} /> : <WarningIcon size={17} />}
                <span><strong>{level === 'conflict' ? 'Conflict' : 'Warning'}:</strong> {stop.flag.message}</span>
              </p>
            )}

            {stop.items.length > 0 && (
              <div className="checklist">
                <p className="checklist-head"><BagIcon size={15} />Bring<span className="mono">{packed}/{stop.items.length}</span></p>
                <ul className="items">
                  {stop.items.map((item, j) => (
                    <li key={`${j}-${item.text}`}>
                      <label className="check">
                        <input type="checkbox" checked={item.done} onChange={() => onToggleItem(j)} />
                        <span className="check-box" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7.4 5.8 10 11 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                        <span className="check-text">{item.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="stop-actions">
              <button className="btn btn-sm done-toggle" aria-pressed={stop.completed} onClick={onToggleDone}>
                <CheckIcon size={16} />{stop.completed ? 'Done' : 'Mark done'}
              </button>
              <span className="spacer" />
              <button className="icon-btn" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${stop.name} up`}><ArrowUpIcon /></button>
              <button className="icon-btn" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${stop.name} down`}><ArrowDownIcon /></button>
              <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${stop.name}`}><PencilIcon /></button>
              <button className="icon-btn icon-btn-danger" onClick={onDelete} aria-label={`Delete ${stop.name}`}><TrashIcon /></button>
            </div>
          </article>
        )}
      </div>
    </Reorder.Item>
  );
}

function PlanSkeleton() {
  return (
    <div className="plan" aria-busy="true" aria-label="Loading plan">
      <span className="skeleton" style={{ height: 44, width: '45%' }} />
      <div className="stats">{[0, 1, 2, 3].map((k) => <span key={k} className="skeleton" style={{ height: 84 }} />)}</div>
      <span className="skeleton" style={{ height: 180 }} />
      <span className="skeleton" style={{ height: 160 }} />
    </div>
  );
}
