const { Schema, model } = require('mongoose');

const GenreSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true }
}, { timestamps: true });

module.exports = model('Genre', GenreSchema);
