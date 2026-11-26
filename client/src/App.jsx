// Plan list + "new plan" form on the left, the selected plan on the right.
import { useEffect, useState } from 'react';
import { api } from './api';
import PlanView from './PlanView';

export default function App() {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.listPlans().then(setPlans, (e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function createPlan(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const { title, startTime } = Object.fromEntries(new FormData(form));
    try {
      const plan = await api.createPlan({ title, startTime });
      form.reset();
      setError('');
      await load();
      setSelected(plan._id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>📍 RouteStop Planner</h1>
        <p className="muted">Plan your errands stop by stop. You choose the order.</p>
      </header>
      {error && <p className="error" role="alert">⚠️ {error}</p>}

      <div className="layout">
        <aside>
          <form className="card form" onSubmit={createPlan}>
            <label>New plan<input name="title" required maxLength={80} placeholder="e.g. Saturday errands" /></label>
            <label>Start time<input name="startTime" type="time" required defaultValue="09:00" /></label>
            <button className="btn primary">Create plan</button>
          </form>
          <ul className="plans">
            {plans.map((p) => (
              <li key={p._id}>
                <button className={`card plan ${p._id === selected ? 'active' : ''}`} onClick={() => setSelected(p._id)}>
                  <strong>{p.title}</strong>
                  <span className="muted">starts {p.startTime} · {p.stopCount} stops</span>
                  {p.conflicts > 0 && <span className="badge conflict">{p.conflicts} conflict{p.conflicts > 1 && 's'}</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main>
          {selected ? (
            <PlanView key={selected} id={selected} onChange={load} onDelete={() => { setSelected(null); load(); }} />
          ) : (
            <p className="card muted">Select or create a plan to add stops.</p>
          )}
        </main>
      </div>
    </div>
  );
}
