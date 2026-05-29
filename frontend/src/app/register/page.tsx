'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Layers, User, Mail, Lock, Building2, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !organizationName) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(name, email, password, organizationName);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoHeader}>
        <Layers size={28} color="#6366f1" />
        <span style={styles.logoText}>FlowTask</span>
      </div>

      <div className="glass-card anim-scale-in" style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Get started with a new organization workspace</p>
        </div>

        {error && (
          <div style={styles.errorAlert} className="anim-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label className="label-glass">Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                type="text"
                className="input-glass"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label className="label-glass">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                className="input-glass"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label className="label-glass">Organization / Company Name</label>
            <div style={styles.inputWrapper}>
              <Building2 size={18} style={styles.inputIcon} />
              <input
                type="text"
                className="input-glass"
                placeholder="Acme Corp"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label className="label-glass">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                className="input-glass"
                placeholder="At least 8 characters"
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
                Creating Account...
              </>
            ) : (
              <>
                Register Workspace <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={styles.switchPage}>
          Already have an account?{' '}
          <Link href="/login" style={styles.switchLink}>
            Sign In
          </Link>
        </p>
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
    marginBottom: '2.5rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
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
};
