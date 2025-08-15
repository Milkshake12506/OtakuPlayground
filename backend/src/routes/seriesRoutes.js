const router = require('express').Router();
const Series = require('../models/Series');
const ensureAdmin = require('../middleware/ensureAdmin');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Tạo thư mục uploads nếu chưa có
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Đảm bảo thư mục tồn tại
ensureDir(path.join(__dirname, '../../uploads/tmp'));
ensureDir(path.join(__dirname, '../../uploads/covers'));

// Multer: lưu file tạm vào backend/uploads/tmp
const upload = multer({ dest: path.join(__dirname, '../../uploads/tmp') });

/** LIST + SEARCH */
router.get('/', async (req, res) => {
  try {
    const { search = '', genre = '', page = 1, limit = 20 } = req.query;
    const q = {};
    if (search) q.$text = { $search: String(search) };
    const slugs = String(genre).split(',').map(s => s.trim()).filter(Boolean);
    if (slugs.length) q.genres = { $all: slugs };

    const lim = Math.min(parseInt(limit, 10) || 20, 50);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const [data, total] = await Promise.all([
      Series.find(q).sort({ updatedAt: -1 }).skip(skip).limit(lim),
      Series.countDocuments(q)
    ]);
    res.json({ data, total, page: Number(page), limit: lim });
  } catch (error) {
    console.error('Error in GET /api/series:', error);
    res.status(500).json({ error: error.message });
  }
});

/** READ by slug */
router.get('/:slug', async (req, res) => {
  try {
    const doc = await Series.findOne({ slug: req.params.slug });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (error) {
    console.error('Error in GET /api/series/:slug:', error);
    res.status(500).json({ error: error.message });
  }
});

/** GET by ID (for admin) */
router.get('/id/:id', async (req, res) => {
  try {
    const doc = await Series.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (error) {
    console.error('Error in GET /api/series/id/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

/** CREATE */
router.post('/', ensureAdmin, async (req, res) => {
  const { title, slug } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'title & slug are required' });
  try {
    const doc = await Series.create(req.body);
    console.log('Created series:', doc.title);
    res.status(201).json(doc);
  } catch (e) {
    console.error('Error creating series:', e);
    res.status(400).json({ error: e.message });
  }
});

/** UPDATE */
router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const updated = await Series.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    console.log('Updated series:', updated.title);
    res.json(updated);
  } catch (error) {
    console.error('Error updating series:', error);
    res.status(500).json({ error: error.message });
  }
});

/** DELETE */
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const deleted = await Series.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    
    // Xóa thư mục cover nếu có
    const coverDir = path.join(__dirname, `../../uploads/covers/${deleted.slug}`);
    if (fs.existsSync(coverDir)) {
      fs.rmSync(coverDir, { recursive: true, force: true });
      console.log('Deleted cover directory:', coverDir);
    }
    
    console.log('Deleted series:', deleted.title);
    res.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPLOAD COVER
 * POST /api/series/:id/cover    (FormData field: "cover")
 * Lưu: backend/uploads/covers/<series.slug>/cover.<ext>
 * URL: /static/covers/<series.slug>/cover.<ext>
 */
router.post('/:id/cover', ensureAdmin, upload.single('cover'), async (req, res) => {
  console.log('🔄 Upload cover request for series ID:', req.params.id);
  console.log('📁 File received:', req.file ? req.file.originalname : 'No file');
  
  try {
    const series = await Series.findById(req.params.id);
    if (!series) {
      console.log('❌ Series not found:', req.params.id);
      return res.status(404).json({ error: 'Series not found' });
    }
    
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ error: 'Missing file "cover"' });
    }

    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const safeSlug = series.slug || String(series._id);

    const destDir = path.join(__dirname, `../../uploads/covers/${safeSlug}`);
    ensureDir(destDir);

    const finalPath = path.join(destDir, `cover.${ext}`);
    
    // Di chuyển file từ temp đến final location
    fs.renameSync(req.file.path, finalPath);
    console.log('✅ File moved to:', finalPath);

    const url = `/static/covers/${safeSlug}/cover.${ext}`;
    series.coverUrl = url;
    await series.save();

    console.log('✅ Cover URL saved:', url);
    res.json({ coverUrl: url, message: 'Upload successful!' });
    
  } catch (e) {
    console.error('❌ Upload error:', e);
    
    // Cleanup temp file if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up temp file');
      } catch (cleanupErr) {
        console.error('Error cleaning temp file:', cleanupErr);
      }
    }
    
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
});

module.exports = router;