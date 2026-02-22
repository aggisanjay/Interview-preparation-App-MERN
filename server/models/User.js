import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Attendance / session tracking
    loginHistory: [
      {
        date: { type: Date, default: Date.now },
        ip: String,
      },
    ],
    totalSessions:  { type: Number, default: 0 },
    lastActive:     { type: Date,   default: Date.now },
    // Progress
    totalQuestionsAttempted: { type: Number, default: 0 },
    totalCorrect:            { type: Number, default: 0 },
    totalMockTests:          { type: Number, default: 0 },
    streak:                  { type: Number, default: 0 },
    lastStudyDate:           { type: Date,   default: null },
    topicProgress: {
      type: Map,
      of: {
        attempted: { type: Number, default: 0 },
        correct:   { type: Number, default: 0 },
      },
      default: {},
    },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method
UserSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Virtual
UserSchema.virtual('accuracy').get(function () {
  if (!this.totalQuestionsAttempted) return 0;
  return Math.round((this.totalCorrect / this.totalQuestionsAttempted) * 100);
});

export default model('User', UserSchema);