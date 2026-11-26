# Project Report: RouteStop Planner

**Student:** Shashank Singh · **Course:** [Course / Sem] · **College:** S-VYASA · **Subject:** [Subject] · CIA 2

## 1. Title
RouteStop Planner: A Multi-stop Errand Organiser with Time-Window Conflict Flagging

## 2. Abstract
People running several errands in one trip often forget opening times, priorities or the items needed at each place. RouteStop Planner is a full-stack web app where a user builds an ordered checklist of stops. Each stop has a location, opening hours, a priority and items to bring. Using the user's own travel and visit estimates, the app calculates arrival and departure times and flags stops whose time windows clash with the plan. Stops can be reordered and the flags update immediately. The app deliberately does not optimise routes. It is built with React, a Node.js + Express REST API and MongoDB, with server-side validation, central error handling and a responsive layout.

## 3. Problem Statement
Errand-runners arrive after places close, wait outside before they open, leave important errands too late and forget documents. To-do apps ignore opening hours. Map apps ignore what to bring and what matters most. Users need a simple planner that combines a checklist with time windows and warns about clashes, while leaving the order to them.

## 4. Objectives
1. Create plans with multiple stops, each with a location and a time window.
2. Store a priority and a checklist of items for each stop.
3. Let users reorder stops and save the order.
4. Estimate arrival/departure from the user's estimates and flag conflicts.
5. Make no claim of optimal routing.
6. Provide a REST API with MongoDB persistence, input validation and error handling.
7. Work on phones and laptops.

## 5. Tech Stack
| Layer | Choice | Why |
|---|---|---|
| UI | React 19 + Vite | Components re-render the list automatically when the plan changes; fast dev server |
| API | Node.js + Express 5 | Simple REST framework; JavaScript on both ends; async errors reach the error handler automatically |
| Database | MongoDB + Mongoose | A plan and its stops form one document; reordering is just reordering an array |
| Validation | express-validator | Readable rules with per-field messages |
| Tests | Jest + Supertest | Unit tests for the logic and HTTP tests for the API |
| Motion | Motion (`motion/react`) | Drag-to-reorder list (`Reorder`) and layout animation when stops move, with reduced-motion support |
| Toasts | Sonner | Short messages with an Undo action after deleting a stop |
| Fonts | Geist + Geist Mono (Fontsource) | Clear UI type; monospaced, equal-width digits keep times lined up |

All tools are free. MongoDB can run locally or on the free Atlas tier.

## 6. System Design
```
React (browser) --fetch /api--> Vite proxy --> Express: route -> validation -> handler -> Mongoose --> MongoDB
                <-- plan JSON + calculated schedule + flags ---------------------------------------
```
**Data model:** one `plans` collection.
`Plan { title, startTime, stops: [ { name, location, opensAt, closesAt, priority, travelMins, visitMins, items: [{text, done}], completed } ] }`
The array order is the visiting order. The schedule and flags are calculated on every response, never stored, so they always match the current order.

**Conflict algorithm** (`server/schedule.js`, O(n)):
```
clock = startTime
for each stop in order:
  arrival   = clock + travelMins
  wait      = max(0, opensAt - arrival)
  departure = arrival + wait + visitMins
  arrival >= closesAt   -> conflict (arrives after closing)
  departure > closesAt  -> conflict (not enough time)
  wait > 0              -> warning (arrives before opening)
  clock = departure
```

## 7. Modules
| Module | Files | Job |
|---|---|---|
| Plans | `App.jsx`, `HoldButton.jsx`, `routes/plans.js` | create, list, open, rename, change start time, hold to delete, sample plan |
| Stops | `PlanView.jsx`, `StopForm.jsx`, `routes/plans.js` | add, edit, delete with Undo, tick items, mark done |
| Reorder | `PlanView.move()`, drag handle, `PATCH /stops/reorder` | drag, ↑/↓ buttons or arrow keys; server checks every stop appears exactly once |
| Schedule | `schedule.js` | times and flags |
| Timeline | `Timeline.jsx` | opening hours, travel, waiting and visit for every stop on one time axis |
| Validation & errors | `validation.js`, `app.js`, `api.js` | 400 with field errors, 404, bad JSON, DB down; messages shown in the UI |
| Responsive UI | `styles.css` | one column on phones, two from 900px; light and dark themes; 44px touch targets |

## 8. Implementation Summary
Each route runs express-validator rules first. Invalid input gets a 400 with field messages before the database is touched. Handlers save only `matchedData()` (validated fields), so clients can't inject extra fields. Stops are embedded sub-documents. Reorder checks that the id list matches the plan's stops exactly, then rebuilds the array. The React client calls the API through `api.js`, shows server errors in a banner or toast and field errors under form inputs, and uses native browser checks (required, min/max, time inputs) for instant feedback.

Quick actions (tick an item, mark done, reorder, delete) change the screen at once and save in the background. Saves go through a queue in `PlanView.jsx`, so they reach the server one at a time and in order; the server's reply, with fresh times and flags, replaces the screen once the last save is back. If a save fails, the plan reloads from the server and a toast explains why. Undo re-adds the deleted stop and puts it back in its old position with the reorder endpoint.

The interface uses one set of design tokens (colours, radii, easing) in `styles.css`, with a dark set chosen by `prefers-color-scheme`. Status colours (red, amber, green) are kept for schedule state only and always appear with an icon and a word. Buttons scale slightly when pressed, hover styles apply only to mouse pointers, and animations are switched off or reduced when the device asks for reduced motion.

## 9. Testing
**Automated** (`npm test`): 11 tests pass. `schedule.test.js` covers fits, early arrival, both conflict types, the exact-closing edge case, reordering and past midnight. `api.test.js` covers 404, bad JSON, missing/invalid plan fields, invalid id, every invalid stop field and a bad reorder body.

**Manual test cases:**
| # | Case | Input | Expected | Actual |
|---|---|---|---|---|
| 1 | Create plan | "Saturday errands", 10:00 | Appears in list, opens | Pass |
| 2 | Add stops | market, bank, post office | Shown in order with arrive/leave times | Pass |
| 3 | Conflict | Market 150 min, then bank closing 14:00 (60 min) | 🔴 "Needs until 14:05, but it closes at 14:00" | Pass |
| 4 | Reorder fixes it | Move bank up | 0 conflicts | Pass |
| 5 | Tick item | Click "Passbook" | Struck through, saved | Pass |
| 6 | Edit stop keeps ticks | Change visit minutes | "Passbook" still ticked | Pass |
| 7 | Closing before opening | 18:00 → 09:00 | Error under "Closes at" | Pass |
| 8 | Reorder with duplicate ids | API call | 400 | Pass |
| 9 | Unknown plan id | GET /api/plans/<missing id> | 404 "Plan not found" | Pass |
| 10 | Mark done | Tick "Done" | Card faded, name struck | Pass |
| 11 | Mobile | 390px width | Single column, usable buttons | Pass |
| 12 | Server stopped | Stop API, reload | "Cannot reach the server" banner | Pass |
| 13 | Drag to reorder | Drag bank below market by its handle | Order saved, conflict returns | Pass |
| 14 | Undo delete | Delete a stop, click Undo | Stop back in its old place, ticks kept | Pass |
| 15 | Hold to delete plan | Quick click, then hold 1.2 s | Click shows a hint; hold deletes | Pass |
| 16 | Worst-case data | `npm run seed:worst`, view at 320 px | Long names wrap, no sideways scroll, past-midnight times show "+1d" | Pass |

## 10. Screenshots to capture
Plan list; a plan with a conflict; the same plan after reordering; stop form with a validation error; ticked items; mobile view; error banner with server stopped; `npm test` output; the plan document in MongoDB Compass/Atlas.

## 11. Conclusion
The app meets every requirement. Users plan multi-stop errands with locations, time windows, priorities and items, reorder freely, and see conflicts instantly, without any claim of optimal routing. It demonstrates a complete React + Express + MongoDB stack with validation, error handling and responsive design.

## 12. Future Scope
User accounts; split or overnight opening hours; reminders before closing time; offline (PWA) use; sharing plans.

## 13. How AI Was Used
Claude (Anthropic) was used as a development partner. It turned the brief into a requirement checklist, proposed the design, generated the code, tests and documentation, and checked the UI in a headless browser. The code was then trimmed to the minimum the requirements need.
**My role:** [describe what you reviewed, ran, changed and tested yourself].
