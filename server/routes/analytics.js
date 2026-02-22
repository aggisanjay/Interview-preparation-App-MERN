import { Router } from 'express';
import Attempt  from '../models/Attempt.js';
import MockTest from '../models/MockTest.js';
import User     from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/analytics/overview ─────────────────────────────────────────────
router.get('/overview', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    const user = await User.findById(uid);

    const [totalAttempts, correctAttempts, totalTests, testStats, weeklyAttempts] =
      await Promise.all([
        Attempt.countDocuments({ user: uid }),
        Attempt.countDocuments({ user: uid, isCorrect: true }),
        MockTest.countDocuments({ user: uid, status: 'completed' }),
        MockTest.aggregate([
          { $match: { user: uid, status: 'completed' } },
          { $group: { _id: null, avgScore: { $avg: '$score' }, maxScore: { $max: '$score' } } },
        ]),
        Attempt.countDocuments({
          user: uid,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      ]);

    res.json({
      success: true,
      data: {
        totalAttempts,
        correctAttempts,
        accuracy:      totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
        totalTests,
        avgTestScore:  testStats[0] ? Math.round(testStats[0].avgScore) : 0,
        bestTestScore: testStats[0]?.maxScore ?? 0,
        streak:        user.streak,
        weeklyAttempts,
        totalSessions: user.totalSessions,
        memberSince:   user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/analytics/topic-breakdown ──────────────────────────────────────
router.get('/topic-breakdown', protect, async (req, res) => {
  try {
    const data = await Attempt.aggregate([
      { $match: { user: req.user._id } },
      { $lookup: { from: 'questions', localField: 'question', foreignField: '_id', as: 'q' } },
      { $unwind: '$q' },
      {
        $group: {
          _id:       '$q.topic',
          attempted: { $sum: 1 },
          correct:   { $sum: { $cond: ['$isCorrect', 1, 0] } },
          avgTime:   { $avg: '$timeTaken' },
        },
      },
      { $addFields: { accuracy: { $multiply: [{ $divide: ['$correct', '$attempted'] }, 100] } } },
      { $sort: { attempted: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/analytics/activity ─────────────────────────────────────────────
router.get('/activity', protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data  = await Attempt.aggregate([
      { $match: { user: req.user._id, createdAt: { $gte: since } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count:   { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/analytics/test-history ─────────────────────────────────────────
router.get('/test-history', protect, async (req, res) => {
  try {
    const data = await MockTest.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(20)
      .select('title score accuracy totalQuestions correctAnswers timeTaken completedAt topic');
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/analytics/difficulty-breakdown ──────────────────────────────────
router.get('/difficulty-breakdown', protect, async (req, res) => {
  try {
    const data = await Attempt.aggregate([
      { $match: { user: req.user._id } },
      { $lookup: { from: 'questions', localField: 'question', foreignField: '_id', as: 'q' } },
      { $unwind: '$q' },
      {
        $group: {
          _id:       '$q.difficulty',
          attempted: { $sum: 1 },
          correct:   { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;