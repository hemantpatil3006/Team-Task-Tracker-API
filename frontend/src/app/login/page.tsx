'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Layers, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoHeader}>
        <Layers size={28} color="#6366f1" />
        <span style={styles.logoText}>FlowTask</span>
      </div>

      <div className="glass-card anim-scale-in" style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>Welcome Back</h2>
          <p style={styles.subtitle}>Enter your details to access your workspace</p>
        </div>

        {error && (
          <div style={styles.errorAlert} className="anim-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label className="label-glass">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                className="input-glass"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="label-glass">Password</label>
            </div>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                className="input-glass"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                Signing In...
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={styles.switchPage}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={styles.switchLink}>
            Create one free
          </Link>
        </p>

        {/* Quick Login Section */}
        <div style={styles.quickLoginSection}>
          <div style={styles.divider}>
            <span style={styles.dividerText}>Or Quick Login As</span>
          </div>
          <div style={styles.quickGrid}>
            <button
              onClick={() => handleQuickLogin('admin@demo.com', 'Admin1234!')}
              style={styles.quickBtn}
              className="glass"
            >
              <span style={{ fontWeight: 600, color: '#ef4444' }}>ADMIN</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alice</span>
            </button>
            <button
              onClick={() => handleQuickLogin('manager@demo.com', 'Manager1234!')}
              style={styles.quickBtn}
              className="glass"
            >
              <span style={{ fontWeight: 600, color: '#f59e0b' }}>MANAGER</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bob</span>
            </button>
            <button
              onClick={() => handleQuickLogin('member@demo.com', 'Member1234!')}
              style={styles.quickBtn}
              className="glass"
            >
              <span style={{ fontWeight: 600, color: '#3b82f6' }}>MEMBER</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carol</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at bottom, rgba(99, 102, 241, 0.1), transparent 60%)',
    padding: '1.5rem',
  },
  logoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '2.5rem 2rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: 'var(--shadow-xl)',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  errorAlert: {
    background: 'var(--error-bg)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 500,
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  submitBtn: {
    marginTop: '0.5rem',
    width: '100%',
    padding: '0.85rem',
  },
  switchPage: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '1.5rem',
  },
  switchLink: {
    color: 'var(--accent-primary)',
    fontWeight: 600,
  },
  quickLoginSection: {
    marginTop: '2.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  divider: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    position: 'absolute',
    background: '#121215',
    padding: '0 0.75rem',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.75rem',
  },
  quickBtn: {
    padding: '0.65rem 0.5rem',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.15rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.2s ease',
  },
};
