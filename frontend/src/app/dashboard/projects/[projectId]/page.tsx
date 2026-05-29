'use client';

import React, { useEffect, useState, use } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth, User } from '@/lib/auth';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  User as UserIcon,
  Calendar,
  AlertCircle,
  X,
  Edit,
  Trash,
  MoveRight
} from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
  dueDate: string | null;
  assigneeId: string | null;
  assignee?: { id: string; name: string };
  projectId: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

export default function ProjectBoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { user } = useAuth();
  
  // App States
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // Modals State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Status Transition Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [transitioningTask, setTransitioningTask] = useState<Task | null>(null);
  const [targetStatus, setTargetStatus] = useState<Task['status']>('TODO');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const loadData = async () => {
    try {
      setError(null);
      // Fetch project details, tasks, and users
      const [projRes, tasksRes, usersRes] = await Promise.all([
        fetchApi(`/projects/${projectId}`),
        fetchApi(`/projects/${projectId}/tasks`),
        fetchApi('/users').catch(() => ({ data: [] })), // Fail gracefully if non-admin can't list users
      ]);

      setProject(projRes.data);
      setTasks(tasksRes.data);
      setMembers(usersRes.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load project board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && projectId) {
      loadData();
    }
  }, [user, projectId]);

  // Handle Task Creation/Edit Submission
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    setSavingTask(true);
    setError(null);

    const payload = {
      title: taskTitle,
      description: taskDesc || undefined,
      priority: taskPriority,
      assigneeId: taskAssignee || undefined,
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
    };

    try {
      if (selectedTask) {
        // Edit Task
        await fetchApi(`/projects/${projectId}/tasks/${selectedTask.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        // Create Task
        await fetchApi(`/projects/${projectId}/tasks`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      
      // Reset & Reload
      closeTaskModal();
      loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setSelectedTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('MEDIUM');
    setTaskAssignee('');
    setTaskDueDate('');
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    setTaskAssignee(task.assigneeId || '');
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetchApi(`/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete task');
    }
  };

  // Open the status transition prompt
  const openTransitionModal = (task: Task, status: Task['status']) => {
    setTransitioningTask(task);
    setTargetStatus(status);
    setTransitionReason('');
    setTransitionError(null);
    setStatusModalOpen(true);
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningTask) return;
    setTransitioning(true);
    setTransitionError(null);

    try {
      await fetchApi(`/projects/${projectId}/tasks/${transitioningTask.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: targetStatus,
          reason: transitionReason || undefined,
        }),
      });
      setStatusModalOpen(false);
      loadData();
    } catch (err: any) {
      setTransitionError(err?.message || 'Invalid status transition');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading Kanban board...</span>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div style={styles.emptyState}>
        <AlertCircle size={40} color="#ef4444" />
        <h3>Error Loading Board</h3>
        <p>{error}</p>
        <Link href="/dashboard/projects" className="btn-secondary" style={{ marginTop: '1rem' }}>
          Back to Projects
        </Link>
      </div>
    );
  }

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
      (t.description?.toLowerCase().includes(search.toLowerCase()) || false);
    const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
    const matchesAssignee = assigneeFilter ? t.assigneeId === assigneeFilter : true;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  const columns: Array<{ label: string; status: Task['status'] }> = [
    { label: 'To Do', status: 'TODO' },
    { label: 'In Progress', status: 'IN_PROGRESS' },
    { label: 'In Review', status: 'IN_REVIEW' },
    { label: 'Blocked', status: 'BLOCKED' },
    { label: 'Done', status: 'DONE' },
  ];

  return (
    <div style={styles.container} className="anim-fade-in">
      {/* Breadcrumbs / Header */}
      <div style={styles.headerRow}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={styles.breadcrumb}>
            <Link href="/dashboard/projects" style={styles.backLink}>
              <ArrowLeft size={16} /> Projects
            </Link>
            <ChevronRight size={14} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{project?.name}</span>
          </div>
          <h1 style={styles.title}>{project?.name} Board</h1>
          <p style={styles.subtitle}>{project?.description || 'No description provided.'}</p>
        </div>

        {canManage && (
          <button onClick={() => setTaskModalOpen(true)} className="btn-primary">
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div style={styles.filterBar} className="glass filter-bar-responsive">
        <div style={styles.searchWrapper}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            className="input-glass"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem', height: '40px' }}
          />
        </div>

        <div style={styles.filtersGroup}>
          <div style={styles.filterSelectWrapper}>
            <Filter size={14} style={styles.filterIcon} />
            <select
              className="input-glass"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ paddingLeft: '2.25rem', height: '40px', width: '130px', appearance: 'none' }}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div style={styles.filterSelectWrapper}>
            <UserIcon size={14} style={styles.filterIcon} />
            <select
              className="input-glass"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              style={{ paddingLeft: '2.25rem', height: '40px', width: '150px', appearance: 'none' }}
            >
              <option value="">All Assignees</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Kanban Columns ── */}
      <div style={styles.board}>
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} style={styles.column} className="glass">
              <div style={styles.columnHeader}>
                <span style={styles.columnTitle}>{col.label}</span>
                <span style={styles.columnCount} className="glass">
                  {colTasks.length}
                </span>
              </div>

              <div style={styles.tasksList}>
                {colTasks.map((task) => (
                  <div key={task.id} style={styles.taskCard} className="glass anim-scale-in">
                    <div style={styles.taskTop}>
                      <span className={`badge badge-${task.priority.toLowerCase()}`} style={{ fontSize: '0.6rem' }}>
                        {task.priority}
                      </span>
                      {canManage && (
                        <div style={styles.taskActions}>
                          <button onClick={() => openEditModal(task)} style={styles.actionBtn}>
                            <Edit size={12} />
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} style={{...styles.actionBtn, color: '#ef4444'}}>
                            <Trash size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 style={styles.taskTitle}>{task.title}</h4>
                    {task.description && <p style={styles.taskDesc}>{task.description}</p>}

                    <div style={styles.taskMetadata}>
                      {task.assignee ? (
                        <div style={styles.assignee}>
                          <div style={styles.miniAvatar}>
                            {task.assignee.name[0]}
                          </div>
                          <span>{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unassigned</span>
                      )}

                      {task.dueDate && (
                        <div style={styles.dueDateRow}>
                          <Calendar size={12} />
                          <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Move Row */}
                    <div style={styles.moveRow}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TRANSITION TO:</span>
                      <div style={styles.moveBtnGroup}>
                        {columns
                          .filter((c) => c.status !== task.status)
                          .map((c) => (
                            <button
                              key={c.status}
                              onClick={() => openTransitionModal(task, c.status)}
                              style={styles.moveBtn}
                              title={`Move to ${c.label}`}
                            >
                              {c.label.split(' ')[0]}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create / Edit Task Modal ── */}
      {taskModalOpen && (
        <>
          <div style={styles.backdrop} onClick={closeTaskModal}></div>
          <div style={styles.modal} className="glass anim-scale-in">
            <div style={styles.modalHeader}>
              <h3>{selectedTask ? 'Edit Task' : 'Add Task'}</h3>
              <button onClick={closeTaskModal} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} style={styles.form}>
              <div style={styles.inputGroup}>
                <label className="label-glass">Task Title</label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="e.g. Design landing page"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="label-glass">Description (Optional)</label>
                <textarea
                  className="input-glass"
                  placeholder="Provide scope, links, or criteria..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>

              <div style={styles.row}>
                <div style={{...styles.inputGroup, flex: 1}}>
                  <label className="label-glass">Priority</label>
                  <select
                    className="input-glass"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div style={{...styles.inputGroup, flex: 1}}>
                  <label className="label-glass">Assignee</label>
                  <select
                    className="input-glass"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label className="label-glass">Due Date</label>
                <input
                  type="date"
                  className="input-glass"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={closeTaskModal} className="btn-secondary" disabled={savingTask}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={savingTask}>
                  {savingTask ? (
                    <>
                      <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    'Save Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Status Transition Modal ── */}
      {statusModalOpen && transitioningTask && (
        <>
          <div style={styles.backdrop} onClick={() => setStatusModalOpen(false)}></div>
          <div style={styles.modal} className="glass anim-scale-in">
            <div style={styles.modalHeader}>
              <h3>Confirm Transition</h3>
              <button onClick={() => setStatusModalOpen(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {transitionError && <div style={styles.modalError}>{transitionError}</div>}

            <form onSubmit={handleStatusTransition} style={styles.form}>
              <div style={styles.transitionText}>
                <span>Move task <strong>&quot;{transitioningTask.title}&quot;</strong>:</span>
                <div style={styles.transitionVisual}>
                  <span className={`badge badge-${transitioningTask.status.toLowerCase()}`}>
                    {transitioningTask.status}
                  </span>
                  <MoveRight size={18} color="var(--text-muted)" />
                  <span className={`badge badge-${targetStatus.toLowerCase()}`}>
                    {targetStatus}
                  </span>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label className="label-glass">Reason for status change</label>
                <textarea
                  className="input-glass"
                  placeholder="e.g. Development complete, code submitted for review"
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setStatusModalOpen(false)} className="btn-secondary" disabled={transitioning}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={transitioning}>
                  {transitioning ? (
                    <>
                      <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                      Moving...
                    </>
                  ) : (
                    'Confirm Move'
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
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.5rem',
    height: '100%',
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
    alignItems: 'flex-start',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    marginBottom: '0.5rem',
  },
  backLink: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
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
  filterBar: {
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    maxWidth: '400px',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    color: 'var(--text-muted)',
  },
  filtersGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  filterSelectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  filterIcon: {
    position: 'absolute',
    left: '0.85rem',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  board: {
    display: 'flex',
    gap: '1rem',
    overflowX: 'auto',
    alignItems: 'flex-start',
    flex: 1,
    paddingBottom: '1rem',
  },
  column: {
    width: '280px',
    minWidth: '280px',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: 'calc(100vh - 240px)',
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnTitle: {
    fontSize: '0.85rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  },
  columnCount: {
    padding: '0.15rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: 'rgba(255,255,255,0.03)',
  },
  tasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    flex: 1,
  },
  taskCard: {
    padding: '1rem',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    transition: 'border-color 0.2s',
  },
  taskTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskActions: {
    display: 'flex',
    gap: '0.4rem',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '0.15rem',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  taskTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  taskDesc: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  taskMetadata: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
    paddingTop: '0.65rem',
  },
  assignee: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  miniAvatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(99, 102, 241, 0.2)',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.65rem',
    textTransform: 'uppercase',
  },
  dueDateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
  },
  moveRow: {
    borderTop: '1px dotted rgba(255,255,255,0.06)',
    paddingTop: '0.65rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  moveBtnGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
  },
  moveBtn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'var(--text-muted)',
    fontSize: '0.65rem',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
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
    maxWidth: '500px',
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
    marginBottom: '1.25rem',
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
  row: {
    display: 'flex',
    gap: '1rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  transitionText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '0.25rem',
  },
  transitionVisual: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '8px',
    alignSelf: 'flex-start',
  },
};
