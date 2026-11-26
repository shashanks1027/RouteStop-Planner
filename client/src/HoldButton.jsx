// Press and hold to confirm. The red fill grows linearly while held (time passes linearly) and
// snaps back fast on release. Works with a pointer or by holding Space/Enter.
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function HoldButton({ onComplete, children, hint, duration = 1200 }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);
  const startedAt = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  function start() {
    if (timer.current) return;
    startedAt.current = Date.now();
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onComplete();
    }, duration);
  }

  function cancel() {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
    if (hint && Date.now() - startedAt.current < 300) toast(hint, { id: 'hold-hint' });
  }

  const isKey = (e) => e.key === ' ' || e.key === 'Enter';

  return (
    <button type="button" className={`btn btn-hold ${holding ? 'is-holding' : ''}`} style={{ '--hold': `${duration}ms` }}
      onPointerDown={(e) => e.button === 0 && start()}
      onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onBlur={cancel}
      onKeyDown={(e) => { if (isKey(e)) { e.preventDefault(); if (!e.repeat) start(); } }}
      onKeyUp={(e) => isKey(e) && cancel()}
      onContextMenu={(e) => e.preventDefault()}>
      {children}
      <span className="hold-fill" aria-hidden="true">{children}</span>
    </button>
  );
}
