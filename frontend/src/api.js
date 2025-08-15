const defaultOpts = { credentials: 'include' }; // cần để gửi cookie session (Passport)

export async function getJSON(url) {
  const r = await fetch(url, defaultOpts);
  const j = await r.json();
  if (!r.ok) throw j;
  return j;
}

export async function postJSON(url, data) {
  const r = await fetch(url, {
    ...defaultOpts,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const j = await r.json();
  if (!r.ok) throw j;
  return j;
}

export async function putJSON(url, data) {
  const r = await fetch(url, {
    ...defaultOpts,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const j = await r.json();
  if (!r.ok) throw j;
  return j;
}

export async function del(url) {
  const r = await fetch(url, { ...defaultOpts, method: 'DELETE' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw j;
  return j;
}
