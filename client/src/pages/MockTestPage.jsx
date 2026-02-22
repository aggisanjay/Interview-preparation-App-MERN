import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Timer, Play, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  AlertTriangle, Trophy, Clock, Target, RotateCcw, Download
} from 'lucide-react';
import { api } from '../context/AuthContext';

const TOPICS = ['Mixed', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'DSA', 'HTML/CSS', 'TypeScript', 'Python', 'SQL'];
const DIFFICULTIES = ['Mixed', 'Easy', 'Medium', 'Hard'];
const DURATIONS = [10, 15, 20, 30, 45, 60];
const COUNTS = [5, 10, 15, 20, 25, 30];

export default function MockTestPage() {
  const [phase, setPhase] = useState('setup'); // setup | test | result
  const [config, setConfig] = useState({ topic: 'Mixed', difficulty: 'Mixed', count: 10, duration: 20 });
  const [testData, setTestData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/mocktest').then(res => setHistory(res.data.data || [])).catch(() => {});
  }, []);

  const startTest = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/mocktest/generate', config);
      const data = res.data.data;
      setTestData(data);
      setTimeLeft(data.duration * 60);
      setAnswers({});
      setCurrentQ(0);
      await api.post(`/mocktest/${data.testId}/start`);
      setPhase('test');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate test');
    }
    setGenerating(false);
  };

  const submitTest = useCallback(async () => {
    if (!testData) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const answersArr = testData.questions.map(q => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || null
      }));
      const res = await api.post(`/mocktest/${testData.testId}/submit`, {
        answers: answersArr,
        timeTaken: testData.duration * 60 - timeLeft
      });
      setResult(res.data.data);
      setPhase('result');
    } catch {}
    setSubmitting(false);
  }, [testData, answers, timeLeft]);

  // Timer effect
  useEffect(() => {
    if (phase !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitTest]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const exportResults = async () => {
    try {
      const response = await api.get('/export/my-tests', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mock-tests-${Date.now()}.csv`;
      a.click();
    } catch {}
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Mock Tests</h1>
          <p className="page-subtitle">Test your knowledge with timed mock interviews</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Config */}
          <div className="card">
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>Configure Your Test</h2>

            <div className="form-group">
              <label className="form-label">Topic</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TOPICS.map(t => (
                  <button
                    key={t}
                    className={`filter-chip ${config.topic === t ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, topic: t })}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DIFFICULTIES.map(d => (
                  <button
                    key={d}
                    className={`filter-chip ${config.difficulty === d ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, difficulty: d })}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Questions</label>
                <select
                  className="form-control"
                  value={config.count}
                  onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
                >
                  {COUNTS.map(c => <option key={c} value={c}>{c} Questions</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select
                  className="form-control"
                  value={config.duration}
                  onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })}
                >
                  {DURATIONS.map(d => <option key={d} value={d}>{d} Minutes</option>)}
                </select>
              </div>
            </div>

            {/* Summary */}
            <div style={{
              background: 'var(--accent-glow)', border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '20px',
              fontSize: '13px', color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Topic', value: config.topic },
                  { label: 'Questions', value: config.count },
                  { label: 'Time Limit', value: `${config.duration} min` }
                ].map((item, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '16px' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={startTest}
              disabled={generating}
            >
              {generating ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Generating Test...
                </>
              ) : (
                <><Play size={16} /> Start Test</>
              )}
            </button>
          </div>

          {/* History */}
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="section-header">
                <div className="section-title">Recent Tests</div>
                <button className="btn btn-ghost btn-sm" onClick={exportResults}>
                  <Download size={14} /> Export
                </button>
              </div>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No tests taken yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.slice(0, 8).map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px', background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '8px', flexShrink: 0,
                        background: t.score >= 70 ? 'var(--green-dim)' : t.score >= 50 ? 'var(--yellow-dim)' : 'var(--red-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: '800',
                        color: t.score >= 70 ? 'var(--green)' : t.score >= 50 ? 'var(--yellow)' : 'var(--red)'
                      }}>
                        {t.score}%
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.topic} Test
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {t.correctAnswers}/{t.totalQuestions} • {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TEST PHASE
  if (phase === 'test' && testData) {
    const q = testData.questions[currentQ];
    const answered = Object.keys(answers).length;
    const timePercent = (timeLeft / (testData.duration * 60)) * 100;
    const isLow = timeLeft < 120;

    return (
      <div style={{ maxWidth: '760px' }}>
        {/* Test Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '20px', padding: '16px 20px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>{testData.title}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {answered}/{testData.totalQuestions} answered
            </div>
          </div>

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '24px', fontWeight: '800', fontFamily: 'Syne, sans-serif',
            color: isLow ? 'var(--red)' : 'var(--text-primary)',
            padding: '8px 16px',
            background: isLow ? 'var(--red-dim)' : 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${isLow ? 'rgba(248,113,113,0.3)' : 'var(--border)'}`,
            transition: 'all 0.3s'
          }}>
            <Clock size={20} color={isLow ? 'var(--red)' : 'var(--text-muted)'} />
            {formatTime(timeLeft)}
          </div>

          <button className="btn btn-danger btn-sm" onClick={submitTest} disabled={submitting}>
            Submit Test
          </button>
        </div>

        {/* Progress bar */}
        <div className="progress-bar" style={{ marginBottom: '4px', height: '4px' }}>
          <div className="progress-fill" style={{
            width: `${timePercent}%`,
            background: isLow ? 'var(--red)' : timePercent > 50 ? 'var(--green)' : 'var(--yellow)'
          }} />
        </div>

        {/* Question navigation pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '16px 0' }}>
          {testData.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              style={{
                width: 32, height: 32, borderRadius: '8px', border: 'none',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                background: i === currentQ
                  ? 'var(--accent)'
                  : answers[testData.questions[i]._id]
                    ? 'var(--green-dim)'
                    : 'var(--bg-secondary)',
                color: i === currentQ
                  ? 'white'
                  : answers[testData.questions[i]._id]
                    ? 'var(--green)'
                    : 'var(--text-muted)',
                border: `1px solid ${i === currentQ ? 'transparent' : answers[testData.questions[i]._id] ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
                transition: 'all 0.15s'
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Question {currentQ + 1} of {testData.totalQuestions}
            </span>
            <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.topic}</span>
          </div>

          <p style={{ fontSize: '16px', lineHeight: '1.7', fontWeight: '500', marginBottom: '20px' }}>
            {q.title || q.description}
          </p>

          <div className="mcq-options">
            {q.options?.map(opt => (
              <div
                key={opt.label}
                className={`mcq-option ${answers[q._id] === opt.label ? 'selected' : ''}`}
                onClick={() => setAnswers({ ...answers, [q._id]: opt.label })}
              >
                <div className="option-label"
                  style={answers[q._id] === opt.label ? { background: 'var(--accent-glow)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                >
                  {opt.label}
                </div>
                <span>{opt.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <button
            className="btn btn-secondary"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ(c => c - 1)}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {currentQ < testData.totalQuestions - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentQ(c => c + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={submitTest}
              disabled={submitting}
            >
              <CheckCircle2 size={16} /> Finish Test
            </button>
          )}
        </div>
      </div>
    );
  }

  // RESULT PHASE
  if (phase === 'result' && result) {
    const scoreColor = result.score >= 70 ? 'var(--green)' : result.score >= 50 ? 'var(--yellow)' : 'var(--red)';
    return (
      <div style={{ maxWidth: '760px' }}>
        {/* Score Hero */}
        <div style={{
          textAlign: 'center', padding: '40px 32px',
          background: 'linear-gradient(135deg, var(--bg-card), var(--bg-secondary))',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          marginBottom: '24px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '300px', height: '300px',
            background: `radial-gradient(circle, ${scoreColor}15 0%, transparent 70%)`,
            borderRadius: '50%'
          }} />
          <Trophy size={40} color={scoreColor} style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: '64px', fontWeight: '900', fontFamily: 'Syne, sans-serif', color: scoreColor, lineHeight: 1 }}>
            {result.score}%
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '8px', marginBottom: '20px' }}>
            {result.score >= 70 ? '🎉 Excellent Performance!' : result.score >= 50 ? '💪 Good Effort!' : '📚 Keep Practicing!'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            {[
              { label: 'Correct', value: result.correctAnswers, color: 'var(--green)' },
              { label: 'Total', value: result.totalQuestions, color: 'var(--accent)' },
              { label: 'Time', value: `${Math.round(result.timeTaken / 60)}m`, color: 'var(--purple)' }
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Review */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="section-header">
            <div className="section-title">Question Review</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {result.questions?.map((q, i) => (
              <div key={i} style={{
                display: 'flex', gap: '12px', padding: '14px',
                background: 'var(--bg-secondary)',
                border: `1px solid ${q.isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                borderRadius: 'var(--radius-sm)'
              }}>
                {q.isCorrect
                  ? <CheckCircle2 size={18} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  : <XCircle size={18} color="var(--red)" style={{ flexShrink: 0, marginTop: '2px' }} />
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                    Q{i+1}: {q.question?.title || 'Question'}
                  </div>
                  {!q.isCorrect && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Your answer: <span style={{ color: 'var(--red)' }}>{q.selectedAnswer || 'Not answered'}</span>
                      {' · '} Correct: <span style={{ color: 'var(--green)' }}>{q.question?.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => { setPhase('setup'); setTestData(null); setResult(null); }}>
            <RotateCcw size={16} /> Take Another Test
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>
            <Target size={16} /> View Analytics
          </button>
          <button className="btn btn-secondary" onClick={exportResults}>
            <Download size={16} /> Export Results
          </button>
        </div>
      </div>
    );
  }

  return null;
}