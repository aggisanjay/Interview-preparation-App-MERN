
import React, { useState } from 'react';
import {
  User, Mail, Lock, Save, Download, Shield,
  Eye, EyeOff, CheckCircle2, Award, Calendar, Zap
} from 'lucide-react';
import { api, useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', { name });
      await refreshUser();
      showAlert('success', 'Profile updated successfully');
    } catch {
      showAlert('error', 'Failed to update profile');
    }
    setSaving(false);
  };

  const changePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      showAlert('error', 'Passwords do not match');
      return;
    }
    setChangingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass
      });
      setPasswords({ current: '', newPass: '', confirm: '' });
      showAlert('success', 'Password changed successfully');
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Failed to change password');
    }
    setChangingPass(false);
  };

  const exportProgress = async () => {
    try {
      const res = await api.get('/export/my-progress', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `my-progress-${Date.now()}.csv`; a.click();
    } catch {}
  };

  const exportTests = async () => {
    try {
      const res = await api.get('/export/my-tests', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = `my-tests-${Date.now()}.csv`; a.click();
    } catch {}
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '20px' }}>
          <CheckCircle2 size={15} />
          {alert.msg}
        </div>
      )}

      {/* Avatar / Identity */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '800', color: 'white', flexShrink: 0
          }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{user?.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                padding: '3px 10px',
                background: user?.role === 'admin' ? 'var(--purple-dim)' : 'var(--accent-glow)',
                border: `1px solid ${user?.role === 'admin' ? 'rgba(167,139,250,0.2)' : 'rgba(79,142,247,0.2)'}`,
                borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                color: user?.role === 'admin' ? 'var(--purple)' : 'var(--accent)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                <Shield size={10} style={{ display: 'inline', marginRight: '3px' }} />
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px',
          paddingTop: '20px', borderTop: '1px solid var(--border)'
        }}>
          {[
            { icon: Award, label: 'Total Questions', value: user?.totalQuestionsAttempted || 0, color: 'var(--accent)' },
            { icon: Zap, label: 'Streak', value: `${user?.streak || 0} days`, color: 'var(--yellow)' },
            { icon: Calendar, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : 'N/A', color: 'var(--green)' }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <s.icon size={18} color={s.color} style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
          <User size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Personal Info
        </h2>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-with-icon">
            <User size={16} className="input-icon" />
            <input
              className="form-control"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              className="form-control"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Email cannot be changed
          </div>
        </div>

        <button className="btn btn-primary" onClick={updateProfile} disabled={saving}>
          {saving ? 'Saving...' : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      {/* Change Password */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>
          <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Change Password
        </h2>

        <div className="form-group">
          <label className="form-label">Current Password</label>
          <div className="input-with-icon" style={{ position: 'relative' }}>
            <Lock size={16} className="input-icon" />
            <input
              type={showPass.current ? 'text' : 'password'}
              className="form-control"
              placeholder="Enter current password"
              value={passwords.current}
              onChange={e => setPasswords({ ...passwords, current: e.target.value })}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => ({ ...p, current: !p.current }))}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {showPass.current ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="input-with-icon" style={{ position: 'relative' }}>
            <Lock size={16} className="input-icon" />
            <input
              type={showPass.new ? 'text' : 'password'}
              className="form-control"
              placeholder="Min. 6 characters"
              value={passwords.newPass}
              onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => ({ ...p, new: !p.new }))}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {showPass.new ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Re-enter new password"
            value={passwords.confirm}
            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={changePassword}
          disabled={changingPass || !passwords.current || !passwords.newPass || !passwords.confirm}
        >
          {changingPass ? 'Updating...' : <><Lock size={14} /> Update Password</>}
        </button>
      </div>

      {/* Data Export */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
          <Download size={16} style={{ display: 'inline', marginRight: '8px' }} />
          Export My Data
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Download your progress and test history as CSV files
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={exportProgress}>
            <Download size={14} /> Practice Progress
          </button>
          <button className="btn btn-secondary" onClick={exportTests}>
            <Download size={14} /> Test History
          </button>
        </div>
      </div>
    </div>
  );
}