import React, { useEffect, useState } from 'react';
import { Download, TrendingUp, Target, BarChart3, Calendar, Award } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { api } from '../context/AuthContext';

const COLORS = ['#4f8ef7', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#f87171', '#60a5fa', '#4ade80'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '10px 14px', fontSize: '12px'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: '600' }}>
          {p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}
          {p.name.toLowerCase().includes('accuracy') || p.name === 'score' ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [topicBreakdown, setTopicBreakdown] = useState([]);
  const [activity, setActivity] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [diffBreakdown, setDiffBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ovRes, topRes, actRes, testRes, diffRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/topic-breakdown'),
          api.get('/analytics/activity'),
          api.get('/analytics/test-history'),
          api.get('/analytics/difficulty-breakdown')
        ]);
        setOverview(ovRes.data.data);
        setTopicBreakdown(topRes.data.data);
        setActivity(actRes.data.data.map(a => ({
          ...a,
          date: a._id.slice(5), // MM-DD
          accuracy: a.count > 0 ? Math.round(a.correct / a.count * 100) : 0
        })));
        setTestHistory(testRes.data.data.map(t => ({
          ...t,
          date: new Date(t.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
        })));
        setDiffBreakdown(diffRes.data.data.map(d => ({
          ...d,
          accuracy: d.attempted > 0 ? Math.round(d.correct / d.attempted * 100) : 0
        })));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const exportProgress = async () => {
    try {
      const res = await api.get('/export/my-progress', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `progress-${Date.now()}.csv`; a.click();
    } catch {}
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const radarData = topicBreakdown.slice(0, 6).map(t => ({
    topic: t._id,
    accuracy: Math.round(t.accuracy || 0),
    fullMark: 100
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your performance and identify areas to improve</p>
        </div>
        <button className="btn btn-secondary" onClick={exportProgress}>
          <Download size={14} /> Export Progress
        </button>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Questions', value: overview?.totalAttempts || 0, color: 'blue', sub: `${overview?.weeklyAttempts || 0} this week` },
          { label: 'Overall Accuracy', value: `${overview?.accuracy || 0}%`, color: 'green', sub: `${overview?.correctAttempts || 0} correct` },
          { label: 'Mock Tests', value: overview?.totalTests || 0, color: 'yellow', sub: `Avg ${overview?.avgTestScore || 0}%` },
          { label: 'Login Streak', value: `${overview?.streak || 0}d`, color: 'purple', sub: `${overview?.totalSessions || 0} total sessions` }
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{
              color: ['var(--accent)', 'var(--green)', 'var(--yellow)', 'var(--purple)'][i]
            }}>
              {s.value}
            </div>
            <div className="stat-meta">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="content-grid" style={{ marginBottom: '24px' }}>
        {/* Daily Activity */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Daily Activity (30 days)</div>
            <Calendar size={16} color="var(--text-muted)" />
          </div>
          {activity.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No activity data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activity} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="none" />
                <YAxis tick={{ fontSize: 10 }} stroke="none" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Questions" fill="var(--accent)" radius={[3,3,0,0]} />
                <Bar dataKey="correct" name="Correct" fill="var(--green)" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Test Score History */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Mock Test Scores</div>
            <TrendingUp size={16} color="var(--text-muted)" />
          </div>
          {testHistory.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>Take mock tests to see your progress</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={testHistory.slice().reverse()} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="none" />
                <YAxis domain={[0,100]} tick={{ fontSize: 10 }} stroke="none" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" name="score" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="content-grid">
        {/* Topic Performance */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Topic Accuracy</div>
            <BarChart3 size={16} color="var(--text-muted)" />
          </div>
          {topicBreakdown.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>Practice questions to see topic breakdown</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicBreakdown} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0,100]} tick={{ fontSize: 10 }} stroke="none" />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={80} stroke="none" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accuracy" name="accuracy" radius={[0,4,4,0]}>
                  {topicBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Difficulty Breakdown */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Difficulty Breakdown</div>
            <Target size={16} color="var(--text-muted)" />
          </div>
          {diffBreakdown.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <p>No data yet</p>
            </div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={diffBreakdown}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    dataKey="attempted"
                    nameKey="_id"
                  >
                    {diffBreakdown.map((_, i) => (
                      <Cell key={i} fill={['var(--green)', 'var(--yellow)', 'var(--red)'][i] || COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {diffBreakdown.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '2px', flexShrink: 0,
                      background: ['var(--green)', 'var(--yellow)', 'var(--red)'][i]
                    }} />
                    <span style={{ flex: 1, fontSize: '13px' }}>{d._id}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.attempted} attempted</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: ['var(--green)', 'var(--yellow)', 'var(--red)'][i] }}>
                      {d.accuracy}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}