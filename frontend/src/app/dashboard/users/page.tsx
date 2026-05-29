'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth, User } from '@/lib/auth';
import { 
  Users, 
  ShieldCheck, 
  Trash, 
  Loader2, 
  ShieldAlert, 
  ArrowLeft,
  UserCog,
  X,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function UserDirectoryPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Role Edit Modal
  const [editUser, setEditUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<'ADMIN' | 'MANAGER' | 'MEMBER'>('MEMBER');
  const [modalOpen, setModalOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const loadUsers = async () => {
    try {
      setError(null);
      const res = await fetchApi('/users');
      setUsersList(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch users directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  // If user is not admin, deny access immediately
  if (!loading && !isAdmin) {
    return (
      <div style={styles.forbiddenContainer} className="glass-card anim-scale-in">
        <ShieldAlert size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Access Denied</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1.5rem' }}>
          You do not have administrative permissions to view or manage the organization users directory.
        </p>
        <Link href="/dashboard" className="btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleOpenEdit = (target: User) => {
    setEditUser(target);
    setTargetRole(target.role);
    setModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setSavingRole(true);
    try {
      await fetchApi(`/users/${editUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: targetRole }),
      });
      setModalOpen(false);
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to update user role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteUser = async (targetId: string, targetName: string) => {
    if (targetId === user?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to remove user "${targetName}" from the organization? This will permanently delete their account.`)) return;

    try {
      await fetchApi(`/users/${targetId}`, {
        method: 'DELETE',
      });
      loadUsers();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading users directory...</span>
      </div>
    );
  }

  return (
    <div style={styles.container} className="anim-fade-in">
      <div>
        <h1 style={styles.title}>User Directory</h1>
        <p style={styles.subtitle}>Manage organization members, assign roles, and control access permissions.</p>
      </div>

      {error ? (
        <div style={styles.emptyState}>
          <AlertCircle size={40} color="#ef4444" />
          <h3>Error Loading Directory</h3>
          <p>{error}</p>
        </div>
      ) : (
        <div className="glass-card" style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Joined Date</th>
                <th style={{...styles.th, textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} style={styles.tableRow} className="table-row-hover">
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <div style={styles.avatar}>
                        {u.name[0]}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name} {u.id === user?.id && <span style={styles.selfTag}>(You)</span>}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span className={`badge badge-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{...styles.td, textAlign: 'right'}}>
                    <div style={styles.actionGroup}>
                      <button 
                        onClick={() => handleOpenEdit(u)} 
                        style={styles.actionBtn} 
                        className="action-btn-hover"
                        title="Modify User Role"
                      >
                        <UserCog size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.name)} 
                        style={{...styles.actionBtn, color: '#ef4444'}} 
                        className="action-btn-hover"
                        disabled={u.id === user?.id}
                        title="Delete User"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Role Modal ── */}
      {modalOpen && editUser && (
        <>
          <div style={styles.backdrop} onClick={() => setModalOpen(false)}></div>
          <div style={styles.modal} className="glass anim-scale-in">
            <div style={styles.modalHeader}>
              <h3>Modify User Role</h3>
              <button onClick={() => setModalOpen(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} style={styles.form}>
              <div style={styles.userInfoRow}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>User:</span>
                <span style={{ fontWeight: 600 }}>{editUser.name} ({editUser.email})</span>
              </div>

              <div style={styles.inputGroup}>
                <label className="label-glass">Select Workspace Role</label>
                <select
                  className="input-glass"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as any)}
                >
                  <option value="ADMIN">ADMIN (Full access: manage users, projects, tasks)</option>
                  <option value="MANAGER">MANAGER (Manage projects and tasks, assign members)</option>
                  <option value="MEMBER">MEMBER (View and update assigned tasks only)</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary" disabled={savingRole}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingRole}>
                  {savingRole ? (
                    <>
                      <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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
  forbiddenContainer: {
    maxWidth: '500px',
    margin: '10vh auto',
    padding: '3rem 2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
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
  tableCard: {
    padding: 0,
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  tableHeaderRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  th: {
    padding: '1.2rem 1.5rem',
    fontWeight: 700,
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '1.2rem 1.5rem',
    verticalAlign: 'middle',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(99, 102, 241, 0.15)',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.85rem',
    textTransform: 'uppercase',
  },
  selfTag: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'var(--text-muted)',
    marginLeft: '0.25rem',
  },
  actionGroup: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '0.45rem',
    borderRadius: '8px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  userInfoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
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
