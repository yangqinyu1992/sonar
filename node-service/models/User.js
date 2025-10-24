const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    nickname: { type: String },
    roles: { type: [String], default: ['user'] },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'users' }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
