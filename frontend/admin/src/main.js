import { getJSON, postJSON, putJSON, delJSON, postForm } from './api.js';

let currentEditId = null;

// Quản lý Series
async function bindSeriesManagement() {
  const seriesTable = document.querySelector('#series-table tbody');
  const form = document.querySelector('#series-form');
  const titleEl = document.querySelector('#series-title');
  const slugEl = document.querySelector('#series-slug');
  const descEl = document.querySelector('#series-desc');
  const genresEl = document.querySelector('#series-genres');
  const statusEl = document.querySelector('#series-status');
  
  // Auto-generate slug from title
  titleEl.addEventListener('input', () => {
    if (!currentEditId) {
      const slug = titleEl.value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      slugEl.value = slug;
    }
  });

  // Load and render series list
  async function loadSeries() {
    try {
      const res = await getJSON('/api/series');
      const series = Array.isArray(res) ? res : res.data || [];
      
      seriesTable.innerHTML = series.map(s => `
        <tr>
          <td>
            ${s.coverUrl ? `<img src="${s.coverUrl}" style="width:40px;height:60px;object-fit:cover;border-radius:4px;">` : ''}
          </td>
          <td>
            <strong>${s.title}</strong><br>
            <span class="pill">${s.slug}</span>
          </td>
          <td>${s.description ? s.description.substring(0, 100) + '...' : ''}</td>
          <td>${(s.genres || []).map(g => `<span class="pill">${g}</span>`).join(' ')}</td>
          <td><span class="pill">${s.status}</span></td>
          <td>
            <button onclick="editSeries('${s._id}')" style="margin-right:5px;">Edit</button>
            <button class="danger" onclick="deleteSeries('${s._id}')">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('Error loading series:', error);
    }
  }

  // Create/Update series
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      title: titleEl.value.trim(),
      slug: slugEl.value.trim(),
      description: descEl.value.trim(),
      genres: genresEl.value.split(',').map(g => g.trim()).filter(Boolean),
      status: statusEl.value
    };

    if (!data.title || !data.slug) {
      alert('Title và slug là bắt buộc!');
      return;
    }

    try {
      if (currentEditId) {
        await putJSON(`/api/series/${currentEditId}`, data);
        alert('Cập nhật series thành công!');
      } else {
        await postJSON('/api/series', data);
        alert('Tạo series thành công!');
      }
      
      resetForm();
      loadSeries();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  });

  // Reset form
  function resetForm() {
    currentEditId = null;
    form.reset();
    document.querySelector('#form-title').textContent = 'Thêm Series Mới';
    document.querySelector('#submit-btn').textContent = 'Tạo Series';
  }

  // Edit series
  window.editSeries = async (id) => {
    try {
      const series = await getJSON(`/api/series/${id}`);
      if (series) {
        currentEditId = id;
        titleEl.value = series.title;
        slugEl.value = series.slug;
        descEl.value = series.description || '';
        genresEl.value = (series.genres || []).join(', ');
        statusEl.value = series.status || 'ongoing';
        
        document.querySelector('#form-title').textContent = 'Sửa Series';
        document.querySelector('#submit-btn').textContent = 'Cập nhật';
      }
    } catch (error) {
      alert('Lỗi khi tải series: ' + error.message);
    }
  };

  // Delete series
  window.deleteSeries = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa series này?')) return;
    
    try {
      await delJSON(`/api/series/${id}`);
      alert('Xóa series thành công!');
      loadSeries();
    } catch (error) {
      alert('Lỗi khi xóa: ' + error.message);
    }
  };

  // Cancel edit
  document.querySelector('#cancel-btn').addEventListener('click', resetForm);

  return { loadSeries };
}

// Upload Cover (existing function)
async function bindUploadCover() {
  const sel = document.querySelector('#cover-series');
  const fileEl = document.querySelector('#cover-file');
  const btn = document.querySelector('#cover-upload');
  const preview = document.querySelector('#cover-preview');
  const result = document.querySelector('#cover-result');

  try {
    const res = await getJSON('/api/series');
    const list = Array.isArray(res) ? res : res.data || [];
    
    if (list.length === 0) {
      sel.innerHTML = '<option value="">Không có series nào</option>';
      return;
    }
    
    sel.innerHTML = list.map(s => `<option value="${s._id}">${s.title} (${s.slug})</option>`).join('');
  } catch (error) {
    console.error('Error loading series for cover upload:', error);
    result.textContent = 'Lỗi tải danh sách series';
    return;
  }

  btn.onclick = async () => {
    if (!sel.value || sel.value === '') {
      alert('Chưa chọn series');
      return;
    }
    
    if (!fileEl.files[0]) {
      alert('Chưa chọn file ảnh');
      return;
    }

    const file = fileEl.files[0];
    console.log('📁 Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Kiểm tra file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG, GIF)');
      return;
    }
    
    // Kiểm tra file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File quá lớn! Vui lòng chọn file dưới 5MB');
      return;
    }

    const fd = new FormData();
    fd.append('cover', file);
    
    console.log('🔄 Uploading to series ID:', sel.value);

    try {
      result.textContent = 'Đang upload...';
      result.className = 'message';
      btn.disabled = true;
      
      const resp = await postForm(`/api/series/${sel.value}/cover`, fd);
      console.log('✅ Upload response:', resp);
      
      if (resp.coverUrl) {
        preview.src = resp.coverUrl + '?t=' + Date.now(); // Cache bust
        preview.style.display = 'block';
        result.textContent = 'Upload thành công! ' + (resp.message || '');
        result.className = 'message success';
        
        // Reload series list to show updated covers
        setTimeout(() => {
          if (window.loadSeries) window.loadSeries();
        }, 1000);
      } else {
        result.textContent = 'Upload thành công nhưng không có URL trả về';
        result.className = 'message warn';
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      result.textContent = 'Lỗi upload: ' + err.message;
      result.className = 'message error';
    } finally {
      btn.disabled = false;
    }
  };
}

// Tab switching
function bindTabs() {
  const tabs = document.querySelectorAll('.tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all tabs and sections
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.add('hidden'));

      // Add active to clicked tab and corresponding section
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.querySelector(`#${targetId}`).classList.remove('hidden');
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  bindTabs();
  
  const { loadSeries } = await bindSeriesManagement();
  await bindUploadCover();
  
  // Load initial data
  loadSeries();
});