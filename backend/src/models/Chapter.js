const { Schema, model, Types } = require('mongoose');

const ChapterSchema = new Schema({
  series: { type: Types.ObjectId, ref: 'Series', required:true },
  title:  { type:String, required:true },
  slug:   { type:String, required:true },   
  order:  { type:Number, default:0 },       
  pages:  [{ type:String }],                
}, { timestamps:true });

ChapterSchema.index({ series:1, slug:1 }, { unique:true });

module.exports = model('Chapter', ChapterSchema);
