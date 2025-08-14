const router = require('express').Router();
const Genre = require('../models/Genre');
const ensureAuth = require('../middleware/ensureAuth');

// READ all
router.get('/', async (_req, res) => {
  const items = await Genre.find().sort('name');
  res.json(items);
});

// CREATE
router.post('/', ensureAuth, async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name & slug are required' });
  try {
    const doc = await Genre.create({ name, slug });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// UPDATE
router.put('/:id', ensureAuth, async (req, res) => {
  const updated = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// DELETE
router.delete('/:id', ensureAuth, async (req, res) => {
  const deleted = await Genre.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

module.exports = router;
