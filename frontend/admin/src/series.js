import { getJSON } from './api.js';

export const bindUpload = () => {
  const sel = document.querySelector('#u-series');

  const loadSeriesOptions = async () => {
    const { data } = await getJSON('/api/series'); // nếu API list trả {data:[...]}
    sel.innerHTML = data.map(s => `<option value="${s._id}" data-slug="${s.slug}">${s.title}</option>`).join('');
  };

  // auto slug chapter
  const ct = document.querySelector('#u-ctitle');
  const cs = document.querySelector('#u-cslug');
  if (ct && cs) {
    ct.addEventListener('input', () => {
      if (!cs.dataset.touched || cs.value==='') {
        cs.value = ct.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
      }
    });
    cs.addEventListener('input', ()=> cs.dataset.touched = '1');
  }

  document.querySelector('#u-upload').onclick = async () => {
    const seriesId = sel.value;
    const sSlug = sel.options[sel.selectedIndex].dataset.slug;
    const title = document.querySelector('#u-ctitle').value.trim();
    const slug  = document.querySelector('#u-cslug').value.trim();
    const order = Number(document.querySelector('#u-order').value||0);
    const zip   = document.querySelector('#u-zip').files[0];
    const out   = document.querySelector('#u-result');

    if(!seriesId || !title || !slug || !zip) return alert('Điền đủ & chọn ZIP');

    // 1) tạo chapter rỗng
    let r = await fetch(`/api/series/${seriesId}/chapters`, {
      method:'POST', credentials:'include',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ title, slug, order })
    });
    if(!r.ok){ out.textContent = 'Lỗi tạo chapter'; return; }

    // 2) upload ZIP
    const fd = new FormData();
    fd.append('zip', zip);
    r = await fetch(`/api/series/${seriesId}/chapters/${slug}/upload-zip`, {
      method:'POST', credentials:'include', body: fd
    });
    const j = await r.json();
    if(r.ok){
      out.textContent = `OK: ${j.pages} trang. Xem /reader/${sSlug}/${slug}`;
    }else{
      out.textContent = 'Upload lỗi';
    }
  };

  return { loadSeriesOptions };
};
