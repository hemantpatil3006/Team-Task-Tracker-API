'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { 
  Layers, 
  Shield, 
  Zap, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Users,
  Kanban
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      {/* Header / Navbar */}
      <header style={styles.header} className="glass">
        <div style={styles.logoContainer}>
          <Layers size={26} color="#6366f1" />
          <span style={styles.logoText}>FlowTask</span>
        </div>
        <div style={styles.navLinks}>
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Enter Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero} className="anim-fade-in">
        <div style={styles.heroBadge} className="glass">
          <Zap size={14} color="#06b6d4" />
          <span>The All-In-One SaaS Workspace</span>
        </div>
        
        <h1 style={styles.heroTitle}>
          Streamline your team&apos;s workflow, <span style={styles.accentText}>beautifully.</span>
        </h1>
        
        <p style={styles.heroSubtitle}>
          A premium, high-performance task management workspace built for modern organizations. Complete with real-time analytics, automated Redis caching, and robust security.
        </p>

        <div style={styles.heroCtas}>
          {user ? (
            <Link href="/dashboard" className="btn-primary" style={styles.largeBtn}>
              Go to Workspace <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary" style={styles.largeBtn}>
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="btn-secondary" style={styles.largeBtn}>
                Demo Account
              </Link>
            </>
          )}
        </div>

        {/* Dashboard Preview / Mockup */}
        <div style={styles.previewContainer} className="glass anim-slide-up">
          <div style={styles.previewHeader}>
            <div style={styles.windowDots}>
              <span style={{...styles.dot, backgroundColor: '#ef4444'}}></span>
              <span style={{...styles.dot, backgroundColor: '#f59e0b'}}></span>
              <span style={{...styles.dot, backgroundColor: '#10b981'}}></span>
            </div>
            <span style={styles.previewTitle}>FlowTask Workspace — Demo Project</span>
          </div>
          <div style={styles.previewContent}>
            {/* Sidebar Mock */}
            <div style={styles.mockSidebar}>
              <div style={styles.mockLinkActive}></div>
              <div style={styles.mockLink}></div>
              <div style={styles.mockLink}></div>
            </div>
            {/* Dashboard Mock */}
            <div style={styles.mockBody}>
              <div style={styles.mockGrid}>
                <div style={styles.mockCard} className="glass">
                  <span style={styles.mockCardLabel}>Total Tasks</span>
                  <span style={styles.mockCardVal}>12</span>
                </div>
                <div style={styles.mockCard} className="glass">
                  <span style={styles.mockCardLabel}>In Progress</span>
                  <span style={styles.mockCardVal}>4</span>
                </div>
                <div style={styles.mockCard} className="glass">
                  <span style={styles.mockCardLabel}>Overdue Tasks</span>
                  <span style={{...styles.mockCardVal, color: '#ef4444'}}>1</span>
                </div>
              </div>
              <div style={styles.mockKanban}>
                <div style={styles.mockCol}>
                  <div style={styles.mockColHeader}>TODO</div>
                  <div style={styles.mockTask}></div>
                  <div style={styles.mockTask}></div>
                </div>
                <div style={styles.mockCol}>
                  <div style={styles.mockColHeader}>IN PROGRESS</div>
                  <div style={{...styles.mockTask, height: '80px'}}></div>
                </div>
                <div style={styles.mockCol}>
                  <div style={styles.mockColHeader}>DONE</div>
                  <div style={styles.mockTask}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <h2 style={styles.featuresHeading}>Engineered for high-performing squads</h2>
        <p style={styles.featuresSubheading}>FlowTask integrates security, analytics, and speed into one lightweight platform.</p>
        
        <div style={styles.featuresGrid}>
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconBox}><Shield size={24} color="#6366f1" /></div>
            <h3 style={styles.featureTitle}>Role-Based Security</h3>
            <p style={styles.featureDesc}>Enforce hierarchical access control (Admin, Manager, Member) directly at the router and middleware levels.</p>
          </div>
          
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconBox}><Kanban size={24} color="#06b6d4" /></div>
            <h3 style={styles.featureTitle}>Visual Kanban Flows</h3>
            <p style={styles.featureDesc}>Manage task lifecycles with advanced state-machine transition guardrails to prevent illegal updates.</p>
          </div>
          
          <div className="glass-card" style={styles.featureCard}>
            <div style={styles.iconBox}><BarChart3 size={24} color="#ec4899" /></div>
            <h3 style={styles.featureTitle}>Overdue & Velocity Analytics</h3>
            <p style={styles.featureDesc}>Identify team bottlenecks instantly with automatic overdue metrics and average task completion duration.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>&copy; 2026 FlowTask Inc. All rights reserved.</p>
        <div style={styles.footerLinks}>
          <a href="#" style={styles.footerLink}>Terms</a>
          <a href="#" style={styles.footerLink}>Privacy</a>
          <a href="http://localhost:3000/api/docs" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>API Docs</a>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 60%)',
    overflowX: 'hidden',
  },
  header: {
    position: 'sticky',
    top: 0,
    width: '100%',
    maxWidth: '1280px',
    margin: '1rem auto 0 auto',
    borderRadius: '16px',
    padding: '0.85rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  logoText: {
    fontSize: '1.4rem',
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #ffffff 0%, var(--text-secondary) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.03em',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  hero: {
    maxWidth: '850px',
    textAlign: 'center',
    padding: '6rem 1.5rem 4rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  heroBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.45rem 1rem',
    borderRadius: '9999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '2rem',
    border: '1px solid rgba(255,255,255,0.06)',
    letterSpacing: '0.02em',
  },
  heroTitle: {
    fontSize: '3.75rem',
    lineHeight: 1.15,
    fontWeight: 800,
    marginBottom: '1.5rem',
    letterSpacing: '-0.04em',
  },
  accentText: {
    background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '680px',
    marginBottom: '2.5rem',
  },
  heroCtas: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '4rem',
  },
  largeBtn: {
    padding: '0.9rem 2rem',
    fontSize: '1.05rem',
  },
  previewContainer: {
    width: '100%',
    maxWidth: '900px',
    aspectRatio: '16/9',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  previewHeader: {
    height: '40px',
    background: 'rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 1rem',
    position: 'relative',
  },
  windowDots: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '11px',
    height: '11px',
    borderRadius: '50%',
  },
  previewTitle: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  previewContent: {
    height: 'calc(100% - 40px)',
    display: 'flex',
  },
  mockSidebar: {
    width: '18%',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mockLinkActive: {
    height: '18px',
    background: 'rgba(99, 102, 241, 0.25)',
    borderRadius: '4px',
    borderLeft: '2px solid var(--accent-primary)',
  },
  mockLink: {
    height: '18px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '4px',
  },
  mockBody: {
    flex: 1,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  mockGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  mockCard: {
    borderRadius: '8px',
    padding: '0.8rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  mockCardLabel: {
    fontSize: '0.65rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  mockCardVal: {
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  mockKanban: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
  },
  mockCol: {
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  mockColHeader: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  mockTask: {
    height: '60px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  featuresSection: {
    width: '100%',
    maxWidth: '1100px',
    padding: '6rem 1.5rem',
    textAlign: 'center',
  },
  featuresHeading: {
    fontSize: '2.25rem',
    marginBottom: '0.75rem',
    letterSpacing: '-0.03em',
  },
  featuresSubheading: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    marginBottom: '3.5rem',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  iconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  featureTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
  footer: {
    width: '100%',
    maxWidth: '1280px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '2rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  footerLinks: {
    display: 'flex',
    gap: '1.5rem',
  },
  footerLink: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
};
