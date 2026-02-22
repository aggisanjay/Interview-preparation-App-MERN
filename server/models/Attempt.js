import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const AttemptSchema = new Schema(
  {
    user:           { type: Schema.Types.ObjectId, ref: 'User',     required: true },
    question:       { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedAnswer: String,
    isCorrect:      { type: Boolean, default: false },
    timeTaken:      { type: Number,  default: 0 },    // seconds
    mockTest:       { type: Schema.Types.ObjectId, ref: 'MockTest', default: null },
    mode: {
      type: String,
      enum: ['practice', 'mock'],
      default: 'practice',
    },
  },
  { timestamps: true }
);

AttemptSchema.index({ user: 1, question: 1 });
AttemptSchema.index({ user: 1, createdAt: -1 });

export default model('Attempt', AttemptSchema);