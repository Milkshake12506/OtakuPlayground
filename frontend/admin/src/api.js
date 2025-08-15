
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || '';

const defaultHeaders = {
  'Accept': 'application/json'
};

// Parse JSON an toàn (kể cả khi server trả rỗng)
async function parseJSON(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function request(path, { method = 'GET', headers = {}, body, isForm = false } = {}) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: isForm ? { ...defaultHeaders, ...headers } : { ...defaultHeaders, 'Content-Type': 'application/json', ...headers },
    body: isForm ? body : (body != null ? JSON.stringify(body) : undefined),
    credentials: 'include' // để gửi cookie đăng nhập
  });

  const data = await parseJSON(res);

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ---- JSON helpers ----
export const getJSON  = (path)             => request(path, { method: 'GET' });
export const postJSON = (path, body)       => request(path, { method: 'POST', body });
export const putJSON  = (path, body)       => request(path, { method: 'PUT',  body });
export const delJSON  = (path)             => request(path, { method: 'DELETE' });

// ---- Form / Upload helpers ----
export async function postForm(path, formData) {
  // KHÔNG set Content-Type để trình duyệt tự đặt boundary multipart/form-data
  return request(path, { method: 'POST', body: formData, isForm: true });
}

export async function uploadFile(path, file, fieldName = 'file', extraFields = {}) {
  const fd = new FormData();
  fd.append(fieldName, file);
  Object.entries(extraFields).forEach(([k, v]) => fd.append(k, v));
  return postForm(path, fd);
}

// ---- Auth tiện dụng (tùy backend) ----
export const me = () => getJSON('/api/auth/me'); // trả {email, role,...} nếu bạn có endpoint này
