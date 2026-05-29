'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { 
  Folder, 
  Plus, 
  Loader2, 
  FolderOpen,
  ArrowRight,
  X,
  FileText
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadProjects = async () => {
    try {
      const res = await fetchApi('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('[Projects] Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName) return;
    setError(null);
    setCreating(true);
    try {
      await fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: projectName,
          description: projectDesc || undefined,
        }),
      });
      setProjectName('');
      setProjectDesc('');
      setModalOpen(false);
      loadProjects();
    } catch (err: any) {
      setError(err?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading your projects...</span>
      </div>
    );
  }

  return (
    <div style={styles.container} className="anim-fade-in">
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Workspace Projects</h1>
          <p style={styles.subtitle}>Select a project to view its Kanban task board.</p>
        </div>
        {canCreate && (
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div style={styles.emptyState} className="glass-card">
          <FolderOpen size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No projects available</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
            Projects house your task boards. Create a project to start planning with your team.
          </p>
          {canCreate && (
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus size={16} /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {projects.map((proj) => (
            <Link key={proj.id} href={`/dashboard/projects/${proj.id}`} style={styles.card} className="glass-card">
              <div style={styles.cardTop}>
                <div style={styles.iconBox}>
                  <Folder size={20} color="var(--accent-primary)" />
                </div>
                <h3 style={styles.projName}>{proj.name}</h3>
              </div>
              <p style={styles.projDesc}>{proj.description || 'No description provided.'}</p>
              <div style={styles.cardFooter}>
                <span style={styles.dateLabel}>
                  Created {new Date(proj.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
                <span style={styles.actionLabel}>
                  Open Board <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Create Project Modal ── */}
      {modalOpen && (
        <>
          <div style={styles.backdrop} onClick={() => setModalOpen(false)}></div>
          <div style={styles.modal} className="glass anim-scale-in">
            <div style={styles.modalHeader}>
              <h3>Create New Project</h3>
              <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            
            {error && <div style={styles.modalError}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label className="label-glass">Project Name</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Q3 Product Launch"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="label-glass">Description (Optional)</label>
                <textarea
                  className="input-glass"
                  placeholder="What is this project about?"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.85rem',
    fontWeight: 700,
    marginBottom: '0.25rem',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text-secondary)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    cursor: 'pointer',
    height: '200px',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projName: {
    fontSize: '1.1rem',
    fontWeight: 600,
  },
  projDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '0.75rem',
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  actionLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: '480px',
    borderRadius: '16px',
    padding: '2rem 1.5rem',
    zIndex: 1001,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  modalError: {
    background: 'var(--error-bg)',
    color: '#ef4444',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.8rem',
    marginBottom: '1rem',
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
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1rem',
  },
};
