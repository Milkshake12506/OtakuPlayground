// admin/src/main.js
import { getJSON } from './api.js';
import { bindGenres } from './genres.js';
import { bindSeries } from './series.js';
import { bindUpload } from './series.js'; 

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function showTab(key) {
  $$('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === key);
  });
  const sections = ['genres', 'series', 'upload'];
  sections.forEach(k => {
    const el = $(`#tab-${k}`);
    if (el) el.style.display = (k === key) ? 'block' : 'none';
  });
  // cập nhật hash để F5 không mất tab
  if (location.hash !== `#${key}`) history.replaceState(null, '', `#${key}`);
}

function bindTabs() {
  $$('.tab').forEach(t => {
    t.onclick = () => showTab(t.dataset.tab);
  });
  // mở tab theo hash hoặc mặc định 'genres'
  const initial = (location.hash || '#genres').replace('#','');
  showTab(initial);
}

async function ping() {
  try {
    const j = await getJSON('/health');
    $('#status').textContent = `mongo: ${j.mongoState}`;
    $('#status').className = 'ok';
  } catch {
    $('#status').textContent = 'backend offline';
    $('#status').className = 'err';
  }
}

bindTabs();

// khởi tạo các module
const genresUI = bindGenres();
const seriesUI = bindSeries();
const uploadUI = typeof bindUpload === 'function' ? bindUpload() : null;

// nạp dữ liệu ban đầu
(async () => {
  await ping();
  await Promise.allSettled([
    genresUI?.refresh?.(),
    seriesUI?.refresh?.(),
    uploadUI?.loadSeriesOptions?.()   // nạp combobox series cho form upload
  ]);
})();
