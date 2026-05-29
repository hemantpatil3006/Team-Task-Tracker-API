'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  Folder, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  ArrowRight,
  TrendingUp,
  Loader2,
  Calendar
} from 'lucide-react';

interface UserAnalyticsCompletion {
  user: {
    id: string;
    name: string;
    email: string;
  };
  avgCompletionHours: number;
  completedTaskCount: number;
}

interface UserAnalyticsOverdue {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  overdueCount: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completionData, setCompletionData] = useState<UserAnalyticsCompletion[] | null>(null);
  const [overdueData, setOverdueData] = useState<UserAnalyticsOverdue[] | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const isStaff = user?.role === 'ADMIN' || user?.role === 'MANAGER';

        const [projRes, completionRes, overdueRes] = await Promise.all([
          fetchApi('/projects').catch((err) => {
            console.warn('[Dashboard] Error fetching projects:', err);
            return { data: [] };
          }),
          isStaff
            ? fetchApi('/analytics/completion').catch((err) => {
                console.warn('[Dashboard] Error fetching completion analytics:', err);
                return { data: [] };
              })
            : Promise.resolve({ data: [] }),
          isStaff
            ? fetchApi('/analytics/overdue').catch((err) => {
                console.warn('[Dashboard] Error fetching overdue analytics:', err);
                return { data: [] };
              })
            : Promise.resolve({ data: [] }),
        ]);

        setProjects(projRes?.data ? projRes.data.slice(0, 3) : []);
        setCompletionData(completionRes?.data || []);
        setOverdueData(overdueRes?.data || []);
      } catch (err) {
        console.warn('[Dashboard] Unexpected error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading workspace data...</span>
      </div>
    );
  }

  const isStaff = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // Sum completed tasks count across all users
  const completedCount = isStaff && completionData && Array.isArray(completionData)
    ? completionData.reduce((sum, item) => sum + (item.completedTaskCount || 0), 0)
    : 0;

  // Calculate average resolution time (converting average hours to days)
  const totalAvgHours = isStaff && completionData && Array.isArray(completionData) && completionData.length > 0
    ? completionData.reduce((sum, item) => sum + (item.avgCompletionHours || 0), 0) / completionData.length
    : 0;
  const avgTime = totalAvgHours > 0
    ? `${(totalAvgHours / 24).toFixed(1)} days`
    : 'N/A';

  // Sum overdue tasks count across all users
  const overdueCount = isStaff && overdueData && Array.isArray(overdueData)
    ? overdueData.reduce((sum, item) => sum + (item.overdueCount || 0), 0)
    : 0;

  return (
    <div style={styles.container} className="anim-fade-in">
      <div style={styles.welcomeRow}>
        <div>
          <h1 style={styles.welcomeTitle}>Welcome back, {user?.name.split(' ')[0]} 👋</h1>
          <p style={styles.welcomeSubtitle}>Here is the overview for your organization today.</p>
        </div>
        <div style={styles.dateBadge} className="glass">
          <Calendar size={14} color="var(--accent-primary)" />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid-dashboard" style={styles.statsGrid}>
        <div className="glass-card" style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={styles.statLabel}>Active Projects</span>
              <h3 style={styles.statValue}>{projects.length}</h3>
            </div>
            <div style={{ ...styles.iconContainer, background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
              <Folder size={20} />
            </div>
          </div>
          <div style={styles.statFooter}>
            <Link href="/dashboard/projects" style={styles.statLink}>
              View all projects <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={styles.statLabel}>Tasks Completed</span>
              <h3 style={styles.statValue}>{completedCount}</h3>
            </div>
            <div style={{ ...styles.iconContainer, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.trendLabel}>
              <TrendingUp size={14} style={{ marginRight: '0.25rem' }} /> In this workspace
            </span>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={styles.statLabel}>Overdue Tasks</span>
              <h3 style={{ ...styles.statValue, color: overdueCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                {overdueCount}
              </h3>
            </div>
            <div style={{ 
              ...styles.iconContainer, 
              background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)', 
              color: overdueCount > 0 ? '#ef4444' : 'var(--text-muted)' 
            }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={styles.statFooter}>
            <span style={{ ...styles.trendLabel, color: overdueCount > 0 ? '#ef4444' : 'var(--text-muted)' }}>
              Requires attention
            </span>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={styles.statLabel}>Avg. Resolution Time</span>
              <h3 style={styles.statValue}>{avgTime}</h3>
            </div>
            <div style={{ ...styles.iconContainer, background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.trendLabel}>From creation to completion</span>
          </div>
        </div>
      </div>

      {/* ── Charts & Overdue Section ── */}
      <div style={styles.dashboardSplit} className="split-layout-dashboard">
        {/* Project Section */}
        <div style={styles.splitMain} className="glass-card">
          <div style={styles.sectionHeader}>
            <h3>Your Recent Projects</h3>
            <Link href="/dashboard/projects" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
              All Projects
            </Link>
          </div>

          <div style={styles.projectList}>
            {projects.length === 0 ? (
              <div style={styles.emptyState}>
                <Folder size={32} color="var(--text-muted)" />
                <p>No projects found. Create your first project to get started!</p>
                <Link href="/dashboard/projects" className="btn-primary" style={{ marginTop: '0.75rem' }}>
                  Create Project
                </Link>
              </div>
            ) : (
              projects.map((proj: any) => (
                <Link key={proj.id} href={`/dashboard/projects/${proj.id}`} style={styles.projectListItem} className="glass">
                  <div>
                    <h4 style={styles.projName}>{proj.name}</h4>
                    <p style={styles.projDesc}>{proj.description || 'No description provided.'}</p>
                  </div>
                  <ArrowRight size={18} color="var(--text-muted)" style={styles.arrowHover} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Overdue Task Panel */}
        <div style={styles.splitSide} className="glass-card">
          <h3 style={{ marginBottom: '1.25rem' }}>Attention Required</h3>
          
          <div style={styles.overdueList}>
            {!isStaff ? (
              <div style={styles.emptyOverdue}>
                <CheckCircle2 size={32} color="#10b981" />
                <p>Welcome! View your assigned tasks on the project board.</p>
              </div>
            ) : overdueCount === 0 ? (
              <div style={styles.emptyOverdue}>
                <CheckCircle2 size={32} color="#10b981" />
                <p>All clean! No overdue tasks in this workspace.</p>
              </div>
            ) : (
              overdueData && Array.isArray(overdueData) && overdueData
                .filter((item) => item.overdueCount > 0)
                .map((item, index) => (
                  <div key={item.user?.id || `unassigned-${index}`} style={styles.overdueItem} className="glass">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <span style={styles.overdueTitle}>{item.user?.name || 'Unassigned Tasks'}</span>
                      <span style={styles.overdueProject}>{item.user?.email || 'No email'}</span>
                    </div>
                    <span style={styles.overdueTag}>
                      {item.overdueCount} overdue
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  loadingContainer: {
    height: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: 'var(--text-secondary)',
  },
  welcomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: '1.85rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
  },
  welcomeSubtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  dateBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.85rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  statsGrid: {
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '140px',
  },
  statLabel: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 800,
    marginTop: '0.5rem',
    letterSpacing: '-0.02em',
  },
  iconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statFooter: {
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  statLink: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--accent-primary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  trendLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  dashboardSplit: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  splitMain: {
    flex: 1.6,
    display: 'flex',
    flexDirection: 'column',
  },
  splitSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2.5rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
  },
  projectListItem: {
    padding: '1.25rem',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  projName: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  projDesc: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  arrowHover: {
    transition: 'transform 0.2s ease',
  },
  overdueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  emptyOverdue: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    textAlign: 'center',
    color: 'var(--text-secondary)',
    fontSize: '0.85rem',
  },
  overdueItem: {
    padding: '1rem',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  overdueTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  overdueProject: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  overdueTag: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#ef4444',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
};
