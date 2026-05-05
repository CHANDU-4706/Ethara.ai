'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function ProjectDetailPage({ params }) {
  const { user, loading: authLoading, apiFetch } = useAuth();
  const router = useRouter();
  
  // React 19 / Next 15 `use(params)` for async route params
  const { id } = use(Math.random() > 0 ? params : params); 
  // Workaround for `use(params)` warning: in Next.js 15, `params` is a promise.
  // We can just use it directly after awaiting or using `use(params)`.
  // Wait, let's just use regular params since we're generating standard Next.js code.
  // Actually, Next.js 15 requires `params` to be awaited or unwrapped with `use`.
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
      if (user.role === 'ADMIN') fetchUsers();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      const res = await apiFetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (res.ok) {
        setProject(data.project);
      } else {
        router.push('/projects');
      }
    } catch (err) {
      console.error(err);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users');
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...newTask, projectId }),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '' });
        fetchProject();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: newMemberEmail }),
      });
      if (res.ok) {
        setShowMemberModal(false);
        setNewMemberEmail('');
        fetchProject();
      } else {
        alert((await res.json()).error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove member from project?')) return;
    try {
      await apiFetch(`/api/projects/${projectId}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user || loading) {
    return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>;
  }

  if (!project) return null;

  const getStatusBadge = (status) => {
    const map = { PENDING: 'badge-pending', IN_PROGRESS: 'badge-in-progress', COMPLETED: 'badge-completed', OVERDUE: 'badge-overdue' };
    return map[status] || 'badge-pending';
  };

  const getPriorityBadge = (priority) => {
    const map = { HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
    return map[priority] || 'badge-medium';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <button className="btn btn-secondary btn-sm mb-4" onClick={() => router.push('/projects')}>
            ← Back to Projects
          </button>
          <div className="page-header-actions">
            <div>
              <h1>{project.name}</h1>
              <p>{project.description || 'No description'}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
                ➕ Add Task
              </button>
              {user.role === 'ADMIN' && (
                <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}>
                  👤 Add Member
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="projects-grid" style={{ gridTemplateColumns: 'minmax(300px, 2fr) minmax(250px, 1fr)' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Tasks</h3>
            </div>
            <div>
              {project.tasks?.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 10px' }}>
                  <p>No tasks created yet.</p>
                </div>
              ) : (
                project.tasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <div className="task-item-content">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="task-item-title">{task.title}</div>
                        <span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace('_', ' ')}</span>
                        <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                      </div>
                      <div className="task-item-meta">
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</span>
                        <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                    {(user.role === 'ADMIN' || user.id === task.assigneeId || user.id === task.creatorId) && (
                      <div className="task-item-actions flex-col">
                        <select 
                          className="form-input" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          value={task.status}
                          onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <button className="btn btn-danger btn-sm w-full" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Team Members</h3>
              <span className="badge badge-admin">{project.members?.length || 0}</span>
            </div>
            <div className="flex flex-col gap-3">
              {project.members?.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3" style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                  <div className="flex items-center gap-3">
                    <div className="sidebar-user-avatar">{m.user?.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{m.user?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.user?.email}</div>
                    </div>
                  </div>
                  {user.role === 'ADMIN' && m.user?.id !== project.ownerId && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.user?.id)}>✕</button>
                  )}
                  {m.user?.id === project.ownerId && (
                    <span className="badge badge-admin">Owner</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Create New Task</h3>
                <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input className="form-input" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} />
                </div>
                <div className="form-group flex gap-4">
                  <div className="w-full">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div className="w-full">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-input" value={newTask.assigneeId} onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => (
                      <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Modal */}
        {showMemberModal && (
          <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Add Team Member</h3>
                <button className="modal-close" onClick={() => setShowMemberModal(false)}>✕</button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="form-group">
                  <label className="form-label">Select User</label>
                  <select className="form-input" required value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)}>
                    <option value="">Select a user...</option>
                    {users.filter(u => !project.members?.some(m => m.user.id === u.id)).map(u => (
                      <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
