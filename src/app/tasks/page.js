'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function TasksPage() {
  const { user, loading: authLoading, apiFetch } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, statusFilter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/api/tasks?status=${statusFilter}` : '/api/tasks';
      const res = await apiFetch(url);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || !user) {
    return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>;
  }

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
          <div className="page-header-actions">
            <div>
              <h1>All Tasks</h1>
              <p>Manage and track all tasks across your projects</p>
            </div>
            <div>
              <select 
                className="form-input" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tasks</h3>
            <span className="badge badge-admin">{tasks.length}</span>
          </div>
          
          {loading ? (
             <div className="loading-spinner"><div className="spinner"></div></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <h3>No tasks found</h3>
              <p>{statusFilter ? 'No tasks match the selected filter.' : 'You do not have any tasks yet.'}</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Status / Priority</th>
                    <th>Assignee</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{task.description?.substring(0, 50)}...</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => router.push(`/projects/${task.projectId}`)}>
                          {task.project?.name}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <span className={`badge ${getStatusBadge(task.status)}`}>{task.status.replace('_', ' ')}</span>
                          <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{task.assignee?.name || 'Unassigned'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <select 
                            className="form-input" 
                            style={{ padding: '4px 8px', fontSize: '12px', minWidth: '120px' }}
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                            disabled={user.role !== 'ADMIN' && user.id !== task.assigneeId && user.id !== task.creatorId}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          {(user.role === 'ADMIN' || user.id === task.creatorId) && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.id)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
