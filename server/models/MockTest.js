import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const MockTestSchema = new Schema(
  {
    user:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title:  { type: String, required: true },
    topic:  { type: String },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
    },
    duration:       { type: Number, required: true }, // minutes
    questions: [
      {
        question:       { type: Schema.Types.ObjectId, ref: 'Question' },
        selectedAnswer: { type: String,  default: null },
        isCorrect:      { type: Boolean, default: false },
        timeTaken:      { type: Number,  default: 0 },   // seconds
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'abandoned'],
      default: 'pending',
    },
    score:          { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy:       { type: Number, default: 0 },
    timeTaken:      { type: Number, default: 0 }, // seconds taken
    startedAt:      { type: Date },
    completedAt:    { type: Date },
  },
  { timestamps: true }
);

MockTestSchema.index({ user: 1, createdAt: -1 });

export default model('MockTest', MockTestSchema);