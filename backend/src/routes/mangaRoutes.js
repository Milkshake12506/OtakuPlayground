const router = require('express').Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const Series = require('../models/Series');
const Chapter = require('../models/Chapter');
const ensureAuth = require('../middleware/ensureAuth');
const ensureAdmin = require('../middleware/ensureAdmin');

// Lưu tạm file upload
const upload = multer({ dest: path.join(__dirname, '../../.tmp') });

// Tạo chapter rỗng (metadata)
router.post('/series/:seriesId/chapters', ensureAuth, ensureAdmin, async (req,res)=>{
  const s = await Series.findById(req.params.seriesId);
  if(!s) return res.status(404).json({error:'series not found'});
  const { title, slug, order=0 } = req.body;
  const c = await Chapter.create({ series:s._id, title, slug, order, pages: [] });
  res.status(201).json(c);
});

// Upload ZIP trang -> giải nén -> lưu URL vào chapter
router.post('/series/:seriesId/chapters/:chapSlug/upload-zip',
  ensureAuth, ensureAdmin, upload.single('zip'),
  async (req,res)=>{
    const series = await Series.findById(req.params.seriesId);
    if(!series) return res.status(404).json({error:'series not found'});

    const chapter = await Chapter.findOne({ series:series._id, slug:req.params.chapSlug });
    if(!chapter) return res.status(404).json({error:'chapter not found'});

    const tmpZip = req.file.path;
    const baseDir = path.join(__dirname, '../../uploads/chapters', series.slug, chapter.slug);
    await fsp.mkdir(baseDir, { recursive:true });

    const zip = new AdmZip(tmpZip);
    zip.getEntries()
      .filter(e => !e.isDirectory)
      .sort((a,b)=> a.entryName.localeCompare(b.entryName,undefined,{numeric:true}))
      .forEach(e => zip.extractEntryTo(e.entryName, baseDir, false, true));

    // Tạo danh sách URL ảnh theo thứ tự
    const files = (await fsp.readdir(baseDir))
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
      .sort((a,b)=> a.localeCompare(b,undefined,{numeric:true}));

    chapter.pages = files.map(f => `/static/chapters/${series.slug}/${chapter.slug}/${f}`);
    await chapter.save();

    await fsp.unlink(tmpZip).catch(()=>{});
    res.json({ ok:true, pages: chapter.pages.length, chapter });
  });

// Upload cover cho series (1 ảnh)
router.post('/series/:seriesId/cover', ensureAuth, ensureAdmin, upload.single('cover'), async (req,res)=>{
  const s = await Series.findById(req.params.seriesId);
  if(!s) return res.status(404).json({error:'series not found'});
  const dir = path.join(__dirname, '../../uploads/covers', s.slug);
  await fsp.mkdir(dir, { recursive:true });

  const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const filePath = path.join(dir, `cover.${ext}`);
  await fsp.rename(req.file.path, filePath);
  s.coverUrl = `/static/covers/${s.slug}/cover.${ext}`;
  await s.save();
  res.json({ ok:true, coverUrl: s.coverUrl });
});

// API đọc
router.get('/series/:slug', async (req,res)=>{
  const s = await Series.findOne({ slug:req.params.slug });
  if(!s) return res.status(404).json({error:'not found'});
  res.json(s);
});

router.get('/series/:slug/chapters', async (req,res)=>{
  const s = await Series.findOne({ slug:req.params.slug });
  if(!s) return res.status(404).json({error:'not found'});
  const list = await Chapter.find({ series:s._id }).sort({ order:1, createdAt:1 });
  res.json(list);
});

router.get('/series/:slug/chapters/:chapSlug', async (req,res)=>{
  const s = await Series.findOne({ slug:req.params.slug });
  if(!s) return res.status(404).json({error:'not found'});
  const c = await Chapter.findOne({ series:s._id, slug:req.params.chapSlug });
  if(!c) return res.status(404).json({error:'not found'});
  res.json(c);
});

module.exports = router;
