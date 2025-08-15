// routes/chapterRoutes.js
const router = require('express').Router({ mergeParams: true });
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const unzipper = require('unzipper');

const ensureAdmin = require('../middleware/ensureAdmin');
const Series = require('../models/Series');

// thư mục tạm để nhận file zip
const upload = multer({ dest: path.join(__dirname, '../uploads/tmp') });

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// POST /api/series/:id/chapters/:slug/upload-zip   (FormData field: "zip")
router.post('/:slug/upload-zip', ensureAdmin, upload.single('zip'), async (req, res) => {
  const series = await Series.findById(req.params.id);
  if (!series) return res.status(404).json({ error: 'Series not found' });
  if (!req.file) return res.status(400).json({ error: 'Missing file "zip"' });

  try {
    const seriesSlug = series.slug || String(series._id);
    const chapSlug = String(req.params.slug).toLowerCase();

    const destDir = path.join(__dirname, `../uploads/chapters/${seriesSlug}/${chapSlug}`);
    ensureDir(destDir);

    // giải nén zip vào destDir
    await fs.createReadStream(req.file.path)
      .pipe(unzipper.Extract({ path: destDir }))
      .promise();

    // xóa file tạm
    fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);

    // liệt kê và sắp xếp file ảnh
    const files = fs.readdirSync(destDir)
      .filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const pages = files.map(f => `/static/chapters/${seriesSlug}/${chapSlug}/${f}`);

    // (tuỳ chọn) lưu vào DB nếu bạn có schema Chapter – ở đây trả về luôn
    return res.json({ ok: true, series: seriesSlug, chapter: chapSlug, count: pages.length, pages });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

module.exports = router;
