import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Timer, Target, RotateCcw } from 'lucide-react';
import { api } from '../context/AuthContext';

export default function MockTestResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/mocktest/${id}`).then(res => setTest(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!test) return <div className="empty-state"><h3>Test not found</h3></div>;

  const scoreColor = test.score >= 70 ? 'var(--green)' : test.score >= 50 ? 'var(--yellow)' : 'var(--red)';

  return (
    <div style={{ maxWidth: '760px' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/mocktest')} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} /> Back to Tests
      </button>

      <div style={{
        textAlign: 'center', padding: '40px 32px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', marginBottom: '24px'
      }}>
        <Trophy size={36} color={scoreColor} style={{ margin: '0 auto 12px' }} />
        <div style={{ fontSize: '48px', fontWeight: '900', fontFamily: 'Syne, sans-serif', color: scoreColor }}>
          {test.score}%
        </div>
        <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '6px', marginBottom: '20px', color: 'var(--text-secondary)' }}>
          {test.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
          {[
            { label: 'Correct', value: test.correctAnswers },
            { label: 'Total', value: test.totalQuestions },
            { label: 'Time', value: `${Math.round(test.timeTaken / 60)}m` }
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: scoreColor }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title" style={{ marginBottom: '16px' }}>Question Review</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {test.questions?.map((q, i) => (
            <div key={i} style={{
              display: 'flex', gap: '12px', padding: '14px',
              background: 'var(--bg-secondary)',
              border: `1px solid ${q.isCorrect ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
              borderRadius: 'var(--radius-sm)'
            }}>
              {q.isCorrect
                ? <CheckCircle2 size={18} color="var(--green)" style={{ flexShrink: 0 }} />
                : <XCircle size={18} color="var(--red)" style={{ flexShrink: 0 }} />
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
                  Q{i+1}: {q.question?.title}
                </div>
                {!q.isCorrect && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Your answer: <span style={{ color: 'var(--red)' }}>{q.selectedAnswer || 'Not answered'}</span>
                    {' · '} Correct: <span style={{ color: 'var(--green)' }}>{q.question?.correctAnswer}</span>
                  </div>
                )}
              </div>
              <span className={`badge badge-${q.question?.difficulty?.toLowerCase()}`}>
                {q.question?.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={() => navigate('/mocktest')}>
          <RotateCcw size={15} /> New Test
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>
          <Target size={15} /> Analytics
        </button>
      </div>
    </div>
  );
}