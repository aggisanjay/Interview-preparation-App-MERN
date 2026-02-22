

// export default router;
import { Router } from 'express';
import Question from '../models/Question.js';
import Attempt  from '../models/Attempt.js';
import User     from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { updateStreak } from '../utils/streak.js';

const router = Router();

// ─── GET /api/questions ───────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { type, topic, difficulty, page = 1, limit = 20, search } = req.query;
    const query = { isActive: true };

    if (type)       query.type       = type;
    if (topic)      query.topic      = topic;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const total     = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .select('-solution -solutionExplanation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Enrich with user attempt status
    const ids    = questions.map(q => q._id);
    const attempts = await Attempt.find({ user: req.user._id, question: { $in: ids } })
      .select('question isCorrect');

    const statusMap = {};
    for (const a of attempts) {
      if (!statusMap[a.question]) statusMap[a.question] = { attempted: true, correct: a.isCorrect };
    }

    const data = questions.map(q => ({
      ...q.toObject(),
      userStatus: statusMap[q._id] ?? { attempted: false, correct: false },
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page:  parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/questions/topics ────────────────────────────────────────────────
router.get('/topics', protect, async (req, res) => {
  try {
    const topics = await Question.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id:    '$topic',
          total:  { $sum: 1 },
          easy:   { $sum: { $cond: [{ $eq: ['$difficulty', 'Easy']   }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] } },
          hard:   { $sum: { $cond: [{ $eq: ['$difficulty', 'Hard']   }, 1, 0] } },
          mcq:    { $sum: { $cond: [{ $eq: ['$type', 'mcq']    }, 1, 0] } },
          coding: { $sum: { $cond: [{ $eq: ['$type', 'coding'] }, 1, 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const userProgress = await Attempt.aggregate([
      { $match: { user: req.user._id } },
      { $lookup: { from: 'questions', localField: 'question', foreignField: '_id', as: 'q' } },
      { $unwind: '$q' },
      {
        $group: {
          _id:      '$q.topic',
          attempted: { $sum: 1 },
          correct:   { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
    ]);

    const progressMap = Object.fromEntries(
      userProgress.map(p => [p._id, { attempted: p.attempted, correct: p.correct }])
    );

    const data = topics.map(t => ({
      ...t,
      userProgress: progressMap[t._id] ?? { attempted: 0, correct: 0 },
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/questions/:id ───────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/questions/:id/submit ──────────────────────────────────────────
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { selectedAnswer, timeTaken = 0 } = req.body;
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    // Coding questions submitted with 'FAIL' from the frontend runner are
    // NOT recorded — the user must fix their code and resubmit with 'PASS'.
    // This prevents failed test runs from dragging down accuracy.
    if (selectedAnswer === 'FAIL') {
      return res.json({
        success: true,
        isCorrect: false,
        recorded: false,
        message: 'Tests failed — attempt not recorded. Fix your code and resubmit.',
      });
    }

    const isCorrect = question.type === 'mcq'
      ? question.correctAnswer === selectedAnswer
      : selectedAnswer === 'PASS'; // coding: frontend only sends PASS when all tests pass

    await Attempt.create({
      user: req.user._id, question: question._id,
      selectedAnswer, isCorrect, timeTaken, mode: 'practice',
    });

    // Update question aggregate stats
    question.totalAttempts   += 1;
    if (isCorrect) question.correctAttempts += 1;
    await question.save();

    // Update user stats + streak
    const user = await User.findById(req.user._id);
    user.totalQuestionsAttempted += 1;
    if (isCorrect) user.totalCorrect += 1;
    updateStreak(user);
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      isCorrect,
      recorded: true,
      correctAnswer: question.correctAnswer,
      explanation:   question.solutionExplanation,
      userStats: {
        streak:                  user.streak,
        totalQuestionsAttempted: user.totalQuestionsAttempted,
        totalCorrect:            user.totalCorrect,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/questions (admin) ─────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/questions/:id (admin) ──────────────────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/questions/:id (admin – soft delete) ─────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Question.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;