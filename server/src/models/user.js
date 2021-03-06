import mongoose from 'mongoose';

import bcrypt from 'bcryptjs';
import isEmail from 'validator/lib/isEmail';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [isEmail, 'No valid email address provided.'],
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    maxlength: 60,
  },
  role: {
    type: String,
  },
  name: {
    type: String,
  },
  bio: {
    type: String,
  },
  avatarId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  coverId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  followersIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ],
  followingIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ],
});

userSchema.statics.findByLogin = async function(login) {
  let user = await this.findOne({
    username: login,
  });

  if (!user) {
    user = await this.findOne({ email: login });
  }

  return user;
};

userSchema.pre('remove', async function(next) {
  await this.model('User').update(
    {},
    { $pull: { followersIds: this._id, followingIds: this._id } },
    { multi: true },
  );
  this.model('Message').deleteMany({ userId: this._id }, next);
});

userSchema.pre('save', async function() {
  this.password = await this.generatePasswordHash();
});

userSchema.methods.generatePasswordHash = async function() {
  const saltRounds = 10;
  return await bcrypt.hash(this.password, saltRounds);
};

userSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
