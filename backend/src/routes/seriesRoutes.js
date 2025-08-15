const router = require('express').Router();
const Series = require('../models/Series');
const ensureAdmin = require('../middleware/ensureAdmin');

/**
 * LIST + SEARCH
 * GET /api/series?search=&genre=action,comedy&page=1&limit=20
 */
router.get('/', async (req, res) => {
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
});

// READ detail by slug
router.get('/:slug', async (req, res) => {
  const doc = await Series.findOne({ slug: req.params.slug });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});

// CREATE
router.post('/', ensureAdmin, async (req, res) => {
  const { title, slug } = req.body;
  if (!title || !slug) return res.status(400).json({ error: 'title & slug are required' });
  try {
    const doc = await Series.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// UPDATE by id
router.put('/:id', ensureAdmin, async (req, res) => {
  const updated = await Series.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// DELETE by id
router.delete('/:id', ensureAdmin, async (req, res) => {
  const deleted = await Series.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

module.exports = router;
