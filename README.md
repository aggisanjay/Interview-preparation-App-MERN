<div align="center">

# ⚡ PrepForge

### Full-Stack Interview Preparation Platform

**Practice MCQ & Coding Questions · Timed Mock Tests · Analytics Dashboard · Streak Tracking**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## 🔍 Overview

PrepForge is a production-ready full-stack interview preparation platform built with the **MERN stack** (MongoDB, Express, React, Node.js). It helps developers systematically prepare for technical interviews through structured practice, mock tests, and detailed performance analytics.

Users can practice **MCQ and coding questions** across 14+ topics, take **timed mock tests**, bookmark questions with personal notes, track **daily streaks**, and export their progress as CSV reports. Admins can create and manage the question bank.

---

## ✨ Features

### 🎯 Practice
- **MCQ Questions** — instant feedback with correct answer reveal and explanation
- **Coding Questions** — in-browser JavaScript runner with real test cases (Run Tests → Submit)
- **Solution Guard** — viewing the solution disables scoring to protect accuracy integrity
- Filter by topic, difficulty, and type with full-text search
- Bookmark questions with personal notes and custom collections

### 📝 Mock Tests
- Generate tests by topic, difficulty, question count, and duration
- Real-time countdown timer with auto-submit on expiry
- Question navigation pills, per-question answer tracking
- Detailed result page with score, accuracy, and answer review

### 📊 Analytics
- Overview stats: total attempted, accuracy %, streak, mock test count
- Daily activity chart (30-day window)
- Topic performance bar chart
- Test score history line chart
- Difficulty breakdown pie chart

### 🏆 Streak System
- Daily streak increments on login or question submission
- Resets after a missed day, preserves same-day idempotency
- Live streak badge in the topbar

### 👤 Profile
- Edit display name with instant topbar sync
- Change password with current-password verification
- Live stats: attempted, correct, accuracy bar, streak, mock tests, sessions
- Export progress as CSV (practice history & test history)

### 🔐 Admin
- Full question CRUD (MCQ and coding)
- Attendance / user stats CSV export

---

## 🖼️ Screenshots


<table>
  <tr>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Questions</b></td>
  </tr>
  <tr>
    <td><img width="420" alt="image" src="https://github.com/user-attachments/assets/03f925de-5fed-4733-8f36-9fd90678a8a2" /></td>
    <td><img width="420"  alt="image" src="https://github.com/user-attachments/assets/b4cc23e0-3f9b-48f2-a63a-77a91f3ba839" /></td>
  </tr>
  <tr>
    <td align="center"><b>Mock Tests</b></td>
    <td align="center"><b>Analytics</b></td>
  </tr>
  <tr>
    <td><img width="420"  alt="image" src="https://github.com/user-attachments/assets/8654a4d2-6055-4a03-b563-29433a02dd5f" /></td>
    <td><img width="420"  alt="image" src="https://github.com/user-attachments/assets/16f5bfb8-4a1a-4810-95c4-5daebed39102" /> </td>
  </tr>
</table>



---



## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Axios, Recharts, Lucide React |
| **Backend** | Node.js 18+, Express 4, ES6 Modules (`"type": "module"`) |
| **Database** | MongoDB 8 + Mongoose 8 |
| **Auth** | JSON Web Tokens (JWT) + bcryptjs |
| **Styling** | Custom dark-theme CSS with CSS Variables |
| **Fonts** | Syne (headings) · DM Sans (body) · Fira Code (code editor) |

---

## 🗂 Project Structure

```
prepforge/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT protect + adminOnly guards
│   ├── models/
│   │   ├── Attempt.js
│   │   ├── Bookmark.js
│   │   ├── MockTest.js
│   │   ├── Question.js
│   │   └── User.js
│   ├── routes/
│   │   ├── analytics.js
│   │   ├── auth.js
│   │   ├── bookmarks.js
│   │   ├── export.js
│   │   ├── mocktest.js
│   │   └── questions.js
│   ├── utils/
│   │   └── streak.js            # Day-based streak calculation
│   ├── .env.example
│   ├── package.json             # "type": "module" for ESM
│   ├── seed.js                  # Sample questions + admin user
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── context/
        │   └── AuthContext.js   # JWT state, Axios interceptors, refreshUser
        ├── pages/
        │   ├── AnalyticsPage.js
        │   ├── BookmarksPage.js
        │   ├── Dashboard.js
        │   ├── LoginPage.js
        │   ├── MockTestPage.js
        │   ├── MockTestResultPage.js
        │   ├── ProfilePage.js
        │   ├── QuestionDetailPage.js  # Code runner + solution guard
        │   ├── QuestionsPage.js
        │   └── RegisterPage.js
        ├── components/
        │   └── Layout.js        # Sidebar + topbar + streak badge
        ├── App.js
        ├── index.js
        └── styles.css           # Dark theme CSS variables
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local) or a [MongoDB Atlas](https://cloud.mongodb.com) cluster
- **npm** v9+

### 1 — Clone the repository

```bash
git clone https://github.com/your-username/prepforge.git
cd prepforge
```

### 2 — Backend setup

```bash
cd backend
npm install

# Copy the example env file and fill in your values
cp .env.example .env
```

Edit `.env` (see [Environment Variables](#-environment-variables) below).

```bash
# Seed the database with 12 sample questions + admin account
npm run seed

# Start the development server (port 5000)
npm run dev
```

### 3 — Frontend setup

```bash
cd ../frontend
npm install

# Start React dev server (port 3000, proxies API to :5000)
npm start
```

Open **http://localhost:3000** in your browser.

### 4 — Default admin credentials

```
Email:    admin@interviewprep.com
Password: admin123
```

> ⚠️ Change these immediately in any non-local environment.

---

## 🔐 Environment Variables

Create `backend/.env` from the provided `.env.example`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB — local
MONGO_URI=mongodb://localhost:27017/interview_prep

# MongoDB Atlas (comment the line above and uncomment below)
# MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/interview_prep?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d

# CORS
CLIENT_URL=http://localhost:3000
```

---

## 📡 API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | — | Register new user |
| `POST` | `/auth/login` | — | Login, returns JWT + full user stats |
| `GET` | `/auth/me` | ✅ | Get current user (live from DB) |
| `PUT` | `/auth/profile` | ✅ | Update display name |
| `PUT` | `/auth/change-password` | ✅ | Change password |

### Questions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/questions` | ✅ | List questions with filters & pagination |
| `GET` | `/questions/topics` | ✅ | Topic stats + user progress |
| `GET` | `/questions/:id` | ✅ | Single question with full detail |
| `POST` | `/questions/:id/submit` | ✅ | Submit answer — records attempt, updates streak |
| `POST` | `/questions` | Admin | Create question |
| `PUT` | `/questions/:id` | Admin | Update question |
| `DELETE` | `/questions/:id` | Admin | Soft-delete question |

### Mock Tests

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/mocktest/generate` | ✅ | Generate test (returns questions) |
| `POST` | `/mocktest/:id/start` | ✅ | Mark test as in-progress |
| `POST` | `/mocktest/:id/submit` | ✅ | Submit answers, calculate score |
| `GET` | `/mocktest` | ✅ | List user's tests |
| `GET` | `/mocktest/:id` | ✅ | Single test with results |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/analytics/overview` | ✅ | Summary stats |
| `GET` | `/analytics/topic-breakdown` | ✅ | Per-topic accuracy |
| `GET` | `/analytics/activity` | ✅ | 30-day daily activity |
| `GET` | `/analytics/test-history` | ✅ | Last 20 mock test scores |
| `GET` | `/analytics/difficulty-breakdown` | ✅ | Easy/Medium/Hard split |

### Bookmarks & Export

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/bookmarks` | ✅ | List bookmarks (filter by collection) |
| `POST` | `/bookmarks` | ✅ | Bookmark a question |
| `PUT` | `/bookmarks/:id` | ✅ | Update notes / collection |
| `DELETE` | `/bookmarks/:questionId` | ✅ | Remove bookmark |
| `GET` | `/export/my-progress` | ✅ | CSV — practice history |
| `GET` | `/export/my-tests` | ✅ | CSV — mock test history |
| `GET` | `/export/attendance` | Admin | CSV — all users attendance |

---

## 🗄 Database Schema

### User
```
name, email, password (bcrypt), role (user|admin)
streak, lastStudyDate, totalSessions, lastActive, loginHistory[]
totalQuestionsAttempted, totalCorrect, totalMockTests
topicProgress: Map<topic, { attempted, correct }>
```

### Question
```
type (mcq|coding), title, description, topic, difficulty
options[], correctAnswer                          — MCQ only
examples[], constraints[], starterCode{}, solution{}  — Coding only
solutionExplanation, timeComplexity, spaceComplexity
hints[], tags[], totalAttempts, correctAttempts, isActive
```

### MockTest
```
user (ref), title, topic, difficulty, duration (min)
questions[{ question (ref), selectedAnswer, isCorrect, timeTaken }]
status (pending|in-progress|completed|abandoned)
score, accuracy, correctAnswers, totalQuestions, timeTaken
startedAt, completedAt
```

### Attempt
```
user (ref), question (ref), selectedAnswer
isCorrect, timeTaken, mode (practice|mock), mockTest (ref)
```

### Bookmark
```
user (ref), question (ref), notes (max 500), collection
```

---

## 🐛 Bug Fixes & Known Issues

### Fixed in v1.1

| # | Bug | Fix |
|---|-----|-----|
| 1 | **Accuracy drops when viewing solution** | `solutionPeeked` flag disables scoring; backend rejects `FAIL` submissions; Run Tests is now 100% client-side |
| 2 | **Code runner shows "Got: empty"** | Replaced `Object.keys(this)` detection with `extractFunctionName()` regex; runner calls function by name directly |
| 3 | **Streak never updating** | New `utils/streak.js` called on login, register, and every question submission |
| 4 | **Profile shows stale stats** | Profile fetches live data on mount via `GET /auth/me`; `refreshUser()` now syncs localStorage |

### In-browser code runner limitations

- Live test execution supports **JavaScript only**. Python and Java submissions are recorded without test verification.
- Test cases are currently hardcoded for the seeded questions. Adding new coding questions requires adding corresponding entries to `TEST_CASES` in `QuestionDetailPage.js`.
- For a production setup, replace the client-side runner with a sandboxed execution service (e.g. [Judge0](https://judge0.com)).

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Commit convention

```
feat:     new feature
fix:      bug fix
docs:     documentation only
style:    formatting, no logic change
refactor: code restructure
test:     adding tests
chore:    build / tooling
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using the MERN stack

</div>
