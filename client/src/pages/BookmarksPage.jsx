import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark, BookmarkX, Search, FolderOpen, ChevronRight,
  Tag, StickyNote, X
} from 'lucide-react';
import { api } from '../context/AuthContext';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [collections, setCollections] = useState(['All', 'General']);
  const [activeCollection, setActiveCollection] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [bmRes, colRes] = await Promise.all([
        api.get('/bookmarks'),
        api.get('/bookmarks/collections')
      ]);
      setBookmarks(bmRes.data.data);
      setCollections(['All', ...colRes.data.data]);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const removeBookmark = async (e, qId) => {
    e.stopPropagation();
    try {
      await api.delete(`/bookmarks/${qId}`);
      setBookmarks(prev => prev.filter(b => b.question?._id !== qId));
    } catch {}
  };

  const saveNote = async (bmId) => {
    try {
      await api.put(`/bookmarks/${bmId}`, { notes: noteText });
      setBookmarks(prev => prev.map(b => b._id === bmId ? { ...b, notes: noteText } : b));
      setEditingNote(null);
    } catch {}
  };

  const filtered = bookmarks.filter(bm => {
    const matchCollection = activeCollection === 'All' || bm.collection === activeCollection;
    const matchSearch = !search ||
      bm.question?.title?.toLowerCase().includes(search.toLowerCase()) ||
      bm.question?.topic?.toLowerCase().includes(search.toLowerCase());
    return matchCollection && matchSearch;
  });

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bookmarks</h1>
        <p className="page-subtitle">
          {bookmarks.length} saved question{bookmarks.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search & filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div className="input-with-icon" style={{ flex: 1, maxWidth: '360px' }}>
          <Search size={16} className="input-icon" />
          <input
            className="form-control"
            placeholder="Search bookmarks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {collections.map(c => (
            <button
              key={c}
              className={`filter-chip ${activeCollection === c ? 'active' : ''}`}
              onClick={() => setActiveCollection(c)}
            >
              <FolderOpen size={12} /> {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={48} className="empty-state-icon" />
          <h3>No bookmarks yet</h3>
          <p>Save questions you want to revisit by clicking the bookmark icon</p>
          <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={() => navigate('/questions')}>
            Browse Questions
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map(bm => (
            <div
              key={bm._id}
              className="card card-hover"
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                  background: bm.question?.type === 'mcq' ? 'var(--accent-glow)' : 'var(--purple-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Tag size={16} color={bm.question?.type === 'mcq' ? 'var(--accent)' : 'var(--purple)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer', lineHeight: '1.4' }}
                    onClick={() => navigate(`/questions/${bm.question?._id}`)}
                  >
                    {bm.question?.title}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span className={`badge badge-${bm.question?.difficulty?.toLowerCase()}`}>
                      {bm.question?.difficulty}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {bm.question?.topic}
                    </span>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ flexShrink: 0 }}
                  onClick={e => removeBookmark(e, bm.question?._id)}
                  title="Remove bookmark"
                >
                  <BookmarkX size={15} color="var(--text-muted)" />
                </button>
              </div>

              {/* Notes section */}
              <div style={{
                padding: '10px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                minHeight: '48px'
              }}>
                {editingNote === bm._id ? (
                  <div>
                    <textarea
                      className="form-control"
                      style={{ fontSize: '12px', minHeight: '64px', marginBottom: '8px', resize: 'none' }}
                      placeholder="Add a note..."
                      value={noteText}
                      onChange={e => setNoteText(e.target.value)}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => saveNote(bm._id)}>Save</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingNote(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      setEditingNote(bm._id);
                      setNoteText(bm.notes || '');
                    }}
                    style={{ fontSize: '12px', color: bm.notes ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'text' }}
                  >
                    <StickyNote size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {bm.notes || 'Click to add notes...'}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <FolderOpen size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  {bm.collection}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px' }}
                  onClick={() => navigate(`/questions/${bm.question?._id}`)}
                >
                  Practice <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}