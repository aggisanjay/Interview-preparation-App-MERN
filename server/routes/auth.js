
import { Router } from 'express';
import User from '../models/User.js';
import { protect, generateToken } from '../middleware/auth.js';
import { updateStreak } from '../utils/streak.js';

const router = Router();

// ─── Serialise user safely ────────────────────────────────────────────────────
const safeUser = (u) => ({
  id:                      u._id,
  name:                    u.name,
  email:                   u.email,
  role:                    u.role,
  streak:                  u.streak,
  totalQuestionsAttempted: u.totalQuestionsAttempted,
  totalCorrect:            u.totalCorrect,
  totalMockTests:          u.totalMockTests,
  totalSessions:           u.totalSessions,
  lastStudyDate:           u.lastStudyDate,
  createdAt:               u.createdAt,
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    updateStreak(user);
    user.totalSessions = 1;
    user.loginHistory.push({ date: new Date(), ip: req.ip });
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, message: 'Registration successful', token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // ── Streak calculation ──
    updateStreak(user);

    user.loginHistory.push({ date: new Date(), ip: req.ip });
    user.totalSessions += 1;
    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({ success: true, message: 'Login successful', token, user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'Name is required' });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).lean();

    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/auth/change-password ───────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords are required' });

    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;