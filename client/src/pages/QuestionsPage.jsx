import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, BookOpen, Code2, CheckCircle2, Circle,
  ChevronRight, Bookmark, BookmarkCheck, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { api } from '../context/AuthContext';

const TOPICS = ['All', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Express', 'HTML/CSS', 'DSA', 'System Design', 'TypeScript', 'Python', 'Java', 'SQL'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const TYPES = ['All', 'mcq', 'coding'];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const topic = searchParams.get('topic') || 'All';
  const difficulty = searchParams.get('difficulty') || 'All';
  const type = searchParams.get('type') || 'All';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'All') next.delete(key); else next.set(key, value);
    next.set('page', '1');
    setSearchParams(next);
  };

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (topic !== 'All') params.topic = topic;
      if (difficulty !== 'All') params.difficulty = difficulty;
      if (type !== 'All') params.type = type;
      if (search) params.search = search;
      const res = await api.get('/questions', { params });
      setQuestions(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [topic, difficulty, type, search, page]);

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(new Set(res.data.data.map(b => b.question?._id)));
    } catch {}
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);
  useEffect(() => { loadBookmarks(); }, [loadBookmarks]);

  const toggleBookmark = async (e, qId) => {
    e.stopPropagation();
    try {
      if (bookmarks.has(qId)) {
        await api.delete(`/bookmarks/${qId}`);
        setBookmarks(prev => { const next = new Set(prev); next.delete(qId); return next; });
      } else {
        await api.post('/bookmarks', { questionId: qId });
        setBookmarks(prev => new Set([...prev, qId]));
      }
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Question Bank</h1>
        <p className="page-subtitle">Practice MCQs and coding problems by topic and difficulty</p>
      </div>

      {/* Search */}
      <div className="input-with-icon" style={{ marginBottom: '20px', maxWidth: '480px' }}>
        <Search size={16} className="input-icon" />
        <input
          className="form-control"
          placeholder="Search questions..."
          defaultValue={search}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('search', e.target.value);
              else next.delete('search');
              next.set('page', '1');
              setSearchParams(next);
            }
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Type</div>
        <div className="filter-bar" style={{ marginBottom: '12px' }}>
          {TYPES.map(t => (
            <button key={t} className={`filter-chip ${type === t ? 'active' : ''}`} onClick={() => setFilter('type', t)}>
              {t === 'mcq' ? '📋 MCQ' : t === 'coding' ? '💻 Coding' : 'All'}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Difficulty</div>
        <div className="filter-bar" style={{ marginBottom: '12px' }}>
          {DIFFICULTIES.map(d => (
            <button key={d} className={`filter-chip ${difficulty === d ? 'active' : ''}`} onClick={() => setFilter('difficulty', d)}>
              {d}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Topic</div>
        <div className="filter-bar">
          {TOPICS.map(t => (
            <button key={t} className={`filter-chip ${topic === t ? 'active' : ''}`} onClick={() => setFilter('topic', t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {loading ? 'Loading...' : `${pagination.total} questions found`}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadQuestions}>
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : questions.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} className="empty-state-icon" />
          <h3>No questions found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="question-list">
          {questions.map((q, i) => (
            <div
              key={q._id}
              className={`question-item ${q.userStatus?.correct ? 'solved' : q.userStatus?.attempted ? 'attempted' : ''}`}
              onClick={() => navigate(`/questions/${q._id}`)}
            >
              {/* Status indicator */}
              <div style={{ flexShrink: 0 }}>
                {q.userStatus?.correct ? (
                  <CheckCircle2 size={18} color="var(--green)" />
                ) : q.userStatus?.attempted ? (
                  <CheckCircle2 size={18} color="var(--yellow)" />
                ) : (
                  <Circle size={18} color="var(--text-muted)" />
                )}
              </div>

              {/* Number */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '32px', fontWeight: '600' }}>
                {((page - 1) * 20) + i + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
                  <span className={`badge badge-${q.type}`}>
                    {q.type === 'mcq' ? '📋 MCQ' : '💻 Coding'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.topic}</span>
                </div>
              </div>

              {/* Tags (desktop) */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {q.tags?.slice(0, 2).map((tag, ti) => (
                  <span key={ti} className="tag">{tag}</span>
                ))}
              </div>

              {/* Bookmark */}
              <button
                className="btn btn-ghost btn-icon"
                onClick={e => toggleBookmark(e, q._id)}
                style={{ flexShrink: 0 }}
              >
                {bookmarks.has(q._id)
                  ? <BookmarkCheck size={16} color="var(--yellow)" />
                  : <Bookmark size={16} color="var(--text-muted)" />
                }
              </button>

              <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setFilter('page', String(page - 1))}
          >
            Previous
          </button>
          {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter('page', String(p))}
            >
              {p}
            </button>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === pagination.pages}
            onClick={() => setFilter('page', String(page + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}