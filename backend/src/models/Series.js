const { Schema, model } = require('mongoose');

const SeriesSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug:  { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: String,
  price: { type:Number, default:0 },
  coverUrl: String,
  genres: [{ type: String, lowercase: true }],        // lưu slug của genre
  status: { type: String, enum: ['ongoing','completed','hiatus'], default: 'ongoing' },
  lang:   { type: String, default: 'ja' },
  stats: {
    ratingAvg:   { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

// tạo text index để search theo title + description
SeriesSchema.index({ title: 'text', description: 'text' });

module.exports = model('Series', SeriesSchema);
