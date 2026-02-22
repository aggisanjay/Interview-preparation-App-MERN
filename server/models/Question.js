import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const QuestionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['mcq', 'coding'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      enum: [
        'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express',
        'HTML/CSS', 'DSA', 'System Design', 'TypeScript',
        'Python', 'Java', 'SQL', 'Git', 'REST API',
      ],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    // MCQ
    options: [
      {
        label: String, // 'A' | 'B' | 'C' | 'D'
        text:  String,
      },
    ],
    correctAnswer: String,
    // Coding
    examples: [
      {
        input:       String,
        output:      String,
        explanation: String,
      },
    ],
    constraints:  [String],
    starterCode: {
      javascript: { type: String, default: '// Write your solution here\n' },
      python:     { type: String, default: '# Write your solution here\n' },
      java:       { type: String, default: '// Write your solution here\n' },
    },
    solution: {
      javascript: String,
      python:     String,
      java:       String,
    },
    solutionExplanation: String,
    timeComplexity:      String,
    spaceComplexity:     String,
    hints:  [String],
    tags:   [String],
    // Aggregated stats
    totalAttempts:   { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    isActive:        { type: Boolean, default: true },
    createdBy:       { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

QuestionSchema.virtual('successRate').get(function () {
  if (!this.totalAttempts) return 0;
  return Math.round((this.correctAttempts / this.totalAttempts) * 100);
});

QuestionSchema.index({ topic: 1, type: 1, difficulty: 1 });
QuestionSchema.index({ tags: 1 });

export default model('Question', QuestionSchema);