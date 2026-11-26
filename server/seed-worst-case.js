// Dev check: creates a plan full of realistic worst-case data (longest allowed names, unbreakable
// strings, non-Latin text, emoji, a day that runs past midnight) through the running API.
// Usage: npm run dev (in one terminal), then: npm run seed:worst
const API = `http://localhost:${process.env.PORT || 5000}/api/plans`;

const post = async (path, body) => {
  const res = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data.error));
  return data;
};
const items = (...texts) => texts.map((text) => ({ text, done: false }));

const STOPS = [
  { // every text field at its limit (80 / 150 / 100 chars)
    name: 'Regional Passport Seva Kendra, appointment slot B, token counter 4, near Gate 2.',
    location: 'Ground floor, Mantri Commercial Square, next to the old Indian Oil petrol pump, opposite Lalbagh West Gate, Basavanagudi, Bengaluru South, Karnataka',
    opensAt: '09:00', closesAt: '17:00', priority: 'high', travelMins: 45, visitMins: 180,
    items: items(
      'Original + 2 self-attested copies: rent agreement, Aadhaar, PAN and the last three electricity bills',
      'Appointment printout', 'Old passport', 'Pen', 'Passport photos (white background)', 'Birth certificate',
      'Marriage certificate', 'Annexure F', 'Water bottle', 'Phone charger', 'Cash for photocopies', 'Folder'),
  },
  { name: 'ATM', location: 'MG Rd', opensAt: '00:00', closesAt: '23:59', priority: 'low', travelMins: 0, visitMins: 1, items: [] },
  { // a pasted map link: one long unbreakable string
    name: 'Kempegowda-International-Airport-Terminal-2-Departures-Drop-Off',
    location: 'https://maps.app.goo.gl/Xq7Zp2rTq9VnK3sL8wYb4cDe6fGh',
    opensAt: '00:00', closesAt: '23:59', priority: 'medium', travelMins: 95, visitMins: 30, items: items('Tickets'),
  },
  { name: 'डाकघर (मुख्य शाखा)', location: 'ಬಸವನಗುಡಿ ಅಂಚೆ ಕಚೇರಿ, ಬೆಂಗಳೂರು', opensAt: '10:00', closesAt: '16:00', priority: 'medium', travelMins: 20, visitMins: 25, items: items('पार्सल') },
  { name: "🎂 Cake pickup for Grandma's 80th", location: 'Jayanagar 4th Block', opensAt: '08:00', closesAt: '21:00', priority: 'high', travelMins: 600, visitMins: 600, items: items('🕯️ Candles') },
];

(async () => {
  let plan = await post('', { title: "Shifting flat: bank, RTO, gas agency, passport office and Grandma's medicine run", startTime: '21:30' });
  for (const stop of STOPS) plan = await post(`/${plan._id}/stops`, stop);
  const one = await post('', { title: 'X', startTime: '09:00' });
  await post(`/${one._id}/stops`, { name: 'Bank', location: 'Town', opensAt: '09:00', closesAt: '10:00', priority: 'low', travelMins: 0, visitMins: 60, items: items('Cheque') });
  console.log(`Created "${plan.title}" (${plan.conflicts} conflicts, ends ${plan.endTime}) and a one-stop plan.`);
})().catch((err) => { console.error(err.message); process.exit(1); });
