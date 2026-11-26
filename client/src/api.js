// All calls to the API. Errors are thrown with the server's message and field details.
async function request(path, method = 'GET', body) {
  let res;
  try {
    res = await fetch(`/api/plans${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error?.message || `Request failed (${res.status})`), {
      details: data.error?.details || [],
    });
  }
  return data;
}

export const api = {
  listPlans: () => request(''),
  getPlan: (id) => request(`/${id}`),
  createPlan: (plan) => request('', 'POST', plan),
  updatePlan: (id, plan) => request(`/${id}`, 'PUT', plan),
  deletePlan: (id) => request(`/${id}`, 'DELETE'),
  addStop: (id, stop) => request(`/${id}/stops`, 'POST', stop),
  updateStop: (id, stopId, stop) => request(`/${id}/stops/${stopId}`, 'PUT', stop),
  deleteStop: (id, stopId) => request(`/${id}/stops/${stopId}`, 'DELETE'),
  reorder: (id, order) => request(`/${id}/stops/reorder`, 'PATCH', { order }),
};
