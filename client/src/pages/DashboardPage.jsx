import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Timer, Target, TrendingUp, ArrowRight, Zap,
  Trophy, ChevronRight, BarChart3, Code2, Star
} from 'lucide-react';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [topics, setTopics] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, topRes, testRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/questions/topics'),
          api.get('/analytics/test-history')
        ]);
        setOverview(ovRes.data.data);
        setTopics(topRes.data.data.slice(0, 6));
        setTests(testRes.data.data.slice(0, 5));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const difficultyData = [
    { name: 'Easy', value: 40, color: 'var(--green)' },
    { name: 'Medium', value: 35, color: 'var(--yellow)' },
    { name: 'Hard', value: 25, color: 'var(--red)' },
  ];

  const quickActions = [
    { label: 'Practice MCQs', icon: BookOpen, color: 'var(--accent)', path: '/questions?type=mcq', bg: 'var(--accent-glow)' },
    { label: 'Coding Problems', icon: Code2, color: 'var(--purple)', path: '/questions?type=coding', bg: 'var(--purple-dim)' },
    { label: 'Take Mock Test', icon: Timer, color: 'var(--green)', path: '/mocktest', bg: 'var(--green-dim)' },
    { label: 'View Bookmarks', icon: Star, color: 'var(--yellow)', path: '/bookmarks', bg: 'var(--yellow-dim)' },
  ];

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" style={{ width: 48, height: 48 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f1a2e 0%, #111827 50%, #0f1a2e 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              padding: '4px 12px', background: 'var(--accent-glow)',
              border: '1px solid rgba(79,142,247,0.3)', borderRadius: '20px',
              fontSize: '12px', color: 'var(--accent)', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <Zap size={11} fill="currentColor" /> Day {overview?.streak || 1} Streak
            </div>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>
            Welcome back, <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px' }}>
            You've completed {overview?.totalAttempts || 0} questions with {overview?.accuracy || 0}% accuracy.
            Keep pushing — your next interview is closer than you think.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => navigate('/questions')}
          >
            Continue Practicing <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {[
          { label: 'Total Attempted', value: overview?.totalAttempts || 0, color: 'blue', icon: BookOpen, meta: `${overview?.weeklyAttempts || 0} this week` },
          { label: 'Accuracy Rate', value: `${overview?.accuracy || 0}%`, color: 'green', icon: Target, meta: `${overview?.correctAttempts || 0} correct` },
          { label: 'Mock Tests', value: overview?.totalTests || 0, color: 'yellow', icon: Timer, meta: `Avg ${overview?.avgTestScore || 0}% score` },
          { label: 'Best Score', value: `${overview?.bestTestScore || 0}%`, color: 'purple', icon: Trophy, meta: 'All time best' }
        ].map((stat, i) => (
          <div key={i} className={`stat-card ${stat.color}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="stat-label">{stat.label}</div>
              <stat.icon size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="stat-value" style={{
              color: i === 0 ? 'var(--accent)' : i === 1 ? 'var(--green)' : i === 2 ? 'var(--yellow)' : 'var(--purple)'
            }}>
              {stat.value}
            </div>
            <div className="stat-meta">{stat.meta}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '28px' }}>
        <div className="section-header">
          <div className="section-title">Quick Actions</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              style={{
                background: action.bg,
                border: `1px solid ${action.color}30`,
                borderRadius: 'var(--radius)',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${action.color}20`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '10px',
                background: `${action.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <action.icon size={18} color={action.color} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {action.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Start now <ChevronRight size={10} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column: Topics + Recent Tests */}
      <div className="content-grid">
        {/* Topic Progress */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Topic Progress</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/questions')}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topics.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p>No topic data yet. Start practicing!</p>
              </div>
            ) : (
              topics.map((topic, i) => {
                const progress = topic.total > 0
                  ? Math.round((topic.userProgress?.attempted || 0) / topic.total * 100)
                  : 0;
                const accuracy = topic.userProgress?.attempted > 0
                  ? Math.round((topic.userProgress?.correct / topic.userProgress?.attempted) * 100)
                  : 0;
                return (
                  <div key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/questions?topic=${topic._id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                      <span style={{ fontWeight: '600' }}>{topic._id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {topic.userProgress?.attempted || 0}/{topic.total} • {accuracy}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${progress}%`,
                        background: progress >= 70 ? 'var(--green)' : progress >= 40 ? 'var(--accent)' : 'var(--yellow)'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Test Results */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Tests</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/mocktest')}>
              New Test <ArrowRight size={14} />
            </button>
          </div>
          {tests.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px' }}>
              <Timer size={36} className="empty-state-icon" />
              <h3>No tests yet</h3>
              <p>Take a mock test to track your performance</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={() => navigate('/mocktest')}>
                Start First Test
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tests.map((test, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '10px',
                    background: test.score >= 70 ? 'var(--green-dim)' : test.score >= 50 ? 'var(--yellow-dim)' : 'var(--red-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '14px', fontWeight: '800',
                      color: test.score >= 70 ? 'var(--green)' : test.score >= 50 ? 'var(--yellow)' : 'var(--red)'
                    }}>
                      {test.score}%
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {test.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {test.correctAnswers}/{test.totalQuestions} correct · {new Date(test.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}