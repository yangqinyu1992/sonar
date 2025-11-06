/*
 * 用户模型（MongoDB / users 集合）
 * 字段：
 * - username（唯一索引）
 * - passwordHash（bcrypt 加密）
 * - nickname、roles、createdAt
 */
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    nickname: { type: String },
    roles: { type: [String], default: ['user'] },
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { collection: 'users' }
);

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
