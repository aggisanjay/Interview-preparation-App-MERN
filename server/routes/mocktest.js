import { Router } from 'express';
import MockTest from '../models/MockTest.js';
import Question from '../models/Question.js';
import Attempt  from '../models/Attempt.js';
import User     from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// ─── POST /api/mocktest/generate ─────────────────────────────────────────────
router.post('/generate', protect, async (req, res) => {
  try {
    const { topic, difficulty, count = 10, duration = 20 } = req.body;

    const match = { isActive: true, type: 'mcq' };
    if (topic     && topic     !== 'Mixed') match.topic      = topic;
    if (difficulty && difficulty !== 'Mixed') match.difficulty = difficulty;

    const questions = await Question.aggregate([
      { $match: match },
      { $sample: { size: parseInt(count) } },
      { $project: { solution: 0, solutionExplanation: 0 } },
    ]);

    if (!questions.length)
      return res.status(400).json({ success: false, message: 'No questions found for these criteria' });

    const mockTest = await MockTest.create({
      user:           req.user._id,
      title:          `${topic || 'Mixed'} Mock Test – ${new Date().toLocaleDateString()}`,
      topic:          topic      || 'Mixed',
      difficulty:     difficulty || 'Mixed',
      duration:       parseInt(duration),
      totalQuestions: questions.length,
      questions:      questions.map(q => ({ question: q._id })),
      status:         'pending',
    });

    res.status(201).json({
      success: true,
      data: {
        testId:         mockTest._id,
        title:          mockTest.title,
        duration:       mockTest.duration,
        totalQuestions: mockTest.totalQuestions,
        questions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/mocktest/:id/start ────────────────────────────────────────────
router.post('/:id/start', protect, async (req, res) => {
  try {
    const test = await MockTest.findOne({ _id: req.params.id, user: req.user._id });
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    test.status    = 'in-progress';
    test.startedAt = new Date();
    await test.save();

    res.json({ success: true, message: 'Test started' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/mocktest/:id/submit ───────────────────────────────────────────
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    // answers: [{ questionId, selectedAnswer }]

    const test = await MockTest.findOne({ _id: req.params.id, user: req.user._id })
      .populate('questions.question');

    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status === 'completed')
      return res.status(400).json({ success: false, message: 'Test already submitted' });

    const answerMap = Object.fromEntries(
      (answers ?? []).map(a => [a.questionId, a.selectedAnswer])
    );

    let correctCount = 0;
    const updatedQuestions = test.questions.map(q => {
      const selected  = answerMap[q.question._id.toString()] ?? null;
      const isCorrect = selected !== null && selected === q.question.correctAnswer;
      if (isCorrect) correctCount++;
      return { ...q.toObject(), selectedAnswer: selected, isCorrect };
    });

    test.questions      = updatedQuestions;
    test.status         = 'completed';
    test.correctAnswers = correctCount;
    test.score          = Math.round((correctCount / test.totalQuestions) * 100);
    test.accuracy       = test.score;
    test.timeTaken      = timeTaken ?? 0;
    test.completedAt    = new Date();
    await test.save();

    // Persist individual attempts
    const attemptDocs = updatedQuestions.map(q => ({
      user:           req.user._id,
      question:       q.question._id,
      selectedAnswer: q.selectedAnswer,
      isCorrect:      q.isCorrect,
      mockTest:       test._id,
      mode:           'mock',
    }));
    await Attempt.insertMany(attemptDocs);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalMockTests:          1,
        totalQuestionsAttempted: test.totalQuestions,
        totalCorrect:            correctCount,
      },
    });

    res.json({
      success: true,
      data: {
        testId:         test._id,
        score:          test.score,
        correctAnswers: correctCount,
        totalQuestions: test.totalQuestions,
        timeTaken:      test.timeTaken,
        questions:      updatedQuestions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/mocktest ────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const [data, total] = await Promise.all([
      MockTest.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-questions'),
      MockTest.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, data, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/mocktest/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await MockTest.findOne({ _id: req.params.id, user: req.user._id })
      .populate('questions.question');
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;