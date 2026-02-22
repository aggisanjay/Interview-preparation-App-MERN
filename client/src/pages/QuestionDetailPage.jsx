

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, XCircle, Lightbulb,
  Bookmark, BookmarkCheck, Eye, EyeOff, Clock, Tag,
  ChevronDown, Play, Send, Terminal, RotateCcw, AlertTriangle
} from 'lucide-react';
import { api, useAuth } from '../context/AuthContext';

// ── In-browser JS runner ──────────────────────────────────────────────────────
/**
 * Extracts the first top-level function name from code.
 * Handles: function foo(...), const foo = (...) =>, const foo = function(...)
 */
const extractFunctionName = (code) => {
  const patterns = [
    /^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/m,
    /^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\(/m,
    /^\s*(?:export\s+)?(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?function/m,
  ];
  for (const re of patterns) {
    const m = code.match(re);
    if (m) return m[1];
  }
  return null;
};

const runJavaScript = (code, testCases) => {
  const cleanCode = code
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+/gm, '');

  const fnName = extractFunctionName(cleanCode);
  if (!fnName) {
    return testCases.map(tc => ({
      input: tc.input, expected: tc.expected,
      output: 'Error: Could not detect function name. Make sure your function is declared at the top level.',
      passed: false,
    }));
  }

  return testCases.map(tc => {
    try {
      // eslint-disable-next-line no-new-func
      const fn  = new Function(`${cleanCode}\nreturn ${fnName}(${tc.args});`);
      const raw = fn();
      const output = JSON.stringify(raw);

      let expected;
      try { expected = JSON.stringify(JSON.parse(tc.expected)); }
      catch { expected = tc.expected; }

      // Support alternative correct answers
      const alts = (tc.alternatives || []).map(a => {
        try { return JSON.stringify(JSON.parse(a)); } catch { return a; }
      });
      const passed = output === expected || alts.includes(output);
      return { input: tc.input, expected, output, passed };
    } catch (err) {
      return { input: tc.input, expected: tc.expected, output: `Runtime Error: ${err.message}`, passed: false };
    }
  });
};

// ── Test cases per question ───────────────────────────────────────────────────
const TEST_CASES = {
  'Two Sum': [
    { input: 'nums=[2,7,11,15], target=9', args: '[2,7,11,15], 9', expected: '[0,1]' },
    { input: 'nums=[3,2,4], target=6',     args: '[3,2,4], 6',     expected: '[1,2]' },
    { input: 'nums=[3,3], target=6',       args: '[3,3], 6',       expected: '[0,1]' },
  ],
  'Deep Flatten Array': [
    { input: '[1,[2,[3,[4]],5]]', args: '[1,[2,[3,[4]],5]]', expected: '[1,2,3,4,5]' },
    { input: '[1,2,3]',           args: '[1,2,3]',           expected: '[1,2,3]' },
    { input: '[[["a"]]]',         args: '[[["a"]]]',         expected: '["a"]' },
  ],
  'Longest Palindromic Substring': [
    { input: '"babad"',   args: '"babad"',   expected: '"bab"',     alternatives: ['"aba"'] },
    { input: '"cbbd"',    args: '"cbbd"',    expected: '"bb"' },
    { input: '"a"',       args: '"a"',       expected: '"a"' },
    { input: '"racecar"', args: '"racecar"', expected: '"racecar"' },
  ],
};

const LANG_LABELS = { javascript: 'JavaScript', python: 'Python', java: 'Java' };

export default function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [question,      setQuestion]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState(null);
  const [mcqResult,     setMcqResult]     = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [showSolution,  setShowSolution]  = useState(false);
  // ── KEY: was solution peeked BEFORE submitting? ───────────────────────────
  const [solutionPeeked, setSolutionPeeked] = useState(false);
  const [showHints,     setShowHints]     = useState(false);
  const [isBookmarked,  setIsBookmarked]  = useState(false);
  const [code,          setCode]          = useState('');
  const [lang,          setLang]          = useState('javascript');
  const [timer,         setTimer]         = useState(0);
  const [testResults,   setTestResults]   = useState(null);
  const [runningTests,  setRunningTests]  = useState(false);
  const [codeSubmitted, setCodeSubmitted] = useState(false);
  const [submitMsg,     setSubmitMsg]     = useState(null); // { type, text }

  // ── Load question + bookmarks ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, bmRes] = await Promise.all([
          api.get(`/questions/${id}`),
          api.get('/bookmarks'),
        ]);
        const q = qRes.data.data;
        setQuestion(q);
        setCode(q.starterCode?.[lang] || '');
        const bmIds = new Set(bmRes.data.data.map(b => b.question?._id));
        setIsBookmarked(bmIds.has(id));
      } catch {}
      setLoading(false);
    };
    load();
  }, [id]);

  // Update code when lang changes
  useEffect(() => {
    if (question) setCode(question.starterCode?.[lang] || '');
    setTestResults(null);
    setCodeSubmitted(false);
    setSubmitMsg(null);
  }, [lang, question]);

  // Timer
  useEffect(() => {
    const iv = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTime = s =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Toggle solution — mark peeked if not yet submitted ────────────────────
  const toggleSolution = () => {
    const opening = !showSolution;
    setShowSolution(opening);
    if (opening) {
      // Only mark as peeked if user hasn't submitted yet
      if (question?.type === 'mcq'  && !mcqResult)     setSolutionPeeked(true);
      if (question?.type === 'coding' && !codeSubmitted) setSolutionPeeked(true);
    }
  };

  // ── MCQ submit ────────────────────────────────────────────────────────────
  const submitMCQ = async () => {
    if (!selected || solutionPeeked) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/questions/${id}/submit`, {
        selectedAnswer: selected,
        timeTaken: timer,
      });
      setMcqResult(res.data);
      if (res.data.userStats) await refreshUser();
    } catch {}
    setSubmitting(false);
  };

  // ── Bookmark toggle ───────────────────────────────────────────────────────
  const toggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${id}`);
        setIsBookmarked(false);
      } else {
        await api.post('/bookmarks', { questionId: id });
        setIsBookmarked(true);
      }
    } catch {}
  };

  // ── Run Tests — PURELY CLIENT-SIDE, never touches the API ─────────────────
  const runTests = useCallback(() => {
    setRunningTests(true);
    setTestResults(null);
    setSubmitMsg(null);

    setTimeout(() => {
      if (lang !== 'javascript') {
        setTestResults({ notSupported: true, results: [] });
        setRunningTests(false);
        return;
      }
      const cases = TEST_CASES[question?.title] || [];
      if (!cases.length) {
        setTestResults({ noCases: true, results: [] });
        setRunningTests(false);
        return;
      }
      setTestResults({ results: runJavaScript(code, cases) });
      setRunningTests(false);
    }, 500);
  }, [code, lang, question]);

  // ── Submit Solution — records attempt ONLY if solution was not peeked ─────
  const submitSolution = useCallback(async () => {
    if (codeSubmitted || solutionPeeked) return;
    setSubmitting(true);
    setSubmitMsg(null);

    // Always run tests first so user sees results
    let passed = false;
    if (lang === 'javascript') {
      const cases = TEST_CASES[question?.title] || [];
      if (cases.length) {
        const results = runJavaScript(code, cases);
        setTestResults({ results });
        passed = results.every(r => r.passed);
        if (!passed) {
          setSubmitMsg({ type: 'error', text: 'Some test cases failed. Fix your code and resubmit.' });
          setSubmitting(false);
          return; // ← don't record a failed attempt, let them fix and retry
        }
      } else {
        passed = true;
      }
    } else {
      // Python/Java: trust the user, record as submitted
      passed = true;
    }

    // Only reach here if passed (or non-JS)
    try {
      await api.post(`/questions/${id}/submit`, {
        selectedAnswer: 'PASS',
        timeTaken: timer,
      });
      await refreshUser();
      setCodeSubmitted(true);
      setSubmitMsg({ type: 'success', text: '🎉 All tests passed! Solution recorded.' });
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    }
    setSubmitting(false);
  }, [code, lang, question, id, timer, refreshUser, codeSubmitted, solutionPeeked]);

  // ── Reset code ────────────────────────────────────────────────────────────
  const resetCode = () => {
    if (question) setCode(question.starterCode?.[lang] || '');
    setTestResults(null);
    setCodeSubmitted(false);
    setSubmitMsg(null);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!question) return (
    <div className="empty-state">
      <h3>Question not found</h3>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/questions')}>
        Back to Questions
      </button>
    </div>
  );

  // Peeked warning banner
  const PeekedBanner = () => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 16px', marginBottom: '12px',
      background: 'rgba(251,191,36,0.08)',
      border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: 'var(--radius-sm)',
    }}>
      <AlertTriangle size={15} color="var(--yellow)" style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ fontSize: '13px', color: 'var(--yellow)', lineHeight: '1.5' }}>
        <strong>Solution viewed</strong> — this attempt won't be scored to keep your accuracy fair.
        Reload the page to attempt this question without peeking.
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '920px' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className={`badge badge-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
            <span className={`badge badge-${question.type}`}>
              {question.type === 'mcq' ? '📋 MCQ' : '💻 Coding'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{question.topic}</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', lineHeight: 1.3 }}>{question.title}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '6px 12px', fontSize: '13px',
            color: timer > 120 ? 'var(--yellow)' : 'var(--text-secondary)',
          }}>
            <Clock size={14} /> {formatTime(timer)}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={toggleBookmark}>
            {isBookmarked
              ? <BookmarkCheck size={18} color="var(--yellow)" />
              : <Bookmark size={18} />}
          </button>
        </div>
      </div>

      {/* ── Problem statement ────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
          Problem Statement
        </h3>
        <p style={{ fontSize: '15px', lineHeight: '1.7' }}>{question.description}</p>

        {question.type === 'coding' && question.examples?.map((ex, i) => (
          <div key={i} style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Example {i + 1}
            </div>
            <div style={{
              background: '#0d1117', borderRadius: '8px', padding: '12px',
              fontFamily: 'Fira Code, monospace', fontSize: '13px', border: '1px solid var(--border)',
            }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Input: </span>{ex.input}</div>
              <div><span style={{ color: 'var(--text-muted)' }}>Output: </span><span style={{ color: 'var(--green)' }}>{ex.output}</span></div>
              {ex.explanation && <div style={{ color: 'var(--text-muted)', marginTop: '4px' }}>// {ex.explanation}</div>}
            </div>
          </div>
        ))}

        {question.constraints?.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Constraints</div>
            <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.8' }}>
              {question.constraints.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {question.tags?.length > 0 && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={13} color="var(--text-muted)" />
            <div className="tags">
              {question.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* ── MCQ Options ─────────────────────────────────────────────────────── */}
      {question.type === 'mcq' && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
            Select Your Answer
          </h3>

          {/* Peeked warning */}
          {solutionPeeked && !mcqResult && <PeekedBanner />}

          <div className="mcq-options">
            {question.options?.map(opt => {
              let cls = 'mcq-option';
              if (mcqResult) {
                if (opt.label === question.correctAnswer) cls += ' correct';
                else if (opt.label === selected && !mcqResult.isCorrect) cls += ' incorrect';
              } else if (selected === opt.label) cls += ' selected';

              return (
                <div
                  key={opt.label}
                  className={cls}
                  onClick={() => !mcqResult && !solutionPeeked && setSelected(opt.label)}
                  style={{ opacity: solutionPeeked && !mcqResult ? 0.5 : 1, cursor: solutionPeeked && !mcqResult ? 'not-allowed' : 'pointer' }}
                >
                  <div className="option-label"
                    style={
                      mcqResult && opt.label === question.correctAnswer
                        ? { background: 'var(--green-dim)', borderColor: 'var(--green)', color: 'var(--green)' }
                        : selected === opt.label && !mcqResult
                          ? { background: 'var(--accent-glow)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                          : {}
                    }>
                    {opt.label}
                  </div>
                  <span style={{ fontSize: '14px', flex: 1 }}>{opt.text}</span>
                  {mcqResult && opt.label === question.correctAnswer && <CheckCircle2 size={16} color="var(--green)" />}
                  {mcqResult && opt.label === selected && !mcqResult.isCorrect && <XCircle size={16} color="var(--red)" />}
                </div>
              );
            })}
          </div>

          {mcqResult && (
            <div className={`alert alert-${mcqResult.isCorrect ? 'success' : 'error'}`} style={{ marginTop: '16px' }}>
              {mcqResult.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <div>
                <strong>{mcqResult.isCorrect ? '✅ Correct!' : `❌ Incorrect. Answer: ${question.correctAnswer}`}</strong>
                {mcqResult.explanation && <p style={{ fontSize: '13px', marginTop: '4px', opacity: 0.85 }}>{mcqResult.explanation}</p>}
              </div>
            </div>
          )}

          {!mcqResult && (
            <button
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: '16px' }}
              onClick={submitMCQ}
              disabled={!selected || submitting || solutionPeeked}
              title={solutionPeeked ? 'Scoring disabled — solution was viewed' : ''}
            >
              {submitting ? 'Submitting...' : solutionPeeked ? '🔒 Scoring Disabled (Solution Viewed)' : 'Submit Answer'}
            </button>
          )}
        </div>
      )}

      {/* ── Coding Editor ───────────────────────────────────────────────────── */}
      {question.type === 'coding' && (
        <div className="card" style={{ marginBottom: '20px' }}>
          {/* Peeked warning */}
          {solutionPeeked && !codeSubmitted && <PeekedBanner />}

          {/* Language tabs + reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Object.keys(question.starterCode || {}).map(l => (
                <button
                  key={l}
                  className={`filter-chip ${lang === l ? 'active' : ''}`}
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                  onClick={() => setLang(l)}
                >
                  {LANG_LABELS[l] || l}
                </button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={resetCode}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {/* Editor */}
          <textarea
            className="code-editor"
            value={code}
            onChange={e => { setCode(e.target.value); setTestResults(null); setSubmitMsg(null); }}
            spellCheck="false"
            style={{ minHeight: '240px', fontFamily: '"Fira Code", "Cascadia Code", monospace' }}
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const s = e.target.selectionStart;
                setCode(v => v.substring(0, s) + '  ' + v.substring(e.target.selectionEnd));
                setTimeout(() => e.target.setSelectionRange(s + 2, s + 2), 0);
              }
            }}
          />

          {/* Test Results panel */}
          {testResults && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                background: 'var(--bg-secondary)', borderRadius: '8px 8px 0 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <Terminal size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Test Results</span>
                {!testResults.notSupported && !testResults.noCases && testResults.results?.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: '12px', fontWeight: '700',
                    color: testResults.results.every(r => r.passed) ? 'var(--green)' : 'var(--red)',
                  }}>
                    {testResults.results.filter(r => r.passed).length}/{testResults.results.length} passed
                  </span>
                )}
              </div>
              <div style={{
                background: '#0d1117', border: '1px solid var(--border)', borderTop: 'none',
                borderRadius: '0 0 8px 8px', padding: '12px', maxHeight: '280px', overflowY: 'auto',
              }}>
                {testResults.notSupported && (
                  <div style={{ color: 'var(--yellow)', fontSize: '13px', fontFamily: 'monospace' }}>
                    ⚠ In-browser runner supports JavaScript only.<br />
                    <span style={{ color: 'var(--text-muted)' }}>You can still submit your {lang} solution to record it.</span>
                  </div>
                )}
                {testResults.noCases && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                    No automated test cases. Review the examples manually then submit.
                  </div>
                )}
                {testResults.results?.map((r, i) => (
                  <div key={i} style={{
                    marginBottom: '10px', padding: '10px',
                    background: r.passed ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                    border: `1px solid ${r.passed ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                    borderRadius: '6px', fontFamily: 'Fira Code, monospace', fontSize: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {r.passed ? <CheckCircle2 size={14} color="var(--green)" /> : <XCircle size={14} color="var(--red)" />}
                      <span style={{ fontWeight: '600', color: r.passed ? 'var(--green)' : 'var(--red)' }}>
                        Test {i + 1} — {r.passed ? 'Passed ✓' : 'Failed ✗'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: '1.8' }}>
                      <div>Input:    <span style={{ color: '#e6edf3' }}>{r.input}</span></div>
                      <div>Expected: <span style={{ color: 'var(--green)' }}>{r.expected}</span></div>
                      <div>Got:      <span style={{ color: r.passed ? 'var(--green)' : 'var(--red)' }}>{r.output}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit message */}
          {submitMsg && (
            <div className={`alert alert-${submitMsg.type}`} style={{ marginTop: '12px' }}>
              {submitMsg.type === 'success' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {submitMsg.text}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={runTests}
              disabled={runningTests || !code.trim()}
            >
              {runningTests
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Running...</>
                : <><Play size={14} /> Run Tests</>}
            </button>
            <button
              className="btn btn-primary"
              onClick={submitSolution}
              disabled={submitting || !code.trim() || codeSubmitted || solutionPeeked}
              title={solutionPeeked ? 'Scoring disabled — solution was viewed' : codeSubmitted ? 'Already submitted' : ''}
            >
              {submitting
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting...</>
                : codeSubmitted
                  ? <><CheckCircle2 size={14} /> Submitted</>
                  : solutionPeeked
                    ? '🔒 Scoring Disabled'
                    : <><Send size={14} /> Submit Solution</>}
            </button>
            {lang !== 'javascript' && !solutionPeeked && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                💡 Live test runner works with JavaScript only.
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Hints ───────────────────────────────────────────────────────────── */}
      {question.hints?.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--yellow)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%' }}
            onClick={() => setShowHints(!showHints)}
          >
            <Lightbulb size={16} fill={showHints ? 'currentColor' : 'none'} />
            Hints ({question.hints.length})
            <ChevronDown size={14} style={{ transform: showHints ? 'rotate(180deg)' : '', transition: 'transform 0.2s', marginLeft: 'auto' }} />
          </button>
          {showHints && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              {question.hints.map((h, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  <span style={{ color: 'var(--yellow)', fontWeight: '700', minWidth: '20px' }}>{i + 1}.</span>
                  {h}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Solution ────────────────────────────────────────────────────────── */}
      <div className="card">
        <button
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', width: '100%',
            color: (mcqResult || codeSubmitted) ? 'var(--accent)' : 'var(--text-muted)'
          }}
          onClick={toggleSolution}
        >
          {showSolution ? <EyeOff size={16} /> : <Eye size={16} />}
          {showSolution ? 'Hide Solution' : 'View Solution'}
          {/* Warn before peeking */}
          {!showSolution && !mcqResult && !codeSubmitted && (
            <span style={{ fontSize: '11px', background: 'var(--red-dim)', color: 'var(--red)', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px' }}>
              ⚠ disables scoring
            </span>
          )}
        </button>

        {showSolution && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {question.solutionExplanation && (
              <div style={{
                marginBottom: '16px', padding: '14px',
                background: 'var(--accent-glow)', borderRadius: '8px',
                border: '1px solid rgba(79,142,247,0.15)',
                fontSize: '14px', lineHeight: '1.7',
              }}>
                {question.solutionExplanation}
              </div>
            )}
            {question.solution?.javascript && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>JavaScript</div>
                <pre style={{
                  background: '#0d1117', borderRadius: '8px', padding: '16px',
                  overflow: 'auto', fontSize: '13px',
                  fontFamily: '"Fira Code", monospace', lineHeight: '1.7',
                  color: '#e6edf3', border: '1px solid var(--border)',
                }}>
                  {question.solution.javascript}
                </pre>
              </div>
            )}
            <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
              {question.timeComplexity && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Time: </span>
                  <span style={{ color: 'var(--green)', fontFamily: 'monospace', fontWeight: '600' }}>{question.timeComplexity}</span>
                </div>
              )}
              {question.spaceComplexity && (
                <div style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Space: </span>
                  <span style={{ color: 'var(--purple)', fontFamily: 'monospace', fontWeight: '600' }}>{question.spaceComplexity}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}