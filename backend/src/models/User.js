const { Schema, model } = require('mongoose');
const UserSchema = new Schema({
  googleId: { type: String, unique: true },
  email: { type: String, index: true },
  displayName: String,
  avatar: String,
  role: { type: String, default: 'user' }
}, { timestamps: true });
module.exports = model('User', UserSchema);
