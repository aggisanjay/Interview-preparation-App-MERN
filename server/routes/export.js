import { Router } from 'express';
import Attempt  from '../models/Attempt.js';
import MockTest from '../models/MockTest.js';
import User     from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const escapeCSV = (val) => {
  if (val == null) return '';
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const toCSV = (headers, rows) =>
  [headers, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n');

const sendCSV = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};

// ─── GET /api/export/my-progress ─────────────────────────────────────────────
router.get('/my-progress', protect, async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.user._id })
      .populate('question', 'title topic difficulty type')
      .sort({ createdAt: -1 });

    const headers = ['Date', 'Question', 'Topic', 'Difficulty', 'Type', 'Result', 'Time (sec)'];
    const rows = attempts.map(a => [
      new Date(a.createdAt).toLocaleDateString(),
      a.question?.title    ?? 'N/A',
      a.question?.topic    ?? 'N/A',
      a.question?.difficulty ?? 'N/A',
      a.question?.type     ?? 'N/A',
      a.isCorrect ? 'Correct' : 'Incorrect',
      a.timeTaken ?? 0,
    ]);

    sendCSV(res, `my-progress-${Date.now()}.csv`, toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/export/my-tests ─────────────────────────────────────────────────
router.get('/my-tests', protect, async (req, res) => {
  try {
    const tests = await MockTest.find({ user: req.user._id, status: 'completed' })
      .sort({ completedAt: -1 });

    const headers = ['Date', 'Title', 'Topic', 'Score (%)', 'Correct', 'Total', 'Duration (min)'];
    const rows = tests.map(t => [
      new Date(t.completedAt).toLocaleDateString(),
      t.title,
      t.topic,
      t.score,
      t.correctAnswers,
      t.totalQuestions,
      Math.round(t.timeTaken / 60),
    ]);

    sendCSV(res, `my-tests-${Date.now()}.csv`, toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/export/attendance  (admin only) ─────────────────────────────────
router.get('/attendance', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({})
      .select('name email role totalSessions totalQuestionsAttempted totalCorrect totalMockTests lastActive createdAt');

    const headers = [
      'Name', 'Email', 'Role',
      'Total Sessions', 'Questions Attempted', 'Correct Answers',
      'Mock Tests', 'Accuracy (%)', 'Last Active', 'Joined',
    ];

    const rows = users.map(u => {
      const accuracy = u.totalQuestionsAttempted
        ? Math.round((u.totalCorrect / u.totalQuestionsAttempted) * 100)
        : 0;
      return [
        u.name,
        u.email,
        u.role,
        u.totalSessions,
        u.totalQuestionsAttempted,
        u.totalCorrect,
        u.totalMockTests,
        accuracy,
        u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never',
        new Date(u.createdAt).toLocaleDateString(),
      ];
    });

    sendCSV(res, `attendance-${Date.now()}.csv`, toCSV(headers, rows));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;