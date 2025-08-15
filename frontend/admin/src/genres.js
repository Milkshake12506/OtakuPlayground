import { getJSON, postJSON } from './api.js';

export const bindGenres = () => {
  const tb = document.querySelector('#g-table tbody');

  const render = (items=[]) => {
    tb.innerHTML = items.map(g => `
      <tr>
        <td>${g.name}</td>
        <td><span class="pill">${g.slug}</span></td>
        <td class="muted">${g._id}</td>
      </tr>`).join('');
  };

  const refresh = async () => {
    const list = await getJSON('/api/genres');
    render(list);
  };

  document.querySelector('#g-create').onclick = async () => {
    const name = document.querySelector('#g-name').value.trim();
    const slug = document.querySelector('#g-slug').value.trim().toLowerCase();
    if (!name || !slug) return alert('Điền đủ tên & slug');
    try {
      await postJSON('/api/genres', { name, slug });
      document.querySelector('#g-name').value = '';
      document.querySelector('#g-slug').value = '';
      refresh();
    } catch(e){ alert('Lỗi: ' + (e.error || 'unknown')); }
  };
  document.querySelector('#g-refresh').onclick = refresh;

  return { refresh };
};
