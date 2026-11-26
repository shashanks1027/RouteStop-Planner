// Plan list + "new plan" form on the left, the selected plan on the right.
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { api } from './api';
import PlanView from './PlanView';
import { createSamplePlan } from './sample';
import { ConflictIcon, Logo, OkIcon, PlusIcon } from './Icons';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function App() {
  const [plans, setPlans] = useState(null); // null while the first load runs
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const mainRef = useRef(null);

  const load = () =>
    api.listPlans().then(
      (list) => { setPlans(list); setError(''); },
      (e) => { setError(e.message); setPlans((p) => p ?? []); }
    );
  useEffect(() => { load(); }, []);

  function open(planId) {
    setSelected(planId);
    // On phones the plan sits below the list, so bring it into view.
    if (matchMedia('(max-width: 899px)').matches) {
      requestAnimationFrame(() => mainRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }));
    }
  }

  async function createPlan(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const { title, startTime } = Object.fromEntries(new FormData(form));
    setCreating(true);
    try {
      const plan = await api.createPlan({ title, startTime });
      form.reset();
      setError('');
      await load();
      open(plan._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function trySample() {
    setCreating(true);
    try {
      const plan = await createSamplePlan(api);
      await load();
      open(plan._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#plan">Skip to plan</a>
      <header className="topbar">
        <a className="brand" href="/">
          <Logo />
          <span className="brand-name">RouteStop <span>Planner</span></span>
        </a>
        <p className="topbar-note">Plan errands stop by stop. You choose the order.</p>
      </header>

      {error && (
        <div className="banner" role="alert">
          <ConflictIcon />
          <span>{error}</span>
          <button className="btn btn-sm" onClick={load}>Try again</button>
        </div>
      )}

      <div className="layout">
        <aside className="sidebar" aria-label="Plans">
          <form className="panel new-plan" onSubmit={createPlan}>
            <h2 className="panel-title">New plan</h2>
            <label className="field">
              <span className="field-label">Plan name</span>
              <input name="title" required maxLength={80} placeholder="e.g. Saturday errands" autoComplete="off" />
            </label>
            <div className="new-plan-row">
              <label className="field">
                <span className="field-label">Start time</span>
                <input name="startTime" type="time" required defaultValue="09:00" />
              </label>
              <button className="btn btn-primary" disabled={creating}><PlusIcon /> Create plan</button>
            </div>
          </form>

          <section className="plans-section" aria-labelledby="plans-heading">
            <div className="section-head">
              <h2 className="panel-title" id="plans-heading">Your plans</h2>
              {plans?.length > 0 && <span className="count mono">{plans.length}</span>}
            </div>
            {plans === null ? (
              <div className="plans"><span className="skeleton skeleton-item" /><span className="skeleton skeleton-item" /></div>
            ) : plans.length === 0 ? (
              <p className="hint">No plans yet. Create one, or try the sample plan.</p>
            ) : (
              <ul className="plans">
                {plans.map((p) => (
                  <li key={p._id}>
                    <button className="plan-item" aria-current={p._id === selected ? 'true' : undefined} onClick={() => open(p._id)}>
                      {p._id === selected && <motion.span layoutId="plan-active" className="plan-active" transition={{ type: 'spring', duration: 0.3, bounce: 0 }} />}
                      <span className="plan-title">{p.title}</span>
                      <span className="plan-meta">
                        Starts <span className="mono">{p.startTime}</span> · {p.stopCount} {p.stopCount === 1 ? 'stop' : 'stops'}
                      </span>
                      {p.conflicts > 0 ? (
                        <span className="pill pill-crit"><ConflictIcon size={14} />{p.conflicts} {p.conflicts === 1 ? 'conflict' : 'conflicts'}</span>
                      ) : p.stopCount > 0 && (
                        <span className="pill pill-ok"><OkIcon size={14} />No conflicts</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <main ref={mainRef} id="plan" tabIndex={-1}>
          {selected ? (
            <PlanView key={selected} id={selected} onChange={load} onDelete={() => { setSelected(null); load(); }} />
          ) : (
            <EmptyState hasPlans={plans?.length > 0} onSample={trySample} busy={creating} />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ hasPlans, onSample, busy }) {
  return (
    <section className="empty" aria-labelledby="empty-heading">
      <svg className="empty-art" viewBox="0 0 360 120" aria-hidden="true">
        <path d="M24 92 C 90 92, 96 40, 150 44 S 220 88, 262 70 S 318 30, 336 28" fill="none"
          stroke="var(--line-strong)" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" />
        <circle cx="24" cy="92" r="7" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2.5" />
        <g fontFamily="var(--mono)" fontSize="12" fontWeight="600" textAnchor="middle">
          <circle cx="150" cy="44" r="14" fill="var(--accent)" /><text x="150" y="48.5" fill="var(--accent-ink)">1</text>
          <circle cx="262" cy="70" r="14" fill="var(--crit)" /><text x="262" y="74.5" fill="#fff">2</text>
        </g>
        <circle cx="336" cy="28" r="7" fill="var(--ink)" />
      </svg>
      <h2 id="empty-heading">{hasPlans ? 'Open a plan to see its route' : 'Plan your first errand run'}</h2>
      <p>
        Add each stop with its opening hours and how long you&rsquo;ll spend there. Put the stops in your
        order, and RouteStop flags any stop you&rsquo;d reach after it closes.
      </p>
      <ol className="steps">
        <li><span className="mono">1</span>Add stops and their hours</li>
        <li><span className="mono">2</span>Drag them into your order</li>
        <li><span className="mono">3</span>Fix what turns red</li>
      </ol>
      <button className="btn" onClick={onSample} disabled={busy}>Try a sample plan</button>
    </section>
  );
}
