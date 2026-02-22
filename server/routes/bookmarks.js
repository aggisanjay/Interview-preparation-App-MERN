import { Router } from 'express';
import Bookmark from '../models/Bookmark.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/bookmarks ───────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { collection } = req.query;
    const query = { user: req.user._id };
    if (collection) query.collection = collection;

    const data = await Bookmark.find(query)
      .populate('question', 'title type topic difficulty description options correctAnswer')
      .sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/bookmarks/collections ──────────────────────────────────────────
router.get('/collections', protect, async (req, res) => {
  try {
    const data = await Bookmark.distinct('collection', { user: req.user._id });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/bookmarks ──────────────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { questionId, notes = '', collection = 'General' } = req.body;

    const existing = await Bookmark.findOne({ user: req.user._id, question: questionId });
    if (existing)
      return res.status(409).json({ success: false, message: 'Already bookmarked' });

    const bookmark = await Bookmark.create({ user: req.user._id, question: questionId, notes, collection });
    const populated = await bookmark.populate('question', 'title type topic difficulty');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/bookmarks/:id ───────────────────────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const { notes, collection } = req.body;
    const bookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { notes, collection },
      { new: true }
    ).populate('question', 'title type topic difficulty');

    if (!bookmark) return res.status(404).json({ success: false, message: 'Bookmark not found' });
    res.json({ success: true, data: bookmark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/bookmarks/:questionId ───────────────────────────────────────
router.delete('/:questionId', protect, async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ question: req.params.questionId, user: req.user._id });
    res.json({ success: true, message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;