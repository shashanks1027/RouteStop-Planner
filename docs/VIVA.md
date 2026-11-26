# Viva Questions: RouteStop Planner

**1. What problem does it solve?**
People running several errands forget opening times, priorities and items. The app keeps an ordered checklist of stops with time windows and warns when the chosen order misses a window.

**2. Why no automatic best route?**
The brief says not to claim optimal routing. Real routing needs map data and paid APIs. We use the user's own time estimates, let them choose the order, and only flag problems.

**3. How is a conflict detected?**
`schedule.js` walks the stops in order with a clock. Arrival is clock plus travel time; if the stop isn't open yet you wait; departure is start plus visit time. Arriving at or after closing, or leaving after closing, is a conflict. Arriving early is a warning. This is O(n).

**4. Why MongoDB with stops embedded in the plan?**
A plan and its stops are always read together, so one document needs one query. The array order is the visiting order, so reordering means rearranging the array.

**5. What is REST? Examples?**
URLs name resources and HTTP methods say what to do: `GET /api/plans`, `POST /api/plans`, `PUT /api/plans/:id`, `DELETE /api/plans/:id`, `PATCH /api/plans/:id/stops/reorder`. Data is sent as JSON.

**6. How is input validated?**
express-validator rules run on every route before the handler and return 400 with per-field messages. The browser form also uses `required`, `min`/`max` and time inputs for quick feedback, but the server is the real check because clients can be bypassed (e.g. with Postman).

**7. How are errors handled?**
One error-handling middleware in `app.js` returns `{ error: { message } }` with the right status: 400 (bad input or JSON), 404 (not found), 503 (database down), 500 (unexpected). Express 5 forwards errors thrown in async handlers automatically. The client shows the message in a banner, or under the form field.

**8. What does `matchedData()` do?**
It returns only the validated fields, so a client can't sneak extra fields like `_id` into the database.

**9. How is reordering made safe?**
The client sends the full new list of stop ids. The server checks that the list has every stop exactly once before rebuilding the array, so stops can't be lost or duplicated.

**10. How is the design responsive?**
Mobile-first CSS with Grid/Flexbox: one column on phones, two-column form rows from 640px, and the plan list beside the plan from 900px. On touch screens every button and checkbox row is at least 44px, inputs use 16px text so iOS doesn't zoom, and hover effects only apply to a mouse.

**11. Why does the client call `/api/...` without CORS?**
The Vite dev server proxies `/api` to Express on port 5000, so the browser only ever talks to one origin.

**12. How does drag-to-reorder work, and is it accessible?**
Motion's `Reorder` list moves the cards while you drag the ⋮⋮ handle; on release the new id order goes to `PATCH /stops/reorder`. Only the handle starts a drag (`touch-action: none` on it), so the page still scrolls on phones. Keyboard users press the arrow keys on the handle, and the ↑/↓ buttons still work.

**13. What is an optimistic update, and what if the save fails?**
The screen changes before the server answers, so ticking an item feels instant. Saves are queued so they reach the server in order. If one fails, the app reloads the plan from the server (the source of truth) and shows the error in a toast.

**14. How does the timeline chart work?**
`Timeline.jsx` turns every time into minutes, finds the earliest and latest minute in the plan, and places each bar with a percentage `left` and `width`. Opening hours are a grey band; the visit bar turns red when it runs past closing. Times after midnight show "+1d".
