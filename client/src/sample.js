// A ready-made plan for first-time users and demos. Its order has one conflict on purpose:
// the bank closes before the market trip ends. Moving the bank up clears it.
const SAMPLE = {
  title: 'Saturday errands',
  startTime: '10:00',
  stops: [
    { name: 'Vegetable market', location: 'Station Road Market', opensAt: '07:00', closesAt: '22:00', priority: 'low',
      travelMins: 15, visitMins: 150, items: ['Cloth bags', 'Shopping list'] },
    { name: 'SBI Bank', location: 'MG Road branch', opensAt: '10:00', closesAt: '14:00', priority: 'high',
      travelMins: 20, visitMins: 60, items: ['Passbook', 'Aadhaar card'] },
    { name: 'Post office', location: 'Civil Lines', opensAt: '13:00', closesAt: '17:00', priority: 'medium',
      travelMins: 10, visitMins: 20, items: ['Parcel to return'] },
  ],
};

export async function createSamplePlan(api) {
  const { stops, ...plan } = SAMPLE;
  let created = await api.createPlan(plan);
  for (const stop of stops) {
    created = await api.addStop(created._id, { ...stop, items: stop.items.map((text) => ({ text, done: false })) });
  }
  return created;
}
